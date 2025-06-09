import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

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

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
