import { verifyJWT } from '../utils/jwt.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé : token manquant' });
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyJWT(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }

  req.user = decoded;
  next();
};