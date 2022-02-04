import path from 'path'
import { Readable } from 'stream'

import {
  Config,
  ConfigWithClient,
  S3Location,
  S3Object,
  MimeTypesConfigPerUType,
  FileToUpload,
  MimeTypesConfig,
  MimeTypeMatcher,
  UploadUtils,
  UTypeBase,
} from './types'

const sanitize = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/--+/g, '-')
}

export const buildMimeTypesConfig = <UType extends string>(
  config: Config<UType>,
): MimeTypesConfigPerUType<UType> => {
  const uploadTypes = Object.keys(config.uploads) as UType[]
  return uploadTypes.reduce((acc, key) => {
    return {
      ...acc,
      [key]: [
        // Order is important here as the first match will be used
        // We put the UType specific mime type first
        ...(config.uploads[key].mimeTypesConfig || []),
        ...(config.mimeTypesConfig || []),
      ],
    }
  }, {} as MimeTypesConfigPerUType<UType>)
}

export const isFileAllowed = (
  mimeTypesConfig: MimeTypesConfig,
  file: FileToUpload,
): boolean => {
  const isMimeTypeMatch = (
    typeMatcher: MimeTypeMatcher,
    mimeType: string,
  ): boolean => {
    if (typeof typeMatcher === 'string') {
      return mimeType === typeMatcher
    } else {
      return typeMatcher.test(mimeType)
    }
  }

  const isAllowed = mimeTypesConfig.some((mimeTypeConfig) => {
    const isMatch = Array.isArray(mimeTypeConfig.types)
      ? mimeTypeConfig.types.some((typeMatcher) =>
          isMimeTypeMatch(typeMatcher, file.mimetype),
        )
      : isMimeTypeMatch(mimeTypeConfig.types, file.mimetype)

    return isMatch && mimeTypeConfig.maxSize >= file.size
  })

  return isAllowed
}

export const buildObjectUrl = (
  config: Config,
  bucket: string,
  key: string,
): string => `https://${buildBucketHostname(config, bucket)}/${key}`

export const buildBucketHostname = (config: Config, bucket: string): string =>
  `${bucket}.s3.${config.s3Config.region}.${config.s3Config.domain}`

export const getCleanFilename = (filename: string): string => {
  const ext = path.extname(filename)
  const basename = path.basename(filename, ext)
  return `${sanitize(basename)}${ext}`
}

export const downloadObject = (
  config: ConfigWithClient,
  obj: S3Location,
): Readable => {
  return config.s3Client
    .getObject({
      Bucket: obj.bucket,
      Key: obj.key,
    })
    .createReadStream()
}

export const moveObject = async (
  config: ConfigWithClient,
  from: S3Object,
  to: S3Location,
  acl: 'private' | 'public-read',
): Promise<S3Object> => {
  const r = await config.s3Client
    .copyObject({
      CopySource: `${from.bucket}/${from.key}`,
      Bucket: to.bucket,
      Key: to.key,
      ACL: acl,
    })
    .promise()

  if (r.$response.error) {
    throw r.$response.error
  }

  await deleteObject(config, from)
  return {
    bucket: to.bucket,
    key: to.key,
    filename: path.basename(to.key),
    url: buildObjectUrl(config, to.bucket, to.key),
    mimetype: from.mimetype,
    size: from.size,
  }
}

export const deleteObject = async (
  config: ConfigWithClient,
  obj: S3Location,
): Promise<void> => {
  // Get canDelete config value if provided or default to true
  const canDelete =
    config.canDelete === undefined
      ? true
      : typeof config.canDelete === 'function'
      ? await config.canDelete(obj)
      : config.canDelete

  // If cannot delete, this is a no-op, we just return
  if (!canDelete) {
    return
  }

  const r = await config.s3Client
    .deleteObject({
      Bucket: obj.bucket,
      Key: obj.key,
    })
    .promise()

  if (r.$response.error) {
    throw r.$response.error
  }
}

export const doesObjectExist = async (
  config: ConfigWithClient,
  obj: S3Location,
): Promise<boolean> => {
  try {
    await config.s3Client
      .headObject({
        Bucket: obj.bucket,
        Key: obj.key,
      })
      .promise()

    return true
  } catch (e) {
    return false
  }
}

export const getAvailableLocation = async <
  C extends ConfigWithClient = ConfigWithClient,
  UType extends UTypeBase<C> = UTypeBase<C>,
>(
  config: C,
  uploadType: UType,
  location: S3Location,
  ctx: unknown,
): Promise<S3Location> => {
  // If replace is allowed, we just return the original location
  if (config.uploads[uploadType].allowReplace) {
    return location
  }

  const { onKeyConflict } = config.uploads[uploadType]
  const exists = await doesObjectExist(config, location)

  if (!exists) {
    return location
  } else if (!onKeyConflict) {
    throw new Error('object_key_already_taken')
  } else {
    const findNextAvailableKey = async (tryCount = 1): Promise<S3Location> => {
      const nextKey = await onKeyConflict(location.key, tryCount, ctx)
      const nextKeyExists = await doesObjectExist(config, {
        ...location,
        key: nextKey,
      })

      return nextKeyExists
        ? await findNextAvailableKey(tryCount + 1)
        : { ...location, key: nextKey }
    }

    const nextLocation = await findNextAvailableKey()
    return nextLocation
  }
}

export const getUtils = (config: ConfigWithClient): UploadUtils => ({
  buildObjectUrl: (bucket, key) => buildObjectUrl(config, bucket, key),
  buildBucketHostname: (bucket) => buildBucketHostname(config, bucket),
  deleteObject: (obj) => deleteObject(config, obj),
  doesObjectExist: (obj) => doesObjectExist(config, obj),
  downloadObject: (obj) => downloadObject(config, obj),
  getCleanFilename,
  moveObject: (from, to, acl) => moveObject(config, from, to, acl),
})
