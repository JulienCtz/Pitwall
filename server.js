import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.js';
import { PORT, FRONTEND_ORIGIN } from './src/config/config.js';

const app = express();

// Middlewares
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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
