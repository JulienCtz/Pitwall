// test-email.js

import sendBrevoEmail from './src/utils/sendEmail.js';

const test = async () => {
  const emailTest = 'julien.costaz@gmail.com'; // Remplace par un vrai email à toi
  const fakeResetUrl = 'https://tonsite.com/reset-password?token=abc123';

  try {
    await sendBrevoEmail(emailTest, fakeResetUrl);
    console.log('✅ Email envoyé avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de l’envoi :', err.message);
  }
};

test();
