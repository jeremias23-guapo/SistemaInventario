const TransportistaRepo = require('../repositories/TransportistaRepo');

const toMoney = (n) => Math.round((Number(n) || 0) * 100) / 100;

class TransportistaService {
  // Transportistas

  static async get(id) {
    const t = await TransportistaRepo.findById(id);
    if (!t) {
      const e = new Error('Transportista no encontrado');
      e.statusCode = 404;
      throw e;
    }
    // normaliza tipos
    return {
      id: t.id,
      nombre: t.nombre,
      activo: !!Number(t.activo),
      precio_envio: toMoney(t.precio_envio),
    };
  }

  static async create(data) {
    if (!data?.nombre?.trim()) {
      const e = new Error('Nombre requerido');
      e.statusCode = 400;
      throw e;
    }
    const precio_envio = Number(data.precio_envio ?? 0);
    const id = await TransportistaRepo.create({
      nombre: data.nombre.trim(),
      activo: data.activo ? 1 : 0,
      precio_envio,
    });
    return { id, nombre: data.nombre.trim(), activo: !!data.activo, precio_envio: toMoney(precio_envio) };
  }

  static async update(id, data) {
    await this.get(id); // valida existencia
    if (!data?.nombre?.trim()) {
      const e = new Error('Nombre requerido');
      e.statusCode = 400;
      throw e;
    }
    const precio_envio = Number(data.precio_envio ?? 0);
    await TransportistaRepo.update(id, {
      nombre: data.nombre.trim(),
      activo: data.activo ? 1 : 0,
      precio_envio,
    });
    return { id, nombre: data.nombre.trim(), activo: !!data.activo, precio_envio: toMoney(precio_envio) };
  }

  static async listPaged({ page, pageSize, q }) {
    const res = await TransportistaRepo.findAllPaged({ page, pageSize, q });
    return {
      ...res,
      items: res.items.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        activo: !!Number(t.activo),
        precio_envio: toMoney(t.precio_envio),
      })),
    };
  }

  static async remove(id) {
    await this.get(id); // valida
    await TransportistaRepo.remove(id);
  }

  // Reglas
  static async listRules(transportistaId) {
    await this.get(transportistaId);
    return TransportistaRepo.listRules(transportistaId);
  }

  static async upsertRule(transportistaId, regla) {
    await this.get(transportistaId);
    if (!['transferencia', 'contra_entrega'].includes(regla?.metodo_pago)) {
      const e = new Error('método_pago inválido');
      e.statusCode = 400;
      throw e;
    }
    await TransportistaRepo.upsertRule(transportistaId, regla);
    return { ok: true };
  }

  static async deleteRule(ruleId) {
    await TransportistaRepo.deleteRule(ruleId);
  }
}

module.exports = TransportistaService;
