import supabase from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../services/hash.service.js';
import { generateJWT } from '../services/jwt.service.js';
import sanitizeHtml from 'sanitize-html';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config/config.js';
import { getExpiryDate } from '../services/time.js';

const clean = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });

export const signup = async (req, res) => {
  try {
    let { email, password, confirmPassword, username } = req.body;
    email = email.toLowerCase();

    if (!email || !password || !confirmPassword || !username) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await hashPassword(password);
    username = clean(username);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        username,
        plan_level: 0,
        plan: 'free',
        is_subscribed: false,
        usage_count: 0,
        created_at: new Date()
      }])
      .select();

    if (error) throw error;

    const newUser = data[0];

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        plan: newUser.plan
      }
    });
    

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = generateJWT(payload, ACCESS_TOKEN_EXPIRY);
    const refreshToken = generateJWT(payload, REFRESH_TOKEN_EXPIRY);

    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: getExpiryDate(REFRESH_TOKEN_EXPIRY),
        created_at: new Date()
      }]);

    console.log('🟢 [LOGIN] Utilisateur connecté :', payload);

    res.status(200).json({
      message: 'Connexion réussie',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        plan_level: user.plan_level,
        is_subscribed: user.is_subscribed,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.body.refresh_token;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token manquant' });
    }

    const { error } = await supabase
      .from('refresh_tokens')
      .delete()
      .eq('token', token);

    if (error) throw error;

    res.json({ message: 'Déconnexion réussie ✅' });
  } catch (error) {
    console.error("❌ [LOGOUT] Erreur :", error.message);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
};
