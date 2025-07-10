const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(__dirname, process.env.GCP_KEYFILE_PATH)
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME);
module.exports = bucket;
