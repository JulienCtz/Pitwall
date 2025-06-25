import supabase from '../services/supabaseClient.js';
import { generateJWT, verifyJWT } from '../services/jwt.service.js';
import { REFRESH_TOKEN_EXPIRY } from '../config/config.js';
import { getExpiryDate } from '../services/time.js';

export const refreshToken = async (req, res) => {
  const token = req.body.refresh_token;

  console.log('\n🔄 [REFRESH] Tentative de refresh token');
  console.log('🧪 Token reçu :', token);

  if (!token) {
    return res.status(401).json({ error: 'Refresh token manquant' });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
  }

  const expMs = payload.exp * 1000;
if (expMs < Date.now()) {
  console.log("❌ Refresh token expiré (exp trop ancien)");
  return res.status(401).json({ error: 'Refresh token expiré (exp)' });
}

  const { data: storedToken, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !storedToken) {
    return res.status(401).json({ error: 'Refresh token non autorisé' });
  }

  const newAccessToken = generateJWT({
    id: payload.id,
    email: payload.email,
    username: payload.username
  });

  const newRefreshToken = generateJWT({
    id: payload.id,
    email: payload.email,
    username: payload.username
  }, REFRESH_TOKEN_EXPIRY);

  // Supprime l’ancien token (rotation stricte)
  await supabase
    .from('refresh_tokens')
    .delete()
    .eq('token', token);

  // Insère le nouveau
  await supabase
    .from('refresh_tokens')
    .insert([{
      user_id: payload.id,
      token: newRefreshToken,
      expires_at: getExpiryDate(REFRESH_TOKEN_EXPIRY),
    }]);

  console.log('✅ Nouveau access_token :', newAccessToken);
  console.log('🔁 Nouveau refresh_token :', newRefreshToken);

  res.json({
    token: newAccessToken,
    refreshToken: newRefreshToken
  });
};

export const listActiveSessions = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id, created_at, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des sessions' });
  }

  res.json(data);
};
