export const TYPE_CONDITIONS = [
  {
    // All images
    types: ['image/'],
    // Max size of 15MB
    maxSize: 15728640,
  },
  {
    // Text files
    types: ['text/plain'],
    // Max size of 5MB
    maxSize: 5242880,
  },
  {
    // Pdf files
    types: ['application/pdf'],
    // Max size of 50MB
    maxSize: 52428800,
  },
  {
    // Microsoft office document
    types: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    // Max size of 50MB
    maxSize: 52428800,
  },
  {
    // Open document
    types: [
      'application/vnd.oasis.opendocument.presentation',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.text',
    ],
    // Max size of 50MB
    maxSize: 52428800,
  },
]
