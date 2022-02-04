import { S3 } from 'aws-sdk'
import { Readable } from 'stream'

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
    : PresignedRequestInfo,
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
    : undefined,
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

export type MimeTypeMatcher = string | RegExp
export type MimeTypesConfig = Array<{
  types: MimeTypeMatcher | MimeTypeMatcher[]
  maxSize: number
}>
export type MimeTypesConfigPerUType<UType extends string> = {
  [key in UType]: MimeTypesConfig
}

export type S3Config = S3.Types.ClientConfiguration & {
  region: NonNullable<S3.Types.ClientConfiguration['region']>
  credentials: NonNullable<S3.Types.ClientConfiguration['credentials']>
  domain: string
}
export type S3Client = S3
export type Config<K extends string = string> = {
  /**
   * The configuration for the underlying s3 client.
   * @requires domain, region and credentials to be set
   *
   * @example amazonaws.com for endpoints like `https://${bucket}.s3.${region}.amazonaws.com`
   * @example scw.cloud for endpoints like `https://${bucket}.s3.${region}.scw.cloud`
   * @example whatever.xyz for endpoints like `https://${bucket}.s3.${region}.whatever.xyz`
   * ... and so on.
   */
  s3Config: S3Config
  canDelete?: boolean | ((file: S3Location) => boolean | Promise<boolean>)
  /**
   * Maximum size of a multipart file chunk in bytes.
   * @default export 5242880 (5242880 bytes = 5Mib)
   */
  multipartChunkSize?: number
  mimeTypesConfig?: MimeTypesConfig
  uploads: {
    [key in K]: {
      bucket: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildKey: (fileToUpload: FileToUpload, ctx: any) => string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildFinalKey?: (uploadedFile: UploadedFile, ctx: any) => string
      mode: UploadMode
      mimeTypesConfig?: MimeTypesConfig
    }
  }
}
export type ConfigWithClient<K extends string = string> = Config<K> & {
  s3Client: S3Client
}

export type ContextBase<UType extends string | number | symbol> = {
  [type in UType]: { initiate: unknown; complete: unknown }
}
export type UTypeBase<C extends Config> = keyof C['uploads'] & string
export type Module<
  C extends Config,
  UType extends UTypeBase<C>,
  Ctx extends ContextBase<UType>,
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

export interface UploadUtils {
  buildObjectUrl: (bucket: string, key: string) => string
  buildBucketHostname: (bucket: string) => string
  deleteObject: (obj: S3Location) => Promise<void>
  doesObjectExist: (obj: S3Location) => Promise<boolean>
  downloadObject: (obj: S3Location) => Readable
  getCleanFilename: (filename: string) => string
  moveObject: (
    from: S3Object,
    to: S3Location,
    acl: 'private' | 'public-read',
  ) => Promise<S3Object>
}
