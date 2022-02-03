import { TYPE_CONDITIONS } from './config'
import { Config } from './types'

export const getPresignedPost = (
  config: Config<string, true>,
  {
    mimetype,
    bucket,
    key,
  }: {
    mimetype: string
    bucket: string
    key: string
  },
): {
  url: string
  fields: {
    key: string
    value: string
  }[]
} => {
  const typeConditions = TYPE_CONDITIONS.find(({ types }) =>
    types.some((t) => mimetype.includes(t)),
  )
  const matchingType = typeConditions?.types.find((t) => mimetype.includes(t))
  if (!typeConditions || !matchingType) {
    throw new Error('core.upload.error.unauthorized_file_type')
  }

  const presigned = config.s3Client.createPresignedPost({
    Conditions: [
      ['starts-with', '$Content-Type', matchingType],
      ['content-length-range', 0, typeConditions.maxSize],
    ],
    Fields: {
      key,
      acl: 'public-read',
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
