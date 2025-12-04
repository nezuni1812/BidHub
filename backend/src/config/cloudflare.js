/**
 * Cloudflare R2 Configuration
 * R2 is S3-compatible object storage
 */

const { S3Client } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // e.g., https://xxxx.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  r2Client,
  bucket: process.env.R2_BUCKET_NAME || 'bidhub-images',
  publicUrl: process.env.R2_PUBLIC_URL, // e.g., https://images.bidhub.com or R2 custom domain
};
