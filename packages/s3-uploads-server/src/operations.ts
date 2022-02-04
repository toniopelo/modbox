import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import {
  buildObjectUrl,
  getAvailableLocation,
  getCleanFilename,
  isFileAllowed,
  moveObject,
} from './helpers'
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
  PartMetadata,
  PresignedRequestInfo,
  UTypeBase,
  ConfigWithClient,
  MimeTypesConfigPerUType,
} from './types'

export const initiateOne =
  <C extends ConfigWithClient, UType extends UTypeBase<C>, Ctx>(
    config: C,
    mimeTypesConfig: MimeTypesConfigPerUType<UType>,
    uType: UType,
  ) =>
  async (
    file: FileToUpload,
    ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
  ): Promise<InitiatedUpload<UType>> => {
    // Don't trust user input with the filename
    const sanitizedFile = {
      ...file,
      filename: getCleanFilename(file.filename),
    }

    // Check if file is allowed by mimetypes config
    if (!isFileAllowed(mimeTypesConfig[uType], sanitizedFile)) {
      throw new Error('file_not_allowed_by_mimetypes_config')
    }

    const { mode, bucket, buildKey } = config.uploads[uType]
    const { mimetype, size, filename } = sanitizedFile

    // Build key and check if object key is already taken,
    // if so, try to find a new one with onKeyConflict if provided, else throw an error
    // If allowReplace config is true, then the key will not be changed even if conflicting with an existing object
    const { key } = await getAvailableLocation(
      config,
      uType,
      { bucket, key: buildKey(sanitizedFile, ctx[0]) },
      ctx[0],
    )

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
        presignedRequest: getPresignedPost(config, {
          bucket,
          mimetype,
          key,
          size,
        }),
      }
    } else {
      const { chunkSize, partsCount, uploadId } =
        await initiatePresignedMultipartUpload(config, {
          bucket,
          key,
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

export const initiateMany =
  <C extends ConfigWithClient, UType extends UTypeBase<C>, Ctx>(
    config: C,
    mimeTypesConfig: MimeTypesConfigPerUType<UType>,
    uType: UType,
  ) =>
  (
    files: FileToUpload[],
    ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
  ): Promise<InitiatedUpload<UType>[]> => {
    const initiateOneFn = initiateOne(config, mimeTypesConfig, uType)
    return Promise.all(files.map((f) => initiateOneFn(f, ...ctx)))
  }

export const completeOne =
  <C extends ConfigWithClient, UType extends UTypeBase<C>, Ctx>(
    config: C,
    uType: UType,
  ) =>
  async (
    file: UploadedFile,
    ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
  ): Promise<S3Object> => {
    const { bucket, buildFinalKey } = config.uploads[uType]
    const { mimetype, size, parts, uploadId, uploadMode: mode, key } = file

    // Build final key and check if object key is already taken,
    // if so, try to find a new one with onKeyConflict if provided, else throw an error
    // If allowReplace config is true, then the key will not be changed even if conflicting with an existing object
    const { key: finalKey } = await getAvailableLocation(
      config,
      uType,
      { bucket, key: buildFinalKey ? buildFinalKey(file, ctx[0]) : key },
      ctx[0],
    )
    const filename = path.basename(finalKey)

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

export const completeMany =
  <C extends ConfigWithClient, UType extends UTypeBase<C>, Ctx>(
    config: C,
    uType: UType,
  ) =>
  (
    files: UploadedFile[],
    ...ctx: undefined extends Ctx ? [Ctx?] : [Ctx]
  ): Promise<S3Object[]> => {
    const completeOneFn = completeOne(config, uType)
    return Promise.all(files.map((f) => completeOneFn(f, ...ctx)))
  }

export const getPartRequest =
  <C extends ConfigWithClient, UType extends UTypeBase<C> = UTypeBase<C>>(
    config: C,
    uType: UType,
  ) =>
  (partMetadata: PartMetadata): PresignedRequestInfo => {
    const { bucket } = config.uploads[uType]
    const { uploadId, partNumber, key } = partMetadata

    return getPartPresignedRequestInfo(config, {
      bucket,
      uploadId,
      partNumber,
      key,
    })
  }
