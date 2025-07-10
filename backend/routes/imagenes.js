// backend/routes/imagenes.js
const express = require('express');
const router  = express.Router();
const ImagenCtrl = require('../controllers/ImagenesController');

router.post('/', ImagenCtrl.uploadImage);
module.exports = router;
