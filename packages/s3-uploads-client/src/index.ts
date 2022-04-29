import {
  completeMany,
  completeOne,
  uploadFile,
  uploadFiles,
} from './operations'
import { Config, ContextBase, Module, UCompleterBase, UTypeBase } from './types'

const DEFAULT_MAX_CONCURRENT_UPLOADS = 2

export const setupUploadModule = <
  C extends Config = Config,
  UType extends UTypeBase<C> = UTypeBase<C>,
  UCompleter extends UCompleterBase<UType> = {
    [type in UType]: {
      hasComplete: undefined extends C['uploads'][type]['complete']
        ? false
        : true
    }
  },
  Ctx extends ContextBase<UType> = {
    [type in UType]: {
      initiate: Parameters<C['uploads'][type]['initiate']>[1]
      complete: undefined extends C['uploads'][type]['complete']
        ? Parameters<NonNullable<C['uploads'][type]['complete']>>[1] | undefined
        : Parameters<NonNullable<C['uploads'][type]['complete']>>[1]
    }
  },
>(
  config: C,
): Module<UType, UCompleter, Ctx> => {
  const uTypes = Object.keys(config.uploads) as UType[]
  const defaultMaxConcurrentUpload =
    config.maxConcurrentUploads || DEFAULT_MAX_CONCURRENT_UPLOADS

  const module = uTypes.reduce<Module<UType>>((acc, uType) => {
    const {
      maxConcurrentUploads = defaultMaxConcurrentUpload,
      initiate,
      complete,
      getPartRequest,
    } = config.uploads[uType]

    return {
      ...acc,
      [uType]: {
        uploadOne: uploadFile({
          uploadType: uType,
          initiate,
          getPartRequest,
          maxConcurrentUploads,
        }),
        uploadMany: uploadFiles({
          uploadType: uType,
          initiate,
          getPartRequest,
          maxConcurrentUploads,
        }),
        ...(complete
          ? {
              completeOne: completeOne({ uploadType: uType, complete }),
              completeMany: completeMany({ uploadType: uType, complete }),
            }
          : {}),
      },
    }
  }, {} as Module<UType, UCompleter>)

  return module
}

export {
  CancellableUpload,
  Config,
  CompleteOperationConfig,
  InitiateOperationConfig,
  FileToUpload,
  InitiatedUpload,
  InitiatedUploadWithFile,
  Module,
  MultipartUploadChunk,
  OneUploadCompleteCallback,
  PartRequestFetcher,
  PendingUpload,
  PendingUploads,
  PresignedRequestInfo,
  S3Object,
  UploadCompleter,
  UploadCompleteCallback,
  UploadErrorCallback,
  UploadInitiator,
  UploadProgressCallback,
  UploadMode,
  UploadedFile,
} from './types'
export default setupUploadModule
