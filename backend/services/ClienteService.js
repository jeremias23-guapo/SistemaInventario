// backend/services/ClienteService.js
const ClienteRepo = require('../repositories/ClienteRepo');

class ClienteService {
  // 2.a) Listar todos los clientes
  static async listAll() {
    return ClienteRepo.findAll();
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
}

module.exports = ClienteService;
