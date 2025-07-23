// services/UsuarioService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioRepo = require('../repositories/UsuarioRepo');
require('dotenv').config();

class UsuarioService {
  static async authenticate({ username, password }) {
    const user = await UsuarioRepo.findByUsername(username);
    if (!user) throw { status: 401, message: 'Usuario o contraseña inválidos' };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { status: 401, message: 'Usuario o contraseña inválidos' };

    // Payload básico (puedes ampliar con más datos si quieres)
    const payload = {
      sub: user.id,
      username: user.username,
      rol: user.rol_id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return { token, user: { id: user.id, nombre: user.nombre, username: user.username, rol: user.rol_id } };
  }
}

module.exports = UsuarioService;
