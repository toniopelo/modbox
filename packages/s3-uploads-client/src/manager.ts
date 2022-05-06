import {
  CancellableUpload,
  InitiatedUploadWithFile,
  MultipartUploadChunk,
  OneUploadCompleteCallback,
  PendingChunkUpload,
  PresignedRequestInfo,
  SingleFileUploadChunk,
  UploadChunk,
  UploadCompleteCallback,
  UploadedChunk,
  UploadedFile,
  UploadErrorCallback,
  UploadMode,
  UploadProgressCallback,
} from './types'

type ChunkEtagCache = { [partNumber: number]: string };

const _getCache = (uploadId: string) =>
  JSON.parse(localStorage.getItem(`s3-upload-${uploadId}`) || '{}') as ChunkEtagCache;

const _storeCache = (uploadId: string, cache: ChunkEtagCache) =>
  localStorage.setItem(`s3-upload-${uploadId}`, JSON.stringify(cache));

const removeCache = (uploadId: string) => localStorage.removeItem(`s3-upload-${uploadId}`);

const cacheChunkEtag = (uploadedChunk: UploadedChunk) => {
  const cache = _getCache(uploadedChunk.uploadId);
  cache[uploadedChunk.partNumber] = uploadedChunk.etag;
  _storeCache(uploadedChunk.uploadId, cache);
};

const getCachedChunkEtag = (uploadId: string, partNumber: number) => 
_getCache(uploadId)[partNumber];

export class UploadManager {
  private onProgress: UploadProgressCallback | null = null
  private onComplete: UploadCompleteCallback | null = null
  private onUploadComplete: OneUploadCompleteCallback | null = null
  private onError: UploadErrorCallback | null = null
  private getPartRequest:
    | ((upload: MultipartUploadChunk) => Promise<PresignedRequestInfo>)
    | null = null
  private uploads: InitiatedUploadWithFile[]
  private chunks: UploadChunk[] = []
  private totalChunksCount = 0
  private completedChunksCount = 0
  private maxConcurrent: number
  private cancelAllOnError: boolean
  private isCanceled = false
  private pendingChunkUploads: PendingChunkUpload[] = []
  private completedChunks: UploadedChunk[] = []
  private completedUploads: UploadedFile[] = []
  private uploadPromise: Promise<UploadedFile[]>
  private resolvePromise: ((value: UploadedFile[]) => void) | null = null
  private rejectPromise: ((error: Error | string) => void) | null = null

