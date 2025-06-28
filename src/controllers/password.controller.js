import supabase from '../services/supabaseClient.js';
import { hashPassword } from '../services/hash.service.js';
import sendBrevoEmail from '../services/email.service.js';
import crypto from 'crypto';

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

  const { error: insertError } = await supabase.from('reset_password').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
    used: false
  });

  if (insertError) {
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du token" });
  }

  const resetUrl = `${process.env.RESET_BASE_URL}?token=${token}`;

  try {
    await sendBrevoEmail(email, resetUrl);
    res.json({ message: 'Email de réinitialisation envoyé avec succès' });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l’envoi de l’email" });
  }
  // Optionally cleanup expired or used tokens
  await supabase
    .from('reset_password')
    .delete()
    .or(`used.eq.true,expires_at.lt.${new Date().toISOString()}`);
};

export const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Les mots de passe ne correspondent pas" });
  }

  const { data: record, error } = await supabase
    .from('reset_password')
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
    .from('reset_password')
    .update({ used: true })
    .eq('id', record.id);

  res.json({ message: "Mot de passe mis à jour avec succès ✅" });
};
