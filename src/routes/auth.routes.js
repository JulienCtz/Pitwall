import express from 'express';
import { signup, login, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import supabase from '../services/supabaseClient.js';

const router = express.Router();

// Route d'inscription
router.post('/signup', signup);

// Route de connexion  
router.post('/login', login);

// 🔐 Route de reset mot de passe (forgot)
router.post('/forgot-password', forgotPassword);

// 🔓 Route de reset mot de passe (reset)
router.post('/reset-password', resetPassword);

// 🔒 Route sécurisée qui retourne l'utilisateur connecté (JWT)
router.get('/me', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
  
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, plan, plan_level, is_subscribed, subscription_expiry')
        .eq('id', userId)
        .maybeSingle();
  
      if (error || !user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
  
      res.json({ user });
  
    } catch (err) {
      console.error('❌ ERREUR /me :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  
  export default router;
  
