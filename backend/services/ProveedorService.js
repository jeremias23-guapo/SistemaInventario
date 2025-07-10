// backend/services/ProveedorService.js
const ProveedorRepo = require('../repositories/ProveedorRepo');

class ProveedorService {
  static getAll() {
    return ProveedorRepo.findAll();
  }

  static getOne(id) {
    return ProveedorRepo.findById(id);
  }

  static create(data) {
    return ProveedorRepo.create(data);
  }

  static update(id, data) {
    return ProveedorRepo.update(id, data);
  }

  static delete(id) {
    return ProveedorRepo.delete(id);
  }
}

module.exports = ProveedorService;
