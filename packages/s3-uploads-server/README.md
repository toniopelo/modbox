# `@modbox/s3-uploads-server`

This package handle the server-side part of an S3-compatible object storage upload.\
It abstract away all the tedious work like presigning requests, handling key conflicts, renaming or moving files around when needed, checking mimetypes and size against a whitelist. It works with `multipart` and `simple` uploads alike.

Here is a simple breakdown of how you should use the lib:\
1️⃣ Define different types of uploads\
2️⃣ For each type of upload, choose whether it should be `multipart` or `simple`\
3️⃣ Choose how you want to handle file renaming based on user provided filename\
4️⃣ Choose if you allow file replacement or how to handle conflicting keys\
5️⃣ Add type conditions to allow or forbid some kind of mimetypes and sizes

## Usage

```
import {
  setupUploadModule,
  FileToUpload,
  UploadMode,
  MimeTypesConfig,
  UploadedFile,
} from '@modbox/s3-uploads-server'

export enum UploadType {
  Avatar = 'avatar',
  CommunityPost = 'community-post',
  ResourceFiles = 'resource-files',
}

const MULTIPART_CHUNK_SIZE = 10485760 // 10Mb = 10485760 bytes
const IMAGE_TYPE_CONDITION = {
  // Regex works
  types: [/^image\//],
  // Max size of 15MiB in bytes
  maxSize: 15728640,
}
const TEXT_TYPE_CONDITION = {
  // Strings for strict equality checks
  types: ['text/plain', 'another_mimetype', /some_regex/i],
  // Max size of 5MiB in bytes
  maxSize: 5242880,
}
const PDF_TYPE_CONDITION = {
  types: ['application/pdf'],
  // Max size of 50MiB in bytes
  maxSize: 52428800,
}

export const uploadModule = setupUploadModule({
  s3Config: {
    credentials: {
      accessKeyId: '<Your access key>',
      secretAccessKey: <Your secret key>,
    },
    // Some S3-compatible object storage provider
    domain: '<Your cloud provider domain>',
    region: '<Your region>',
  },
  // Setting the multipart chunk size (defaults to 5MiB)
  multipartChunkSize: MULTIPART_CHUNK_SIZE,
  // Allowing this type for all uploads
  mimeTypesConfig: [IMAGE_TYPE_CONDITION],
  // Here define a condition where deletion is allowed to avoid data loss for example
  canDelete: env.NODE_ENV === 'production',
  uploads: {
    [UploadType.Avatar]: {
      bucket: env.SCW_AVATAR_BUCKET,
      mode: UploadMode.Single,
      buildKey: (file: FileToUpload) => {
        return `tmp-${Date.now()}-avatar-${file.filename}`
      },
      buildFinalKey: (
        file: UploadedFile,
        ctx: { userId: number; username: string },
      ) => {
        return `${ctx.userId}-${ctx.username}${path.extname(file.filename)}`
      },
    },
    [UploadType.CommunityPost]: {
      bucket: env.SCW_COMMUNITY_THREAD_BUCKET,
      mode: UploadMode.Multipart,
      // This allows you to build the key where the file will be stored based on current upload
      buildKey: (file: FileToUpload) => {
        return `tmp-${file.filename}`
      },
      // When buildFinalKey is provided, you file once uploaded will be moved at this new key.
      // This allows for example to create a resource in database only when upload is a success and then
      // move the file around based on the new data (a generated id for example)
      buildFinalKey: (
        file: UploadedFile,
        ctx: { postId: number; discussionId: number },
      ) => {
        return `${ctx.discussionId}/${ctx.postId}/${file.filename}`
      },
      // This tells the lib how to rename the uploaded file when key is already taken
      // If not provided and such case happens, the lib will throw (except if allowReplace is set to true)
      onKeyConflict: (key: string, tryCount: number) => {
        const ext = path.extname(key)
        return `${path.basename(key, ext)}-${tryCount}${ext}`
      },
      // This adds PDF for this kind of uploads
      mimeTypesConfig: [PDF_TYPE_CONDITION],
    },
    [UploadType.ResourceFiles]: {
      // Upload the object even if it override an existing file
      allowReplace: true,
      bucket: env.SCW_RESOURCE_FILE_BUCKET,
      mode: UploadMode.Multipart,
      buildKey: (file: FileToUpload) => {
        return `tmp-${file.filename}`
      },
      buildFinalKey: (file: UploadedFile, ctx: { resourceId: number }) => {
        return `${ctx.resourceId}/${file.filename}`
      },
      // This adds TEXT files for this kind of uploads
      mimeTypesConfig: [TEXT_TYPE_CONDITION],
    },
  },
})

// You can re-export some utils that are already setup with your provider credentials
// to use elsewhere in your app
export const {
  buildBucketHostname,
  buildObjectUrl,
  deleteObject,
  doesObjectExist,
  downloadObject,
  getCleanFilename,
  moveObject,
} = uploadModule.utils
```
