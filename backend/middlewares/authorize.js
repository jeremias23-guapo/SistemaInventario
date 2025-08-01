// middlewares/authorize.js
const jwt = require('jsonwebtoken');

module.exports = function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      // 1) Leer el token del encabezado Authorization: Bearer <token>
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }
      const token = authHeader.split(' ')[1];

      // 2) Verificar y decodificar
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // payload: { sub, username, rol, iat, exp }

      // 3) Comprobar rol
      if (!allowedRoles.includes(payload.rol)) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // 4) Seguir al siguiente handler
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};
