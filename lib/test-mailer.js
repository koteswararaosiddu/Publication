
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local from project root
const envPath = path.resolve(__dirname, '../.env.local');

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Unable to load .env.local:', result.error.message);
  process.exit(1);
}

async function testEmail() {
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('SMTP User:', process.env.SMTP_USER);

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error('SMTP environment variables are missing.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === 'true',

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000
  });

  await transporter.verify();

  console.log('SMTP connection successful!');
}

testEmail().catch(error => {
  console.error('SMTP ERROR:', error.message);
});
