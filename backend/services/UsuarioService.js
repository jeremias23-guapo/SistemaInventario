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

    const payload = { sub: user.id, username: user.username, rol: user.rol_id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return { token, user: { id: user.id, nombre: user.nombre, username: user.username, rol: user.rol_id } };
  }

  static async register({ nombre, username, password, rol_id }) {
    const exists = await UsuarioRepo.findByUsername(username);
    if (exists) throw { status: 400, message: 'El username ya existe' };

    const hash = await bcrypt.hash(password, 10);
    const user = await UsuarioRepo.create({ nombre, username, password: hash, rol_id });
    return user;
  }

  static async getAll() {
    return await UsuarioRepo.list();
  }

  static async getById(id) {
    const user = await UsuarioRepo.findById(id);
    if (!user) throw { status: 404, message: 'Usuario no encontrado' };
    return user;
  }
  static async update(id, { nombre, username, password, rol_id }) {
    // 1) Comprueba si existe el usuario
    await this.getById(id); // lanzará 404 si no existe

    // 2) Si envían password, hashealo
    let hash;
    if (password) {
      hash = await bcrypt.hash(password, 10);
    }

    // 3) Llama al repo
    const updated = await UsuarioRepo.updateById(id, {
      nombre,
      username,
      password: hash, // si hash es undefined, repo ignorará el campo
      rol_id
    });

    if (!updated) {
      throw { status: 500, message: 'No se pudo actualizar el usuario' };
    }

    // 4) Devuelve el usuario actualizado
    return await this.getById(id);
  }
}

module.exports = UsuarioService;
