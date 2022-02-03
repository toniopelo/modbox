import { S3 } from 'aws-sdk'

export type S3Location = {
  bucket: string
  key: string
}

export interface S3Object {
  url: string
  bucket: string
  key: string
  filename: string
  mimetype: string
  size: number
}

export interface FileToUpload {
  mimetype: string
  filename: string
  size: number
}

export interface PresignedRequestValues {
  key: string
  value: string
}

export interface PresignedRequestInfo {
  url: string
  fields?: PresignedRequestValues[]
  headers?: PresignedRequestValues[]
}

export interface InitiatedUpload<
  UType,
  UMode extends UploadMode = UploadMode,
  PRequest extends PresignedRequestInfo | null = UMode extends UploadMode.Multipart
    ? null
    : PresignedRequestInfo
> {
  uploadType: UType
  uploadMode: UploadMode
  filename: string
  mimetype: string
  bucket: string
  key: string
  uploadId: string
  size: number
  chunkSize: number
  partsCount: number
  presignedRequest: PRequest
}

export enum UploadMode {
  Multipart = 'multipart',
  Single = 'single',
}

export interface UploadedFileParts {
  partNumber: number
  etag: string
}

export interface UploadedFile<
  UMode extends UploadMode = UploadMode,
  UParts extends
    | UploadedFileParts[]
    | undefined = UMode extends UploadMode.Multipart
    ? UploadedFileParts[]
    : undefined
> extends S3Object {
  uploadMode: UMode
  uploadId: string
  parts: UParts
}

export interface PartMetadata {
  key: string
  uploadId: string
  partNumber: number
}

export type S3Config = S3.Types.ClientConfiguration & {
  region: S3.Types.ClientConfiguration['region']
  credentials: NonNullable<S3.Types.ClientConfiguration['credentials']>
  domain: string
}
export type S3Client = S3
export type Config<
  K extends string = string,
  HasS3Client extends boolean = boolean
> = {
  /**
   * The configuration for the underlying s3 client.
   *
   * @requires domain, region and credentials to be set
   *
   * @example amazonaws.com for endpoints like `https://${bucket}.s3.${region}.amazonaws.com`
   * @example scw.cloud for endpoints like `https://${bucket}.s3.${region}.scw.cloud`
   * @example whatever.xyz for endpoints like `https://${bucket}.s3.${region}.whatever.xyz`
   * ... and so on.
   */
  s3Config: S3Config
  uploads: {
    [key in K]: {
      bucket: string
      buildKey: (fileToUpload: FileToUpload, ctx: any) => string
      buildFinalKey?: (uploadedFile: UploadedFile, ctx: any) => string
      mode: UploadMode
    }
  }
} & (HasS3Client extends true
  ? { s3Client: S3Client }
  : { s3Client?: S3Client })

export type ContextBase<UType extends string | number | symbol> = {
  [type in UType]: { initiate: unknown; complete: unknown }
}
export type UTypeBase<C extends Config> = keyof C['uploads'] & string
export type Module<
  C extends Config,
  UType extends UTypeBase<C>,
  Ctx extends ContextBase<UType>
> = {
  [key in UType]: {
    initiateOne: (
      file: FileToUpload,
      ...ctx: undefined extends Ctx[key]['initiate']
        ? [Ctx[key]['initiate']?]
        : [Ctx[key]['initiate']]
    ) => Promise<InitiatedUpload<UType>>
    initiateMany: (
      files: FileToUpload[],
      ...ctx: undefined extends Ctx[key]['initiate']
        ? [Ctx[key]['initiate']?]
        : [Ctx[key]['initiate']]
    ) => Promise<InitiatedUpload<UType>[]>
    completeOne: (
      file: UploadedFile,
      ...ctx: undefined extends Ctx[key]['complete']
        ? [Ctx[key]['complete']?]
        : [Ctx[key]['complete']]
    ) => Promise<S3Object>
    completeMany: (
      files: UploadedFile[],
      ...ctx: undefined extends Ctx[key]['complete']
        ? [Ctx[key]['complete']?]
        : [Ctx[key]['complete']]
    ) => Promise<S3Object[]>
    getPartRequest: (partMetadata: PartMetadata) => PresignedRequestInfo
  }
}
