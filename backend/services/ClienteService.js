// backend/services/ClienteService.js
const ClienteRepo = require('../repositories/ClienteRepo');

class ClienteService {
  // 2.a) Listar todos los clientes
  static async listAll(params) {
    return ClienteRepo.findAll(params);
  }

  // 2.b) Obtener un cliente por ID
  static async getById(id) {
    const cli = await ClienteRepo.findById(id);
    if (!cli) throw new Error('Cliente no encontrado');
    return cli;
  }

  // 2.c) Crear un cliente
  static async create(data) {
    // data = { nombre, contacto, email, direccion }
    return ClienteRepo.create(data);
  }

  // 2.d) Actualizar un cliente
  static async update(id, data) {
    return ClienteRepo.update(id, data);
  }

  // 2.e) Eliminar un cliente
  static async delete(id) {
    return ClienteRepo.delete(id);
  }

  // 2.f) Búsqueda ligera paginada
  static async searchLight({ q = '', page = 1, limit = 10 }) {
    return ClienteRepo.searchLight({ q, page, limit });
  }
}

module.exports = ClienteService;
