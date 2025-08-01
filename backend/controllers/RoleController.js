// controllers/RoleController.js
const RoleService = require('../services/RoleService');

exports.list = async (req, res, next) => {
  try {
    const roles = await RoleService.getAll();
    res.json(roles);
  } catch (err) {
    next(err);
  }
};
