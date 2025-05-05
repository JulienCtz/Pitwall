import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Route d'inscription
router.post('/signup', signup);

// Route de connexion
router.post('/login', login);

export default router;
