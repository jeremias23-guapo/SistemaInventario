// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const pool    = require('./config/db');

const app = express();

// 1️⃣ Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' })); // ✅ permite JSONs grandes (por imágenes, etc.)
app.use(helmet());

// 2️⃣ Comprobar conexión a la BD al iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    conn.release();
  } catch (err) {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  }
})();

// 3️⃣ Rutas de API
app.use('/api/login', require('./routes/auth'));
app.use('/api/productos',      require('./routes/productos'));
app.use('/api/ordenes_compra', require('./routes/ordenes_compras'));
app.use('/api/categorias',     require('./routes/categorias'));
app.use('/api/marcas',         require('./routes/marcas'));
app.use('/api/proveedores',    require('./routes/proveedores'));
app.use('/api/transacciones',  require('./routes/transaccion'));
app.use('/api/ventas',         require('./routes/ventas'));
app.use('/api/clientes',       require('./routes/clientes'));
app.use('/api/imagenes',       require('./routes/imagenes'));
app.use('/api/usuarios',       require('./routes/usuarios'));
app.use('/api/roles',          require('./routes/roles'));
app.use('/api/transportistas', require('./routes/transportistas'));
app.use('/api/reports',        require('./routes/reports'));
app.use('/api/encomendistas',  require('./routes/encomendistas')); // ✅ nuevo módulo

// 4️⃣ (Opcional) servir el build de React
// app.use(express.static(path.join(__dirname, '../frontend/build')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
// });

// 5️⃣ Middleware global de errores
app.use((err, req, res, next) => {
  console.error('💥 API Error:', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Error interno del servidor' });
});

// 6️⃣ Arrancar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${port}`);
});
