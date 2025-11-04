// backend/services/envioRules.js
// Servicio para calcular costo de envío y comisión según reglas del transportista
const pool = require('../config/db');

function toMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Versión extendida:
 * - Lee precio_envio desde transportistas
 * - Calcula comisión sobre (total_venta + precio_envio)
 * - Devuelve ambos valores
 *
 * @param {Object} params
 * @param {number|string|null} params.transportista_id
 * @param {'transferencia'|'contra_entrega'|string} params.metodo_pago
 * @param {number|string} params.total_venta
 * @returns {Promise<{ comision: number, costo_envio: number }>}
 */
async function calcularCostoEnvioProveedorExtendido({ transportista_id, metodo_pago, total_venta }) {
  const tid = Number(transportista_id) || 0;
  if (!tid) return { comision: 0, costo_envio: 0 };

  const mp = String(metodo_pago || 'transferencia').toLowerCase();
  const total = Math.max(0, Number(total_venta) || 0);

  // 1) Traer precio_envio del transportista
  const [tRows] = await pool.query(
    `SELECT precio_envio
       FROM transportistas
      WHERE id = ?`,
    [tid]
  );
  const costo_envio = toMoney(tRows?.[0]?.precio_envio || 0);

  // 2) Traer regla para el método de pago
  const [rows] = await pool.query(
    `SELECT porcentaje, fijo_usd, umbral_monto, aplica_si_menor_que
       FROM transportista_reglas
      WHERE transportista_id = ? AND metodo_pago = ?
      LIMIT 1`,
    [tid, mp]
  );
  if (!rows.length) {
    return { comision: 0, costo_envio };
  }

  const r = rows[0];
  const pct    = Number(r.porcentaje || 0);
  const fijo   = Number(r.fijo_usd   || 0);
  const umbral = r.umbral_monto == null ? null : Number(r.umbral_monto);
  const aplicaFijoMenor = !!Number(r.aplica_si_menor_que);

  // 3) Base = total de líneas + costo de envío
  const base = total + costo_envio;

  // Regla: ≤ umbral => fijo; > umbral => SOLO porcentaje
  let comision = 0;
  if (umbral != null && aplicaFijoMenor && base <= umbral) {
    comision = fijo;
  } else {
    comision = base * pct;
  }

  return {
    comision: toMoney(comision),
    costo_envio,
  };
}

/**
 * Versión compatible con llamadas existentes:
 * - Calcula y devuelve SOLO la comisión
 * - La comisión se calcula sobre (total_venta + precio_envio)
 *   para reflejar la nueva lógica de negocio
 *
 * @param {Object} params
 * @param {number|string|null} params.transportista_id
 * @param {'transferencia'|'contra_entrega'|string} params.metodo_pago
 * @param {number|string} params.total_venta
 * @returns {Promise<number>} comisión
 */
async function calcularCostoEnvioProveedor({ transportista_id, metodo_pago, total_venta }) {
  const { comision } = await calcularCostoEnvioProveedorExtendido({
    transportista_id,
    metodo_pago,
    total_venta,
  });
  return comision;
}

module.exports = {
  calcularCostoEnvioProveedor,            // mantiene compatibilidad (devuelve solo comisión)
  calcularCostoEnvioProveedorExtendido,   // devuelve { comision, costo_envio }
};

