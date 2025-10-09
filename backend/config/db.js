// backend/config/db.js
require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

/**
 * Construye la sección SSL según variables de entorno:
 * - DB_SSL=true activa SSL.
 * - DB_SSL_CA_PATH=ruta a cert CA (recomendado).
 * - DB_SSL_REJECT_UNAUTHORIZED=true/false (por defecto true si hay CA; si no hay CA, usa false).
 */
function buildSSL() {
  const useSSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';
  if (!useSSL) return undefined;

  const caPath = process.env.DB_SSL_CA_PATH;
  const hasCA = caPath && fs.existsSync(caPath);

  if (hasCA) {
    // Con CA: verificación estricta del certificado
    return {
      ca: fs.readFileSync(caPath, 'utf8'),
      rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true'
    };
  }

  // Sin CA: último recurso para evitar handshakes fallidos (menos seguro)
  return {
    rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true'
  };
}

const pool = mysql.createPool({
  host:     process.env.DB_HOST,                 // p.ej. 144.126.134.74
  port:     parseInt(process.env.DB_PORT, 10) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Pool estable
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,   // 10s
  connectTimeout: 20000,          // 20s

  // Seguridad / compat
  multipleStatements: false,

  // Formato de datos
  dateStrings: true,              // DATETIME/TIMESTAMP como 'YYYY-MM-DD HH:mm:ss'
  timezone: 'Z',                  // UTC
  decimalNumbers: true,           // NUMERIC/DECIMAL como Number en lugar de string (opcional)

  // SSL según tu entorno
  ssl: buildSSL()
});

// Logs útiles (opcionales)
pool.on?.('connection', (conn) => {
  conn.on('error', (err) => console.error('[MySQL conn error]', err.code));
  conn.on('end',   () => console.warn('[MySQL conn ended]'));
});

module.exports = pool;


