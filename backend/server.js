// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const pool    = require('./config/db');

const app = express();

// 1) Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());

// 2) Chequeo de conexión a la BD
;(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    conn.release();
  } catch (err) {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
})();

// 3) Rutas de API

// Autenticación — ahora montada en /api/login
app.use('/api/login', require('./routes/auth'));

// Resto de módulos
app.use('/api/productos',      require('./routes/productos'));
app.use('/api/ordenes_compra', require('./routes/ordenes_compras'));
app.use('/api/categorias',     require('./routes/categorias'));
app.use('/api/marcas',         require('./routes/marcas'));
app.use('/api/proveedores',    require('./routes/proveedores'));
app.use('/api/transacciones',  require('./routes/transaccion'));
app.use('/api/ventas',         require('./routes/ventas'));
app.use('/api/clientes',       require('./routes/clientes'));
app.use('/api/imagenes',       require('./routes/imagenes'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/roles',         require('./routes/roles'));
// 4) (Opcional) Si sirves tu build de React desde aquí, ponlo después de las rutas de API:
// app.use(express.static(path.join(__dirname, '../frontend/build')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
// });

// 5) Middleware global de manejo de errores — **devuelve siempre JSON**
app.use((err, req, res, next) => {
  console.error('💥 API Error:', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Error interno del servidor' });
});

// 6) Arrancar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${port}`);
});
