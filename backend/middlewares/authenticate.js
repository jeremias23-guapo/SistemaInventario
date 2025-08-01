// middlewares/authenticate.js
// Middleware para validar el JWT y extraer el payload en req.user
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Obtener encabezado Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Formato esperado: 'Bearer <token>'
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  const token = parts[1];
  try {
    // Verificar y decodificar el token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Guardar datos del usuario en la petición
    req.user = payload;  // { sub, username, rol, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
