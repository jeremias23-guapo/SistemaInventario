const MarcaRepo = require('../repositories/MarcaRepo');

class MarcaService {
  async listarMarcas() {
    return MarcaRepo.findAll();
  }

  async obtenerMarca(id) {
    const m = await MarcaRepo.findById(id);
    if (!m) throw new Error('Marca no encontrada');
    return m;
  }

  async crearMarca(data) {
    if (!data.nombre?.trim()) {
      throw new Error('Validación: nombre requerido');
    }
    return MarcaRepo.create({ nombre: data.nombre.trim() });
  }

  async actualizarMarca(id, data) {
    await this.obtenerMarca(id);
    if (!data.nombre?.trim()) {
      throw new Error('Validación: nombre requerido');
    }
    return MarcaRepo.update(id, { nombre: data.nombre.trim() });
  }

  async eliminarMarca(id) {
    await this.obtenerMarca(id);
    return MarcaRepo.delete(id);
  }
}

module.exports = new MarcaService();
