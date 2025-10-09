// backend/services/ProveedorService.js
const ProveedorRepo = require('../repositories/ProveedorRepo');

class ProveedorService {
  static getAll(params) {
    return ProveedorRepo.findPage(params);
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
  static remove(id) {
    return ProveedorRepo.remove(id);
  }
}

module.exports = ProveedorService;
