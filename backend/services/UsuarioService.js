// services/UsuarioService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioRepo = require('../repositories/UsuarioRepo');
require('dotenv').config();

function buildUserPayload(dbUser) {
  // Intenta usar el nombre de rol desde el repo; si no viene, usa un fallback por rol_id
  const rolNombre = dbUser.rol_nombre || dbUser.rol || (dbUser.rol_id === 1 ? 'admin' : 'usuario');
  return {
    sub: dbUser.id,
    username: dbUser.username,
    rol: rolNombre,
    rol_id: dbUser.rol_id,
  };
}

function sanitizeUser(dbUser) {
  // Estructura de usuario que se devuelve al cliente (sin password)
  const payload = buildUserPayload(dbUser);
  return {
    id: dbUser.id,
    nombre: dbUser.nombre,
    username: dbUser.username,
    rol: payload.rol,
    rol_id: payload.rol_id,
  };
}

class UsuarioService {
  /**
   * Autenticación: valida credenciales, firma JWT y devuelve { token, user }
   * - user incluye: { id, nombre, username, rol, rol_id }
   * - el JWT (payload) incluye: { sub, username, rol, rol_id }
   */
  static async authenticate({ username, password }) {
    const user = await UsuarioRepo.findByUsername(username);
    if (!user) throw { status: 401, message: 'Usuario o contraseña inválidos' };

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw { status: 401, message: 'Usuario o contraseña inválidos' };

    const payload = buildUserPayload(user);
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return {
      token,
      user: sanitizeUser(user),
    };
  }

  /**
   * Registro: crea usuario con contraseña hasheada
   * body: { nombre, username, password, rol_id }
   */
  static async register({ nombre, username, password, rol_id }) {
    if (!nombre || !username || !password || !rol_id) {
      throw { status: 400, message: 'Faltan campos requeridos' };
    }

    const exists = await UsuarioRepo.findByUsername(username);
    if (exists) throw { status: 400, message: 'El username ya existe' };

    const hash = await bcrypt.hash(password, 10);
    const created = await UsuarioRepo.create({
      nombre,
      username,
      password: hash,
      rol_id,
    });

    // Devuelve el usuario recién creado (sin password). Si el repo no retorna rol_nombre aquí, no pasa nada.
    return sanitizeUser(created);
  }

  /** Lista de usuarios (sin password) */
  static async getAll() {
    const rows = await UsuarioRepo.list();
    // En caso de que el repo incluya accidentalmente password, lo limpiamos:
    return rows.map(u => sanitizeUser(u));
  }

  /** Usuario por id (sin password) */
  static async getById(id) {
    const user = await UsuarioRepo.findById(id);
    if (!user) throw { status: 404, message: 'Usuario no encontrado' };
    return sanitizeUser(user);
  }

  /**
   * Actualización (si envían password, se re-hashea)
   * data: { nombre?, username?, password?, rol_id? }
   */
  static async update(id, { nombre, username, password, rol_id }) {
    // Verifica existencia
    const current = await UsuarioRepo.findById(id);
    if (!current) throw { status: 404, message: 'Usuario no encontrado' };

    let hash;
    if (typeof password === 'string' && password.trim().length) {
      hash = await bcrypt.hash(password, 10);
    }

    const updated = await UsuarioRepo.updateById(id, {
      nombre,
      username,
      password: hash, // si es undefined, el repo debe ignorar este campo
      rol_id,
    });

    if (!updated) throw { status: 500, message: 'No se pudo actualizar el usuario' };

    // Carga y devuelve el usuario final ya actualizado (sin password)
    const fresh = await UsuarioRepo.findById(id);
    return sanitizeUser(fresh);
  }
}

module.exports = UsuarioService;
