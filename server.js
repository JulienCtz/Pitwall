import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js';
import { PORT } from './src/config/config.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// Middlewares
const allowedOrigins = [
  'https://editor.weweb.io',
  'https://44b0767e-0495-4cc3-8f84-eca00ca87d2b.weweb-preview.io',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('❌ Requête refusée : origin non autorisée =>', origin);
      callback(null, false); // NE JAMAIS lever une erreur ici
    }
  },
  credentials: true
}));

// Routes
app.use('/auth', authRoutes);

// Route test
app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API IA Simracing 🏎️");
});

// Test IP publique // a supprimer plus tard je pense
app.get('/my-ip', async (req, res) => {
  try {
    const ip = await fetch('https://api.ipify.org').then(r => r.text());
    console.log("🌐 IP publique du serveur Render :", ip);
    res.send(`IP publique du serveur : ${ip}`);
  } catch (e) {
    res.status(500).send("Erreur lors de la récupération de l'IP");
  }
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
