import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const sendBrevoEmail = async (to, resetUrl) => {
  const payload = {
    sender: {
      name: 'PitWall',
      email: 'simracing.zone1@gmail.com'
    },
    to: [{ email: to }],
    subject: '🔐 Réinitialisation de votre mot de passe',
    htmlContent: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte PitWall.</p>
      <p><a href="${resetUrl}">Cliquez ici pour définir un nouveau mot de passe</a></p>
      <p>Ce lien est valable 24h. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Email envoyé à :", to);
    return response.data;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l’email :", error.response?.data || error.message);
    throw new Error("Impossible d’envoyer l’email");
  }
};

export default sendBrevoEmail;
