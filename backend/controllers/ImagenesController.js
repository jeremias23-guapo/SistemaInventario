// backend/controllers/ImagenCtrl.js
const bucket = require('../config/storage');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

exports.uploadImage = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
      }
      // Nombre único para evitar colisiones
      const blob = bucket.file(`${Date.now()}_${req.file.originalname}`);
      const stream = blob.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on('error', err => next(err));
      stream.on('finish', () => {
        // Sin makePublic(), confiamos en el permiso de bucket-level
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        res.status(201).json({ url: publicUrl });
      });

      stream.end(req.file.buffer);
    } catch (err) {
      next(err);
    }
  }
];
