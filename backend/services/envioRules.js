// backend/services/envioRules.js
//servicio para calcular el costo de envio segun reglas del transportista
const pool = require('../config/db');

function toMoney(n) { return Math.round((Number(n) || 0) * 100) / 100; }

async function calcularCostoEnvioProveedor({ transportista_id, metodo_pago, total_venta }) {
  const tid = Number(transportista_id) || 0;
  if (!tid) return 0;

  const mp = String(metodo_pago || 'transferencia').toLowerCase();
  const total = Math.max(0, Number(total_venta) || 0);

  const [rows] = await pool.query(
    `SELECT porcentaje, fijo_usd, umbral_monto, aplica_si_menor_que
       FROM transportista_reglas
      WHERE transportista_id = ? AND metodo_pago = ?
      LIMIT 1`,
    [tid, mp]
  );
  if (!rows.length) return 0;

  const r = rows[0];
  const pct    = Number(r.porcentaje || 0);
  const fijo   = Number(r.fijo_usd   || 0);
  const umbral = r.umbral_monto == null ? null : Number(r.umbral_monto);
  const aplicaFijoMenor = !!Number(r.aplica_si_menor_que);

  // Regla: ≤ umbral => fijo; > umbral => SOLO porcentaje
  if (umbral != null && aplicaFijoMenor && total <= umbral) {
    return toMoney(fijo);
  }
  return toMoney(total * pct);
}

module.exports = { calcularCostoEnvioProveedor };
