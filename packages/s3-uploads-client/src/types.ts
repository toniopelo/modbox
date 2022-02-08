/**
 * Internal types
 */

export type UploadType = string

// Values are the exact same as from the @modbox/s3-uploads-server UploadMode enum
export enum UploadMode {
  Multipart = 'Multipart',
  Single = 'Single',
}

export interface FileToUpload {
  mimetype: string
  filename: string
  size: number
}

export interface PresignedRequestInfo {
  url: string
  fields?: Array<{
    key: string
    value: string
  }>
  headers?: {
    key: string
    value: string
  }[]
}

export type PendingChunkUpload = {
  uploadMode: UploadMode
  uploadId: string
  partNumber: number
  promise: Promise<UploadedChunk>
  cancel: () => void
}

export type UploadedChunk = {
  uploadId: string
  etag: string
  partNumber: number
}

export type UploadProgressCallback = (progress: {
  completedChunksCount: number
  totalChunksCount: number
}) => void
export type UploadCompleteCallback = (result: UploadedFile[]) => void
export type OneUploadCompleteCallback = (
  upload: UploadedFile,
  originalFile: File,
) => void
export type UploadErrorCallback = (payload: {
  error: Error
  erroredUpload: InitiatedUploadWithFile
}) => void

export interface MultipartUploadChunk {
  uploadMode: UploadMode.Multipart
  uploadType: UploadType
  uploadId: string
  partNumber: number
  filePart: ArrayBuffer
  key: string
}
export interface SingleFileUploadChunk {
  uploadMode: UploadMode.Single
  uploadType: UploadType
  uploadId: string
  partNumber: number
  request: PresignedRequestInfo
  file: File
  key: string
}
export type UploadChunk = MultipartUploadChunk | SingleFileUploadChunk

export type InitiateOperationConfig = {
  uploadType: UploadType
  maxConcurrentUploads: number
  initiate: UploadInitiator
  getPartRequest?: PartRequestFetcher
}
export type CompleteOperationConfig = {
  uploadType: UploadType
  complete: UploadCompleter
}

/**
 * External types
 */

export interface S3Object {
  url: string
  bucket: string
  key: string
  filename: string
  mimetype: string
  size: number
}

export type UploadedFile = Omit<S3Object, 'url'> &
  (
    | {
        uploadMode: UploadMode.Multipart
        uploadId: string
        parts: { etag: string; partNumber: number }[]
      }
    | {
        uploadMode: UploadMode.Single
        uploadId: string
      }
  )

export type InitiatedUpload =
  | {
      uploadMode: UploadMode.Multipart
      uploadType: UploadType
      filename: string
      mimetype: string
      bucket: string
      key: string
      size: number
      uploadId: string
      chunkSize: number
      partsCount: number
      presignedRequest: null
    }
  | {
      uploadMode: UploadMode.Single
      uploadType: UploadType
      filename: string
      mimetype: string
      bucket: string
      key: string
      size: number
      uploadId: string
      chunkSize: number
      partsCount: number
      presignedRequest: PresignedRequestInfo
    }
export type InitiatedUploadWithFile = InitiatedUpload & { file: File }
export type CancellableUpload = InitiatedUploadWithFile & { cancel: () => void }

export type PendingUpload = {
  uploadType: UploadType
  promise: Promise<UploadedFile>
  upload: CancellableUpload
  cancel: () => void
}
export interface PendingUploads {
  promise: Promise<Awaited<PendingUpload['promise']>[]>
  uploadType: UploadType
  uploads: CancellableUpload[]
  cancelAll: () => void
}

export type ContextBase<UType extends string | number | symbol> = {
  [type in UType]: { initiate: unknown; complete: unknown }
}
export type UploadInitiator = (
  files: File[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
) => Promise<InitiatedUpload[]>
export type UploadCompleter = (
  files: UploadedFile[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
) => Promise<S3Object[]>
export type PartRequestFetcher = (
  upload: MultipartUploadChunk,
) => Promise<PresignedRequestInfo>
export type Config<UType extends UploadType = UploadType> = {
  maxConcurrentUploads?: number
  uploads: {
    [uType in UType]: {
      maxConcurrentUploads?: number
      initiate: UploadInitiator
      complete?: UploadCompleter
      getPartRequest?: PartRequestFetcher
    }
  }
}

export type UTypeBase<C extends Config> = keyof C['uploads'] & UploadType
export type UCompleterBase<UType extends UploadType> = {
  [type in UType]: { hasComplete: boolean }
}

export type Module<
  UType extends UploadType = UploadType,
  UCompleter extends UCompleterBase<UType> = UCompleterBase<UType>,
  Ctx extends ContextBase<UType> = ContextBase<UType>,
> = {
  [uType in UType]: {
    uploadOne: (
      file: File,
      callbacks?: {
        onProgress?: UploadProgressCallback
        onError?: UploadErrorCallback
        onComplete?: UploadCompleteCallback
        onUploadComplete?: OneUploadCompleteCallback
      },
      ...ctx: undefined extends Ctx[uType]['initiate']
        ? [Ctx[uType]['initiate']?]
        : [Ctx[uType]['initiate']]
    ) => Promise<PendingUpload>
    uploadMany: (
      files: File[],
      callbacks?: {
        onProgress?: UploadProgressCallback
        onError?: UploadErrorCallback
        onComplete?: UploadCompleteCallback
        onUploadComplete?: OneUploadCompleteCallback
      },
      ...ctx: undefined extends Ctx[uType]['initiate']
        ? [Ctx[uType]['initiate']?]
        : [Ctx[uType]['initiate']]
    ) => Promise<PendingUploads>
  } & (UCompleter[uType]['hasComplete'] extends true
    ? {
        completeOne: (
          file: UploadedFile,
          ...ctx: undefined extends Ctx[uType]['complete']
            ? [Ctx[uType]['complete']?]
            : [Ctx[uType]['complete']]
        ) => Promise<S3Object>
        completeMany: (
          file: UploadedFile[],
          ...ctx: undefined extends Ctx[uType]['complete']
            ? [Ctx[uType]['complete']?]
            : [Ctx[uType]['complete']]
        ) => Promise<S3Object[]>
      }
    : Record<never, never>)
}
