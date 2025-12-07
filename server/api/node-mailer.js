const nodemailer = require('nodemailer'); // node.js mail kütüphanesi
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,      // kullanıcı e-mail
    pass: process.env.MAIL_PASS       // google dan alınan pass
  }
});

/**
 * İki kişiye aynı anda mail atar (kullanıcı + davetli)
 * @param {Object} options
 * @param {string[]} options.toEmails - Mail gönderilecek adresler
 * @param {string} options.subject - Mail başlığı
 * @param {string} options.text - Mail içeriği
 */
async function sendMailToParticipants({ toEmails, subject, text }) {
  try {
    const mailOptions = {
      from: `"Takvim Uygulaması" <${process.env.MAIL_USER}>`,
      to: toEmails.join(','),
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Mail gönderildi:', info.response);
  } catch (error) {
    console.error('Mail gönderme hatası:', error);
  }
}

module.exports = sendMailToParticipants;