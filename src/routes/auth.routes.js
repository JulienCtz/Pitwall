import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import supabase from '../services/supabaseClient.js';
import { signup, login, logout } from '../controllers/auth.controller.js';
import { forgotPassword, resetPassword } from '../controllers/password.controller.js';
import { refreshToken } from '../controllers/token.controller.js';
import { listActiveSessions } from '../controllers/token.controller.js';
import { updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { changePassword } from '../controllers/auth.controller.js';

const router = express.Router();

// Auth public
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/update', requireAuth, updateProfile);
router.patch('/change-password', requireAuth, changePassword);

// Tokens
router.post('/refreshToken', refreshToken);
router.post('/logout', requireAuth, logout);
router.get('/sessions', requireAuth, listActiveSessions);

// Route sécurisée : /auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
  .from('users')
  .select('id, email, username, plan, plan_level, is_subscribed, usage_count, avatar, public_id, created_at')
  .eq('id', userId)
  .maybeSingle();

if (error || !user) {
  return res.status(404).json({ error: 'Utilisateur non trouvé' });
}

res.json({ user });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifie si l'utilisateur est connecté (status rapide)
router.get('/status', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user  // id, email, username
  });
});

export default router;
