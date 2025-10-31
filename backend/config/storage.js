// ✅ config/storage.js
const { Storage } = require('@google-cloud/storage');

// Crea cliente de Google Cloud Storage
const storage = new Storage();

// Indica el nombre exacto de tu bucket
const bucketName = 'inventarioimagenes';
const bucket = storage.bucket(bucketName);

module.exports = bucket;
