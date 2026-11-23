
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

export async function verifyMailer() {
  await transporter.verify();
  return true;
}

export async function sendOtpEmail(otp,username) {
  if (!/^\d{6}$/.test(String(otp))) {
    throw new Error('Invalid OTP format.');
  }

  const sender = process.env.SMTP_USER;
  const recipient = process.env.OTP_EMAIL;

  if (
    !sender ||
    !recipient ||
    sender !== 'siddu@adsgoat.in' ||
    recipient !== 'siddu@adsgoat.in'
  ) {
    throw new Error('Email configuration is invalid.');
  }

  const result = await transporter.sendMail({
    from: {
      name: 'Minty Publishers',
      address: sender
    },
  
    to: recipient,
  
    subject: `Login OTP - ${username}`,
  
    text: `
  Minty Publishers - Login Verification
  
  Login attempt from: ${username}
  
  Your verification code is: ${otp}
  
  This OTP expires in 5 minutes.
  
  Never share your OTP with anyone.
    `,
  
    html: `
      <div style="
        max-width:500px;
        margin:auto;
        padding:25px;
        font-family:Arial,sans-serif;
        border:1px solid #e5e7eb;
        border-radius:12px;
      ">
        <h2>Minty Publishers</h2>
  
        <p>Login verification request</p>
  
        <p>
          <strong>Login username:</strong>
          ${username}
        </p>
  
        <p>Your login verification code is:</p>
  
        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          padding:20px;
          background:#f3f4f6;
          text-align:center;
          border-radius:8px;
        ">
          ${otp}
        </div>
  
        <p>This OTP expires in <strong>5 minutes</strong>.</p>
  
        <p style="color:#666;font-size:13px;">
          Never share your OTP with anyone.
        </p>
      </div>
    `
  });

  return {
    messageId: result.messageId
  };
}
