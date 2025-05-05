import supabase from '../services/supabaseClient.js';
import { hashPassword, comparePassword } from '../utils/hash.js';

// 🔐 Crée un compte utilisateur
export const signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, username } = req.body;

    if (!email || !password || !confirmPassword || !username) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }

    // Vérifie si l’email est déjà utilisé
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

// 🔓 Connexion utilisateur
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
