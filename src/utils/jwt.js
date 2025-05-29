import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'; // À remplacer par une vraie clé en prod

console.log('Clé JWT utilisée :', JWT_SECRET);

// Générer un token JWT valable 12 heures
export const generateJWT = (user) => {
  console.log('📦 user reçu dans generateJWT →', user);//a supprimer apres test
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

// Vérifier et décoder un JWT
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
