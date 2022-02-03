import path from 'path'
import { Readable } from 'stream'

import { Config, S3Location, S3Object } from './types'

const sanitize = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/--+/g, '-')
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
  config: Config<string, true>,
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
  config: Config<string, true>,
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
  config: Config<string, true>,
  obj: S3Location,
): Promise<void> => {
  // Never delete an object if not in production
  // This avoid to delete a production object
  // when importing prod database on another env
  // if (env.NODE_ENV !== 'production') {
  //   return
  // }

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