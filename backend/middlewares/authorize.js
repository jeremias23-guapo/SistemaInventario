// middlewares/authorize.js
const jwt = require('jsonwebtoken');

module.exports = function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado' });
      const token = authHeader.split(' ')[1];

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload; // { sub, username, rol, rol_id, ... }

      if (allowedRoles.length) {
        const allowByName = allowedRoles.some(r => typeof r === 'string') && allowedRoles.includes(payload.rol);
        const allowById   = allowedRoles.some(r => typeof r === 'number') && allowedRoles.includes(payload.rol_id);
        if (!allowByName && !allowById) {
          return res.status(403).json({ error: 'Acceso denegado' });
        }
      }
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
};
