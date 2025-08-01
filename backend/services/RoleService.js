// services/RoleService.js
const RoleRepo = require('../repositories/RoleRepo');

class RoleService {
  static async getAll() {
    return await RoleRepo.list();
  }
}

module.exports = RoleService;
