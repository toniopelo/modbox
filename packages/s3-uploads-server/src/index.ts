import { S3 } from 'aws-sdk'

import { buildMimeTypesConfig, getUtils } from './helpers'
import {
  initiateOne,
  initiateMany,
  completeOne,
  completeMany,
  getPartRequest,
} from './operations'
import {
  Module,
  Config,
  ContextBase,
  UTypeBase,
  S3Client,
  UploadUtils,
} from './types'

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
  },
>(
  config: C,
): Module<C, UType, Ctx> & { s3Client: S3Client; utils: UploadUtils } => {
  const s3Client = new S3({
    ...config.s3Config,
    // Use provided endpoint or build one from config
    endpoint:
      config.s3Config.endpoint ||
      `https://s3.${config.s3Config.region}.${config.s3Config.domain}`,
  })
  const configWithClient = { ...config, s3Client }

  const keys = Object.keys(config.uploads) as UType[]
  const mimeTypeConfig = buildMimeTypesConfig<UType>(config)
  const module = keys.reduce((module: Module<C, UType, Ctx>, uType) => {
    module[uType] = {
      initiateOne: initiateOne(configWithClient, mimeTypeConfig, uType),
      initiateMany: initiateMany(configWithClient, mimeTypeConfig, uType),
      completeOne: completeOne(configWithClient, uType),
      completeMany: completeMany(configWithClient, uType),
      getPartRequest: getPartRequest(configWithClient, uType),
    }

    return module
  }, {} as Module<C, UType, Ctx>)

  return {
    ...module,
    s3Client,
    utils: getUtils(configWithClient),
  }
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
  MimeTypeMatcher,
  MimeTypesConfig,
} from './types'
export { getUtils } from './helpers'
export default setupUploadModule
