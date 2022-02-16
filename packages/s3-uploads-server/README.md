# `@modbox/s3-uploads-server`

> Note: This is the server-side package for the s3-upload module, see [@modbox/s3-upload-client](htpps://github.com/toniopelo/modbox/tree/master/packages/s3-upload-client) for the client package.

# s3-upload approach

This lib abstracts away the complexity of presigned requests uploads to an S3-compatible object storage service.\
Based on two (backend and frontend) simple configurations that define onse or several upload types, for each of which your can :

- Choose between `simple` or `multipart` upload
- Whitelist a set of allowed mimetypes and sizes
- Allow or forbid file replacement
- Define a naming strategy and key conflict handler
- Define a post-upload renaming strategy (e.g. your file should be `${postId}/${filename}` and the `postId` is not generated until the upload is successful and the resource created in database)

Written in typescript with DX in mind.

# Server-side usage

### _Setup and config_

---

`utils/upload.ts`

```ts
import {
  setupUploadModule,
  FileToUpload,
  UploadMode,
  MimeTypesConfig,
  UploadedFile,
} from '@modbox/s3-uploads-server'

// Define your upload types, you can use an enum
export enum UploadType {
  Avatar = 'avatar',
  CommunityPost = 'community-post',
  ResourceFiles = 'resource-files',
}

const MULTIPART_CHUNK_SIZE = 10485760 // 10Mb = 10485760 bytes
const IMAGE_TYPE_CONDITION = {
  // Regex for all images
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
      secretAccessKey: '<Your secret key>',
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
      buildKey: (
        file: FileToUpload,
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
      /* When buildFinalKey is provided, you file once uploaded will be moved at this new key.
      This allows for example to create a resource in database only when upload is a success and then
      move the file around based on the new data (a generated id for example) */
      buildFinalKey: (
        file: UploadedFile,
        ctx: { postId: number; discussionId: number },
      ) => {
        return `${ctx.discussionId}/${ctx.postId}/${file.filename}`
      },
      /* This tells the lib how to rename the uploaded file when key is already taken
      If not provided and such case happens, the lib will throw (except if allowReplace is set to true) */
      onKeyConflict: (key: string, tryCount: number) => {
        const ext = path.extname(key)
        return `${path.basename(key, ext)}-${tryCount}${ext}`
      },
      // This adds PDF for this kind of uploads
      mimeTypesConfig: [PDF_TYPE_CONDITION],
    },
    [UploadType.ResourceFiles]: {
      // Upload the object even if it overrides an existing file
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

/* You can re-export some utils that are already setup with your provider credentials to use elsewhere in your app */
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

`routes/users.ts`

```ts
import express from 'express'
import { uploadModule, UploadTypes } from 'utils/upload.ts'

const app = express()
app.get('/avatar-upload-request', async (req, res) => {
  // Get user and file to upload from request
  const fileToUpload = req.body
  const user = req.user

  // Initiate upload
  const initiatedUpload = await uploadModule[UploadType.Avatar].initiateOne(
    fileToUpload,
    { userId: user.id, username: user.username },
  )
  res.json(initiatedUpload)
})

app.post('/users', async (req, res) => {
  // Get user and file to upload from request
  const uploadedFile = req.body
  const user = req.user

  // Complete upload
  const s3Object = await uploadModule[UploadType.Avatar].completeOne(
    uploadedFile,
  )
  const updatedUser = updateUserInDatabase({ ...user, avatar: s3Object })
  res.json(updatedUser)
})

app.listen(3000)
```

### _Configuration object_

---

This is the definition of the config object passed to `setupUploadModule`.

| Property                  | Type                                                                                                | Required | Default        | Description                                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------- | -------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| s3Config                  | `{ region: string; domain: string; credentials: { accessKeyId: string; secretAccessKey: string } }` | **true** |                | Pass you provider credentials and domain to setup the library (For some use cases, this accept the same config as aws-sdk, typechecking will help you)                                       |
| canDelete                 | `boolean \| ((file: S3Location) => boolean \| Promise<boolean>)`                                    | false    | true           | This prevent object deletion to happen if passed false or a function that returns false                                                                                                      |
| multipartChunkSize        | `number`                                                                                            | false    | 5242880 (5MiB) | This number represent the chunk size for multipart uploads in bytes.                                                                                                                         |
| mimeTypesConfig           | `Array<{ types: (string \| RegExp) \| (string \| RegExp)[]; maxSize: number }>`                     | false    |                | Defines the list of allowed mime types and their corresponding max size. If not provided, all is accepted.                                                                                   |
| uploads                   | _See below for full breakdown of this object_                                                       | **true** |                | This object defines the different upload types as keys and their specific config as value.                                                                                                   |
| _uploads_.allowReplace    | `boolean`                                                                                           | false    | false          | Allow or disallow object replacement (i.e. when you're uploading an object with the same key as an existing one). The lib will throw if false and _uploads_.onKeyConflict is not provided.   |
| _uploads_.bucket          | `string`                                                                                            | **true** |                | The bucket where these uploads should be stored                                                                                                                                              |
| _uploads_.buildKey        | `(fileToUpload: FileToUpload, ctx: any) => string`                                                  | **true** |                | Handler to build the object key based on file to upload                                                                                                                                      |
| _uploads_.buildFinalKey   | `(uploadedFile: UploadedFile, ctx: any) => string`                                                  | false    |                | Handler that allow to rename the object once uploaded, useful in cases where you need some extra data to build the final key like an id not generated yet at the time of the initial upload. |
| _uploads_.mimeTypesConfig | _Same as root `mimeTypesConfig`_                                                                    | false    |                | Same as root `mimeTypesConfig` but this only applies to the upload type it's declared for (root mimeTypesConfig is applied to all specific upload types, no need to repeat it.)              |
| _uploads_.mode            | `UploadMode` (enum exported by the lib)                                                             | **true** |                | The upload to use for this upload type (can be `UploadMode.Multipart \| UploadMode.Single`)                                                                                                  |
| _uploads_.onKeyConflict   | `(key: string, tryCount: number, ctx: any) => string \| Promise<string>`                            | false    |                | Handler for cases where an object already exist at the specified key. The lib will throw if not provided and _uploads_.allowReplace is false.                                                |

## Notes

This lib is still in development and will be considered production-ready when it reach version `1.0.0`. Use at your own risk. Breaking changes might occur before `1.0.0`, so you might want to use strict references in your `package.json` dependencies. After `1.0.0`, semver will be rigorously respected.
