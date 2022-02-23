# `@modbox/s3-uploads-client`

> Note: This is the client-side package for the s3-upload module, see [@modbox/s3-upload-server](htpps://github.com/toniopelo/modbox/tree/master/packages/s3-upload-server) for the server package.

# s3-upload approach

This lib abstracts away the complexity of presigned requests uploads to an S3-compatible object storage service.\
Based on two (backend and frontend) simple configurations that define onse or several upload types, for each of which your can :

- Choose between `simple` or `multipart` upload
- Whitelist a set of allowed mimetypes and sizes
- Allow or forbid file replacement
- Define a naming strategy and key conflict handler
- Define a post-upload renaming strategy (e.g. your file should be `${postId}/${filename}` and the `postId` is not generated until the upload is successful and the resource created in database)

Written in typescript with DX in mind.

# Client-side usage

### _Setup and config_

---

`utils/upload.ts`

```ts
import {
  setupUploadModule,
  InitiatedUpload,
  MultipartUploadChunk,
  PresignedRequestInfo,
} from '@modbox/s3-uploads-client'

// Define your upload types, you can use an enum,
// this must be the same as declared in your backend
export enum UploadType {
  Avatar = 'Avatar',
  CommunityPost = 'CommunityPost',
  ResourceFiles = 'ResourceFiles',
}

export const uploadModule = setupUploadModule({
  maxConcurrentUploads: 2,
  uploads: {
    [UploadType.Avatar]: {
      initiate: (files: File[]): Promise<InitiatedUpload[]> => {
        // Do somthing here to communicate with your backend and return
        // initiated uploads
      },
    },
    [UploadType.CommunityPost]: {
      initiate: (files: File[]): Promise<InitiatedUpload[]> => {
        // Do somthing here to communicate with your backend and return
        // initiated uploads
      },
      getPartRequest: async (
        chunk: MultipartUploadChunk,
      ): Promise<PresignedRequestInfo> => {
        // Do something here to communicate with your backend and return
        // the presigned request infos for part upload
      },
    },
    [UploadType.ResourceFiles]: {
      initiate: (files: File[]): Promise<InitiatedUpload[]> => {
        // Do somthing here to communicate with your backend and return
        // initiated uploads
      },
      getPartRequest: async (
        chunk: MultipartUploadChunk,
      ): Promise<PresignedRequestInfo> => {
        // Do something here to communicate with your backend and return
        // the presigned request infos for part upload
      },
    },
  },
})
```

`components/page.tsx`

```ts
import React, { useState } from 'react'
import { CancellableUpload, S3Object } from '@modbox/s3-uploads-client'

import { ProgressBar } from 'components/ProgressBar'
import { uploadModule } from 'utils/upload'

const PageComponent = () => {
  const [uploadProgress, setUploadProgress] = useState<{
    total: number
    completed: number
  }>({ total: 1, completed: 0 })
  const [uploads, setUploads] = useState<File[]>([])

  const startUpload = () => {
    const pendingUploads = await uploadModule.CommunityPost.uploadMany(
      uploads,
      {
        onProgress: ({ completedChunksCount, totalChunksCount }) => {
          setUploadProgress({
            completed: completedChunksCount,
            total: totalChunksCount,
          })
        },
        onUploadComplete: (uploadCompleted, originalFile) => {
          console.log('A file was uploaded')
        },
        onError: (uploadError) => {
          console.error('Error: ', uploadError)
        },
      },
    )
  }

  return (
    <div>
      <ProgressBar progress={uploadProgress} />

      <input
        type="file"
        multiple
        onChange={(e) => {
          const fileList = (
            e.target as unknown as {
              files: FileList
            }
          ).files
          setUploads(toFileArray(fileList))
        }}
      />

      <button onClick={() => startUpload()}></button>
    </div>
  )
}
```

### _Configuration object_

---

This is the definition of the config object passed to `setupUploadModule`.

| Property                 | Type                                                              | Required | Default | Description                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| maxConcurrentUploads     | `number`                                                          | false    | 2       | The number of concurrent uploads                                                                                                                                                                                                                                                                               |
| uploads                  | _See below for full breakdown of this object_                     | **true** |         | This object defines the different upload types as keys and their specific config as value.                                                                                                                                                                                                                     |
| _uploads_.initiate       | `(files: File[], ctx: any) => Promise<InitiatedUpload[]>`         | **true** |         | Handler that perform the network request to get the InitiatedUploads from the backend for a set of files passed as parameters. `ctx` is anything that you which to pass to your handler in order to perform the request.                                                                                       |
| _uploads_.complete       | `(files: UploadedFile[], ctx: any) => Promise<S3Object[]>`        | false    |         | Handler to perform a request in order to complete an upload. This is not needed as you might want to complete your upload by passing your `UploadedFile`s in the payload of another request depending on your use case. (e.g. Uploads that are part of a forum post could be passed along the post to create). |
| _uploads_.getPartRequest | `(upload: MultipartUploadChunk) => Promise<PresignedRequestInfo>` | false    |         | Handler to fetch the needed presigned request for each part of your multipart upload. Required if your upload is set to `multipart`                                                                                                                                                                            |

## Notes

This lib is still in development and will be considered production-ready when it reach version `1.0.0`. Use at your own risk. Breaking changes might occur before `1.0.0`, so you might want to use strict references in your `package.json` dependencies. After `1.0.0`, semver will be rigorously respected.
