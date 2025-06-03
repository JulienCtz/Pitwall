// config.js
import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
export const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3001';
export const PORT = process.env.PORT || 3000;
export const IS_PROD = process.env.NODE_ENV === 'production';