  constructor({
    uploads,
    maxConcurrent,
    cancelAllOnError = false,
    onProgress,
    onComplete,
    onUploadComplete,
    onError,
    getPartRequest,
  }: {
    onProgress?: UploadProgressCallback
    onComplete?: UploadCompleteCallback
    onUploadComplete?: OneUploadCompleteCallback
    onError?: UploadErrorCallback
    cancelAllOnError?: boolean
    uploads: InitiatedUploadWithFile[]
    maxConcurrent: number
    getPartRequest?: (
      upload: MultipartUploadChunk,
    ) => Promise<PresignedRequestInfo>
  }) {
    this.onProgress = onProgress || null
    this.onComplete = onComplete || null
    this.onUploadComplete = onUploadComplete || null
    this.onError = onError || null
    this.getPartRequest = getPartRequest || null
    this.maxConcurrent = maxConcurrent
    this.cancelAllOnError = cancelAllOnError
    this.uploads = uploads

    this.uploadPromise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve
      this.rejectPromise = reject
    })
  }

  async prepareChunks() {
    const chunks = await this.uploads.reduce<Promise<UploadChunk[]>>(
      async (acc, u) => {
        const otherParts = await acc

        // For single file upload, the file represents a single chunk
        if (u.uploadMode === UploadMode.Single) {
          return [
            ...otherParts,
            {
              uploadMode: UploadMode.Single,
              uploadType: u.uploadType,
              uploadId: u.uploadId,
              partNumber: 0,
              request: u.presignedRequest,
              file: u.file,
              key: u.key,
            },
          ]
        }

        // For multipart upload, extract part from file and format a chunk that will
        // be passed to the UploadManager
        const fileBuffer = await u.file.arrayBuffer()
        const parts = Array(u.partsCount)
          .fill(null)
          .map<UploadChunk>((_, idx) => {
            const start = idx * u.chunkSize
            const end = start + u.chunkSize
            const filePart = fileBuffer.slice(start, end)

            return {
              uploadMode: UploadMode.Multipart,
              uploadType: u.uploadType,
              filePart,
              key: u.key,
              uploadId: u.uploadId,
              partNumber: idx + 1,
            }
          }, [])

        return [...otherParts, ...parts]
      },
      Promise.resolve([]),
    )

    this.chunks = chunks
    this.totalChunksCount = chunks.length
    this.onProgress &&
      this.onProgress({
        completedChunksCount: this.completedChunksCount,
        totalChunksCount: this.totalChunksCount,
      })
  }

  async start(): Promise<CancellableUpload[]> {
    await this.prepareChunks()
    this.upload()

    return this.uploads.map((u) => ({
      ...u,
      cancel: () => this.cancelOne(u.uploadId),
    }))
  }

  upload(): void {
    if (this.isCanceled) {
      return
    }
    if (this.completedChunks.length === this.totalChunksCount) {
      this.complete()
      return
    }

    const countToLaunch = this.maxConcurrent - this.pendingChunkUploads.length
    const toLaunch = this.chunks.slice(
      this.completedChunksCount + this.pendingChunkUploads.length,
      this.completedChunksCount +
        this.pendingChunkUploads.length +
        countToLaunch,
    )
    this.pendingChunkUploads.push(
      ...toLaunch.map((chunk) => {
        const pending = this.uploadChunk(chunk)
        void pending.promise
          .then((completedChunk) => {
            this.chunkCompleted(completedChunk)
            this.upload()
          })
          .catch((e: Error) => {
            this.chunkErrored(pending, e)
            this.upload()
          })

        return pending
      }),
    )
  }

  completeOne(upload: InitiatedUploadWithFile): void {
    const uploadedFileProps = {
      uploadId: upload.uploadId,
      bucket: upload.bucket,
      key: encodeURIComponent(encodeURIComponent(upload.key)),
      filename: upload.filename,
      mimetype: upload.mimetype,
      size: upload.size,
    }

    // If uploadMode is multipart, we gather the uploaded chunks
    // and add them to the uploaded file object
    const parts =
      upload.uploadMode === UploadMode.Multipart
        ? this.completedChunks.reduce<
            Omit<UploadedChunk, 'uploadId' | 'uploadMode'>[]
          >((fileParts, c) => {
            const { uploadId, ...part } = c
            return uploadId === upload.uploadId
              ? fileParts.concat(part)
              : fileParts
          }, [])
        : []
    // Sort parts to ensure they are in ascending order
    parts.sort((a, b) => a.partNumber - b.partNumber)

    // Add the completed upload to the list of completed uploads
    const uploadedFile =
      upload.uploadMode === UploadMode.Multipart
        ? {
            uploadMode: upload.uploadMode,
            ...uploadedFileProps,
            parts,
          }
        : {
            uploadMode: upload.uploadMode,
            ...uploadedFileProps,
          }
    this.completedUploads.push(uploadedFile)

    // Send completed upload event if callback is provided
    this.onUploadComplete && this.onUploadComplete(uploadedFile, upload.file)
    removeCache(uploadedFile.uploadId);
  }

  complete(): void {
    this.onComplete && this.onComplete(this.completedUploads)
    this.resolvePromise && this.resolvePromise(this.completedUploads)
  }

  promise(): Promise<UploadedFile[]> {
    return this.uploadPromise
  }

  cancel(reason?: string): void {
    this.isCanceled = true
    this.rejectPromise &&
      this.rejectPromise(new Error(reason || 'upload_cancelled'))
    this.pendingChunkUploads.forEach((u) => u.cancel())
  }

  cancelOne(uploadId: string, isError: boolean = false): void {
    // Remove all the chunks associated with the uploadId of the errored chunk
    // From the completed chunks list
    this.completedChunks = this.completedChunks.filter(
      (uploadedChunk) => uploadedChunk.uploadId !== uploadId,
    )
    // From the queued chunks list
    this.chunks = this.chunks.filter((chunk) => chunk.uploadId !== uploadId)
    // From the pending chunks list, and cancel those as well
    this.pendingChunkUploads
      .filter((chunk) => chunk.uploadId === uploadId)
      .forEach((chunk) => chunk.cancel())
    this.pendingChunkUploads = this.pendingChunkUploads.filter(
      (pendingChunkUpload) => pendingChunkUpload.uploadId !== uploadId,
    )
    // Remove the upload itself from the uploads list
    this.uploads = this.uploads.filter((u) => u.uploadId !== uploadId)

    // Update the counters
    this.completedChunksCount = this.completedChunks.length
    this.totalChunksCount = this.chunks.length
    if (!isError) {
      removeCache(uploadId);
    }
  }

  chunkCompleted(uploadedChunk: UploadedChunk): void {
    // Get the chunk associated upload
    const upload = this.uploads.find(
      (u) => u.uploadId === uploadedChunk.uploadId,
    )
    if (!upload) {
      throw new Error('upload_internal_error')
    }

    // Remove the completed upload from the pending upload list
    const pendingUploadIdx = this.pendingChunkUploads.findIndex(
      (pendingUpload) =>
        pendingUpload.uploadId === uploadedChunk.uploadId &&
        pendingUpload.partNumber === uploadedChunk.partNumber,
    )
    this.pendingChunkUploads.splice(pendingUploadIdx, 1)

    // Push completed upload in the completed uploads list
    this.completedChunks.push(uploadedChunk)
    this.completedChunksCount++

    // Determine if this specific upload is complete
    const uploadCompletedChunks = this.completedChunks.filter(
      (c) => c.uploadId === uploadedChunk.uploadId,
    )
    const isUploadComplete = uploadCompletedChunks.length === upload.partsCount
    cacheChunkEtag(uploadedChunk);
    if (isUploadComplete) {
      this.completeOne(upload)
    }

    // If onProgress callback is provided, send progress
    this.onProgress &&
      this.onProgress({
        completedChunksCount: this.completedChunksCount,
        totalChunksCount: this.totalChunksCount,
      })
  }

  chunkErrored(erroredChunk: PendingChunkUpload, error: Error): void {
    // Find the upload associated with the errored chunk
    // If the upload is not found, we cancel it everything as the internal state is corrupted
    const erroredUpload = this.uploads.find(
      (u) => u.uploadId === erroredChunk.uploadId,
    )
    if (!erroredUpload) {
      return this.cancel('upload_internal_error')
    }

    // If onError callback is provided, send error
    this.onError &&
      this.onError({
        error,
        erroredUpload,
      })

    // We cancel all the operations if the settings demand it
    if (this.cancelAllOnError) {
      return this.cancel('upload_internal_error')
    }

    // Else, we only cancel the errored upload
    this.cancelOne(erroredChunk.uploadId, true)
    // If onProgress callback is provided, send updated progress
    this.onProgress &&
      this.onProgress({
        completedChunksCount: this.completedChunksCount,
        totalChunksCount: this.totalChunksCount,
      })
  }

  uploadChunk(chunk: UploadChunk): PendingChunkUpload {
    const abortController =
      typeof AbortController !== 'undefined'
        ? new AbortController()
        : {
            abort: () => {
              return
            },
            signal: null,
          }

    return {
      uploadMode: chunk.uploadMode,
      uploadId: chunk.uploadId,
      partNumber:
        chunk.uploadMode === UploadMode.Multipart ? chunk.partNumber : 0,
      promise:
        chunk.uploadMode === UploadMode.Multipart
          ? this.performMultipartUpload(abortController, chunk)
          : this.performSingleFileUpload(abortController, chunk),
      cancel: abortController.abort.bind(abortController),
    }
  }

  async performSingleFileUpload(
    abortController:
      | AbortController
      | {
          abort: () => void
          signal: null
        },
    chunk: SingleFileUploadChunk,
  ): Promise<UploadedChunk> {
    const form = new FormData()
    chunk.request.fields?.forEach(({ key, value }) => {
      form.append(key, value)
    })
    form.append('file', chunk.file)
    form.append('key', chunk.key)
    form.append('Content-Type', chunk.file.type)

    const response = await fetch(chunk.request.url, {
      method: 'POST',
      body: form,
      signal: abortController.signal,
    })

    if (!response.ok) {
      const textBody = await response.text()

      if (textBody.includes('EntityTooLarge')) {
        throw new Error('file_too_large')
      } else if (textBody.includes('$Content-Type')) {
        throw new Error('unauthorized_file_type')
      }

      throw new Error('upload_internal_error')
    }

    return {
      uploadId: chunk.uploadId,
      partNumber: chunk.partNumber,
      etag: '',
    }
  }

  async performMultipartUpload(
    abortController:
      | AbortController
      | {
          abort: () => void
          signal: null
        },
    chunk: MultipartUploadChunk,
  ): Promise<UploadedChunk> {
    const alreadyUploadedEtag = getCachedChunkEtag(chunk.uploadId, chunk.partNumber);
    if (alreadyUploadedEtag) {
      return {
        etag: alreadyUploadedEtag,
        partNumber: chunk.partNumber,
        uploadId: chunk.uploadId,
      }
    }
    const getPartRequest = async () => {
      // If no getPartRequest handler is provided, we throw an error as we cannot
      // handle multipart uploads
      if (!this.getPartRequest) {
        throw new Error('no_get_part_request_handler_provided')
      }
      // We fetch the part request by calling the user-defined getPartRequest handler
      const result = await this.getPartRequest(chunk)

      return {
        url: result.url,
        headers: result.headers,
        fields: result.fields,
      }
    }

    const request = await getPartRequest()
    const headers = request.headers?.reduce<Record<string, string>>(
      (acc, h) => ({ ...acc, [h.key]: h.value }),
      {},
    )
    const response = await fetch(request.url, {
      method: 'PUT',
      body: chunk.filePart,
      headers,
      signal: abortController.signal,
    })

    const etag = response.headers.get('ETag')
    if (!response.ok || !etag) {
      const textBody = await response.text()

      if (textBody.includes('EntityTooLarge')) {
        throw new Error('file_too_large')
      } else if (textBody.includes('$Content-Type')) {
        throw new Error('unauthorized_file_type')
      }

      throw new Error('upload_internal_error')
    }

    return {
      etag,
      partNumber: chunk.partNumber,
      uploadId: chunk.uploadId,
    }
  }
}
