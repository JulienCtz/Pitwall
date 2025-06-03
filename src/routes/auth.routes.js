import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import supabase from '../services/supabaseClient.js';
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout // 👈 C'est ça qu’il manque !
} from '../controllers/auth.controller.js';

const router = express.Router();

// Route d'inscription
router.post('/signup', signup);

// Route de connexion  
router.post('/login', login);

// 🔐 Route de reset mot de passe (forgot)
router.post('/forgot-password', forgotPassword);

// 🔓 Route de reset mot de passe (reset)
router.post('/reset-password', resetPassword);

// 🔒 Route de refresh token
router.post('/refreshToken', refreshToken);

// 🔒 Route de logout
router.post('/logout', logout);

// 🔒 Route sécurisée qui retourne l'utilisateur connecté (JWT)
router.get('/me', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;

      console.log('🔐 Route /auth/me appelée pour :', req.user.email); // a supprimer apres test
  
      const { data: user, error } = await supabase
        .from('users')
        .select('*')//.select('id, email, username, plan, plan_level, is_subscribed, subscription_expiry')
        .eq('id', userId)
        .maybeSingle();

        console.log('🧩 REQUÊTE ME ID :', userId); // a supprimer apres test
        console.log('🧩 UTILISATEUR TROUVÉ :', user);// a supprimer apres test
  
      if (error || !user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }
  
      res.json({ user });
  
    } catch (err) {
      console.error('❌ ERREUR /me :', err);// a supprimer apres test
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  
  export default router;
  
