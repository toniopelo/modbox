import { UploadManager } from './manager'
import {
  InitiatedUploadWithFile,
  Module,
  InitiateOperationConfig,
  PendingUpload,
  S3Object,
  CompleteOperationConfig,
  UploadedFile,
} from './types'

export const uploadFile =
  (config: InitiateOperationConfig): Module[string]['uploadOne'] =>
  async (file, callbacks = {}, ctx): Promise<PendingUpload> => {
    const { cancelAll, uploads, promise } = await uploadFiles(config)(
      [file],
      callbacks,
      ctx,
    )

    return {
      cancel: cancelAll,
      upload: uploads[0],
      promise: promise.then((uploadedFiles) => uploadedFiles[0]),
      uploadType: config.uploadType,
    }
  }

export const uploadFiles =
  ({
    uploadType,
    maxConcurrentUploads,
    initiate,
    getPartRequest,
  }: InitiateOperationConfig): Module[string]['uploadMany'] =>
  async (files, callbacks = {}, ctx) => {
    const uploads: InitiatedUploadWithFile[] = (await initiate(files, ctx)).map(
      (initiatedUpload, idx) => ({
        // TODO: Here we might want to have a more robust way of linking files to initiated uploads
        // returned from the server, for now this is only the order of the files which is kinda weak.
        ...initiatedUpload,
        file: files[idx],
      }),
    )

    // Instantiate upload manager with initiated uploads, max concurrent options
    // onProgress and onError callbacks
    const manager = new UploadManager({
      onProgress: callbacks.onProgress,
      onError: callbacks.onError,
      onComplete: callbacks.onComplete,
      onUploadComplete: callbacks.onUploadComplete,
      uploads,
      maxConcurrent: maxConcurrentUploads,
      getPartRequest,
    })

    // Start the upload
    const cancellableUploads = await manager.start()

    return {
      cancelAll: () => manager.cancel(),
      uploadType,
      uploads: cancellableUploads,
      // This promise will be resolved when all chunks are uploaded
      // and rejected when an error occurs during the upload process and the 'CANCEL_ALL' strategie is adopted or when the upload is aborted
      // This promise will be returned as pending to allow the caller to abort the upload or to wait for completion
      promise: manager.promise(),
    }
  }

export const completeOne =
  (config: CompleteOperationConfig) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (file: UploadedFile, ctx: any): Promise<S3Object> => {
    const [s3Object] = await completeMany(config)([file], ctx)
    return s3Object
  }

export const completeMany =
  (config: CompleteOperationConfig) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (files: UploadedFile[], ctx: any): Promise<S3Object[]> => {
    const s3Objects = await config.complete(files, ctx)
    return s3Objects
  }
