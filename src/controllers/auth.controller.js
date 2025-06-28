import supabase from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../services/hash.service.js';
import { generateJWT } from '../services/jwt.service.js';
import sanitizeHtml from 'sanitize-html';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../config/config.js';
import { getExpiryDate } from '../services/time.js';
import { generatePublicId } from '../services/publicId.service.js';

const clean = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });

export const signup = async (req, res) => {
  try {
    let { email, password, confirmPassword, username } = req.body;
    email = email.toLowerCase();

    if (!email || !password || !confirmPassword || !username) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // Vérifie le format d'email simple
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: "Email invalide." });
}

// Vérifie la longueur minimale du mot de passe
if (password.length < 6) {
  return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
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

    // Génère un public_id unique
let public_id;
let isUnique = false;
let attempts = 0;
const MAX_ATTEMPTS = 50;

while (!isUnique && attempts < MAX_ATTEMPTS) {
  public_id = generatePublicId();

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('public_id', public_id)
    .maybeSingle();

  if (!error && !data) {
    isUnique = true;
  } else {
    attempts++;
    if (attempts === 10) {
      console.warn('⚠️ Tentatives élevées pour générer un public_id unique');
    }
    await new Promise(resolve => setTimeout(resolve, 50)); // petit délai pour éviter une boucle trop agressive
  }
}

if (!isUnique) {
  return res.status(500).json({
    error: "Impossible de générer un identifiant utilisateur unique après plusieurs tentatives."
  });
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
        created_at: new Date(),
        public_id
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
        plan: newUser.plan,
        public_id: newUser.public_id
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

    // Supprimer les anciens refresh tokens du user
    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('user_id', user.id);

    // Créer un nouveau refresh token
    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: getExpiryDate(REFRESH_TOKEN_EXPIRY),
        created_at: new Date()
      }]);

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

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email, avatar } = req.body;

  const updateFields = {};

  // Vérifie si l'email est déjà utilisé par un autre utilisateur
  if (email) {
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (existingEmail) {
      return res.status(409).json({ error: "Cet email est déjà utilisé par un autre utilisateur." });
    }

    updateFields.email = email;
  }

  if (username) updateFields.username = username;
  if (avatar) updateFields.avatar = avatar;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
  }

  const { error } = await supabase
    .from('users')
    .update(updateFields)
    .eq('id', userId);

  if (error) {
    return res.status(500).json({ error: "Erreur lors de la mise à jour du profil." });
  }

  res.json({ message: "Profil mis à jour avec succès ✅" });
};

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
  }

  // Récupère le mot de passe actuel
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError || !user) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  const valid = await comparePassword(oldPassword, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  }

  const hashedPassword = await hashPassword(newPassword);

  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) {
    return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe." });
  }

  res.json({ message: "Mot de passe mis à jour avec succès ✅" });
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
