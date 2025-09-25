const TransportistaRepo = require('../repositories/TransportistaRepo');

class TransportistaService {
  // Transportistas
  static async list() {
    return TransportistaRepo.findAll();
  }

  static async get(id) {
    const t = await TransportistaRepo.findById(id);
    if (!t) { const e = new Error('Transportista no encontrado'); e.statusCode = 404; throw e; }
    return t;
  }

  static async create(data) {
    if (!data?.nombre?.trim()) { const e = new Error('Nombre requerido'); e.statusCode = 400; throw e; }
    const id = await TransportistaRepo.create({ nombre: data.nombre.trim(), activo: data.activo ? 1 : 0 });
    return { id, ...data, activo: !!data.activo };
  }

  static async update(id, data) {
    await this.get(id); // valida existencia
    if (!data?.nombre?.trim()) { const e = new Error('Nombre requerido'); e.statusCode = 400; throw e; }
    await TransportistaRepo.update(id, { nombre: data.nombre.trim(), activo: data.activo ? 1 : 0 });
    return { id, ...data, activo: !!data.activo };
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
    if (!['transferencia','contra_entrega'].includes(regla?.metodo_pago)) {
      const e = new Error('método_pago inválido'); e.statusCode = 400; throw e;
    }
    await TransportistaRepo.upsertRule(transportistaId, regla);
    return { ok: true };
  }

  static async deleteRule(ruleId) {
    await TransportistaRepo.deleteRule(ruleId);
  }
}

module.exports = TransportistaService;
