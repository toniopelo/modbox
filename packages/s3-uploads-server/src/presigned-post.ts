import { ConfigWithClient } from './types'

export const getPresignedPost = (
  config: ConfigWithClient,
  {
    mimetype,
    bucket,
    key,
    size,
  }: {
    mimetype: string
    bucket: string
    key: string
    size: number
  },
): {
  url: string
  fields: {
    key: string
    value: string
  }[]
} => {
  const presigned = config.s3Client.createPresignedPost({
    Fields: {
      key,
      acl: 'public-read',
      'Content-Type': mimetype,
      'Content-Length': size,
    },
    Bucket: bucket,
    Expires: 300,
  })

  return {
    url: presigned.url,
    fields: Object.entries(presigned.fields).map(([key, value]) => ({
      key,
      value,
    })),
  }
}
