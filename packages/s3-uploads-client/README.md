# `@modbox/s3-uploads-client`

> Note: This is the client-side package for the s3-upload module, see [@modbox/s3-upload-server](htpps://github.com/toniopelo/modbox/tree/master/packages/s3-upload-server) for the server package.

## s3-upload approach

This lib abstracts away the complexity of presigned requests uploads to an S3-compatible object storage service.\
Based on two (backend and frontend) simple configurations that define onse or several upload types, for each of which your can :

- Choose between `simple` or `multipart` upload
- Whitelist a set of allowed mimetypes and sizes
- Allow or forbid file replacement
- Define a naming strategy and key conflict handler
- Define a post-upload renaming strategy (e.g. your file should be `${postId}/${filename}` and the `postId` is not generated until the upload is successful and the resource created in database)

Written in typescript with DX in mind.

## Client-side usage

---
