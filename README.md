# 🏁 Pitwall – Backend API Simracing IA

Bienvenue dans le backend de **Pitwall**, une application de stratégie pour le Simracing avec intégration d’IA.  
Ce projet utilise **Node.js + Express**, **Supabase** comme base de données, et est entièrement structuré en **ESModules**.  
Il est conçu pour être connecté à **Bubble.io** via API et testé en live avec **Ngrok**.

---

## ✅ Fonctionnalités déjà mises en place

- Initialisation complète du projet avec `npm`, `express` et `nodemon`
- Structure en **ESModules (`import/export`)**
- Connexion à Supabase via SDK
- Gestion de l'environnement `.env`
- Setup de Git + GitHub (sauvegarde + historique)
- Mise en place de Gitignore (`.env`, `node_modules`)
- Serveur local fonctionnel (`npm run dev`)
- Intégration prête pour Bubble.io via Ngrok

---

## 🚧 Prochaine étape

- [ ] 🔐 Création des routes API `/signup` et `/login`
  - Enregistrement avec hash du mot de passe
  - Vérification des identifiants à la connexion
  - Sauvegarde des utilisateurs dans Supabase
- [ ] 🔐 Mise en place du middleware `requireAuth`
- [ ] 📊 Préparer l'intégration de logique IA / ML (phase suivante)

---

## ▶️ Lancer le projet en local

```bash
npm install
npm run dev
```