import { S3 } from 'aws-sdk'

import {
  initiateOne,
  initiateMany,
  completeOne,
  completeMany,
  getPartRequest,
} from './operations'
import { Module, Config, ContextBase, UTypeBase, S3Client } from './types'

export const setupUploadModule = <
  C extends Config,
  UType extends UTypeBase<C> = UTypeBase<C>,
  Ctx extends ContextBase<UType> = {
    [type in UType]: {
      initiate: Parameters<C['uploads'][type]['buildKey']>[1]
      complete: undefined extends C['uploads'][type]['buildFinalKey']
        ?
            | Parameters<NonNullable<C['uploads'][type]['buildFinalKey']>>[1]
            | undefined
        : Parameters<NonNullable<C['uploads'][type]['buildFinalKey']>>[1]
    }
  }
>(
  config: C,
): Module<C, UType, Ctx> & { s3Client: S3Client } => {
  const s3Client = config.s3Client
    ? config.s3Client
    : new S3({
        ...config.s3Config,
        // Use provided endpoint or build one from config
        endpoint:
          config.s3Config.endpoint ||
          `https://s3.${config.s3Config.region}.${config.s3Config.domain}`,
      })

  const keys = Object.keys(config.uploads) as UType[]
  const module = keys.reduce((module: Module<C, UType, Ctx>, uType) => {
    module[uType] = {
      initiateOne: initiateOne({ ...config, s3Client }, uType),
      initiateMany: initiateMany({ ...config, s3Client }, uType),
      completeOne: completeOne({ ...config, s3Client }, uType),
      completeMany: completeMany({ ...config, s3Client }, uType),
      getPartRequest: getPartRequest({ ...config, s3Client }, uType),
    }

    return module
  }, {} as Module<C, UType, Ctx>)

  return { ...module, s3Client }
}

export {
  Config,
  FileToUpload,
  InitiatedUpload,
  UploadedFile,
  UploadedFileParts,
  S3Object,
  S3Location,
  UploadMode,
  PresignedRequestInfo,
  PresignedRequestValues,
} from './types'
export {
  downloadObject,
  buildObjectUrl,
  deleteObject,
  moveObject,
  getCleanFilename,
} from './helpers'
export default setupUploadModule
