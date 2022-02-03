import { v4 as uuidv4 } from 'uuid'

import { buildObjectUrl, getCleanFilename, moveObject } from './helpers'
import {
  completeMultipartUpload,
  getPartPresignedRequestInfo,
  initiatePresignedMultipartUpload,
} from './multipart'
import { getPresignedPost } from './presigned-post'
import {
  FileToUpload,
  InitiatedUpload,
  UploadMode,
  UploadedFile,
  S3Object,
  Config,
  PartMetadata,
  PresignedRequestInfo,
  UTypeBase,
} from './types'

export const initiateOne = <
  C extends Config<string, true>,
  UType extends UTypeBase<C>,
  Ctx
>(
  config: C,
  uType: UType,
) => async (
  file: FileToUpload,
  ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
): Promise<InitiatedUpload<UType>> => {
  // Don't trust user input with the filename
  const sanitizedFile = {
    ...file,
    filename: getCleanFilename(file.filename),
  }

  const { mode, bucket, buildKey } = config.uploads[uType]
  const { filename, mimetype, size } = sanitizedFile
  const key = buildKey(sanitizedFile, ctx[0])
  if (mode === UploadMode.Single) {
    return {
      uploadId: uuidv4(),
      uploadType: uType,
      uploadMode: mode,
      bucket: bucket,
      key,
      filename,
      mimetype,
      size,
      chunkSize: size,
      partsCount: 1,
      presignedRequest: getPresignedPost(config, { bucket, mimetype, key }),
    }
  } else {
    const {
      chunkSize,
      partsCount,
      uploadId,
    } = await initiatePresignedMultipartUpload(config, {
      bucket,
      key,
      mimetype,
      size,
    })

    return {
      chunkSize,
      size,
      presignedRequest: null,
      partsCount,
      uploadId,
      bucket,
      filename,
      key,
      mimetype,
      uploadMode: mode,
      uploadType: uType,
    }
  }
}

export const initiateMany = <
  C extends Config<string, true>,
  UType extends UTypeBase<C>,
  Ctx
>(
  config: C,
  uType: UType,
) => (
  files: FileToUpload[],
  ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
): Promise<InitiatedUpload<UType>[]> => {
  const initiateOneFn = initiateOne(config, uType)
  return Promise.all(files.map((f) => initiateOneFn(f, ...ctx)))
}

export const completeOne = <
  C extends Config<string, true>,
  UType extends UTypeBase<C>,
  Ctx
>(
  config: C,
  uType: UType,
) => async (
  file: UploadedFile,
  ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
): Promise<S3Object> => {
  const { bucket, buildFinalKey } = config.uploads[uType]
  const {
    filename,
    mimetype,
    size,
    parts,
    uploadId,
    uploadMode: mode,
    key,
  } = file
  const finalKey = buildFinalKey ? buildFinalKey(file, ctx[0]) : key

  // For multipart uploads, we need to complete the upload
  if (mode === UploadMode.Multipart) {
    if (!parts) {
      throw new Error('multipart_upload_no_parts_provided')
    }

    await completeMultipartUpload(config, {
      bucket,
      key,
      uploadId,
      parts,
    })
  }

  // If the final key is different from the original key, move the object
  // and return the new S3 object
  if (finalKey !== key) {
    return await moveObject(
      config,
      file,
      {
        bucket,
        key: finalKey,
      },
      'public-read',
    )
  }

  // Else, return the original S3 object
  return {
    url: buildObjectUrl(config, bucket, key),
    bucket,
    key,
    filename,
    mimetype,
    size,
  }
}

export const completeMany = <
  C extends Config<string, true>,
  UType extends UTypeBase<C>,
  Ctx
>(
  config: C,
  uType: UType,
) => (
  files: UploadedFile[],
  ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
): Promise<S3Object[]> => {
  const completeOneFn = completeOne(config, uType)
  return Promise.all(files.map((f) => completeOneFn(f, ...ctx)))
}

export const getPartRequest = <
  C extends Config<string, true>,
  UType extends UTypeBase<C> = UTypeBase<C>
>(
  config: C,
  uType: UType,
) => (partMetadata: PartMetadata): PresignedRequestInfo => {
  const { bucket } = config.uploads[uType]
  const { uploadId, partNumber, key } = partMetadata

  return getPartPresignedRequestInfo(config, {
    bucket,
    uploadId,
    partNumber,
    key,
  })
}
