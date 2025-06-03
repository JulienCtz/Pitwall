import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config.js';

// Générer un token JWT valable 1 heure
export const generateJWT = (user, expiresIn = '1h') => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn }
  );
};

// Vérifier et décoder un JWT
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
