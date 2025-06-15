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
  'https://simracingzone1.weweb-preview.io',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed: ' + origin));
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

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
