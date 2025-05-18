import express from 'express';
import { signup, login, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const router = express.Router();

// Route d'inscription
router.post('/signup', signup);

// Route de connexion  
router.post('/login', login);

// 🔐 Route de reset mot de passe (forgot)
router.post('/forgot-password', forgotPassword);

// 🔓 Route de reset mot de passe (reset)
router.post('/reset-password', resetPassword);

export default router;
