import supabase from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import crypto from 'crypto';
import sendBrevoEmail from '../utils/sendEmail.js';

// 🔐 Create a user account
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

    // Check if email already used
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          username,
          plan_level: 0,
          plan: 'free',
          is_subscribed: false,
          usage_count: 0,
          trial_started_at: new Date(),
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;

    const newUser = data[0];

    res.status(201).json({
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

// 🔓 Connexion User
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

    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Receive email to send reset password link
export const forgotPassword = async (req, res) => {
  let { email } = req.body;
  email = email.toLowerCase();
  
  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!user || error) {
    return res.status(404).json({ error: 'Aucun utilisateur trouvé avec cet email' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  const { error: insertError } = await supabase.from('reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
    used: false
  });

  if (insertError) {
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du token" });
  }

  const resetUrl = `${process.env.RESET_BASE_URL}/set_up_new_password?token=${token}`;

  try {
    await sendBrevoEmail(email, resetUrl);
    res.json({ message: 'Email de réinitialisation envoyé avec succès' });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l’envoi de l’email" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
  }

  const { data: record, error } = await supabase
    .from('reset_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!record || error) {
    return res.status(400).json({ error: "Token invalide" });
  }

  if (record.used) {
    return res.status(400).json({ error: "Ce lien a déjà été utilisé" });
  }

  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: "Ce lien a expiré" });
  }

  const hashedPassword = await hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', record.user_id);

  if (updateError) {
    return res.status(500).json({ error: "Erreur lors de la mise à jour du mot de passe" });
  }

  await supabase
    .from('reset_tokens')
    .update({ used: true })
    .eq('id', record.id);

  res.json({ message: "Mot de passe mis à jour avec succès ✅" });
};
