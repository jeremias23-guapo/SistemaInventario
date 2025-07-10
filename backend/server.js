// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const pool    = require('./config/db');  // tu pool de mysql2

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// --- Chequeo de conexión a la base ---
;(async () => {
  try {
    const conn = await pool.getConnection();  // intenta sacar una conexión
    console.log('✅ Conexión a la base de datos establecida');
    conn.release();                            // devuelve la conexión al pool
  } catch (err) {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);  // opcional: corta el servidor si la DB no arranca
  }
})();

// Rutas...

app.use('/api/productos', require('./routes/productos')); //Ruta para productos

app.use('/api/ordenes_compra', require('./routes/ordenes_compras'));

app.use('/api/categorias', require('./routes/categorias')); //Ruta para categorias

app.use('/api/marcas', require('./routes/marcas'));//Ruta para marcas

app.use('/api/proveedores', require('./routes/proveedores')); //Ruta para proveedores

app.use('/api/transacciones', require('./routes/transaccion')); //Ruta para transacciones
// *** NUEVO: Módulo de Ventas ***
app.use('/api/ventas', require('./routes/ventas'));
// *** NUEVO: Módulo de Clientes ***
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/imagenes', require('./routes/imagenes'));

// Levantar servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${port}`);
});
