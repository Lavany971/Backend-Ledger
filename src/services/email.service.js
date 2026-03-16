require('dotenv').config();

const nodemailer = require('nodemailer');

// Define transporter configuration
const transporterConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
  },
};

// If OAuth2 credentials are provided, use them
if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REFRESH_TOKEN) {
  transporterConfig.auth.type = 'OAuth2';
  transporterConfig.auth.clientId = process.env.CLIENT_ID;
  transporterConfig.auth.clientSecret = process.env.CLIENT_SECRET;
  transporterConfig.auth.refreshToken = process.env.REFRESH_TOKEN;
} else if (process.env.EMAIL_PASS) {
  // Fallback to simple auth with App Password
  transporterConfig.auth.pass = process.env.EMAIL_PASS;
}

const transporter = nodemailer.createTransport(transporterConfig);

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transproter verification failed:', error.message);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your credentials or Refresh Token.');
    }
  }
};

async function sendRegistrationEmail(userEmail, name) {
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hi ${name},\n\nThank you for registering with Backend Ledger. We're excited to have you on board!\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Thank you for registering with Backend Ledger. We're excited to have you on board!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Successful!';
  const text = `Hello ${name}, \n\nYour transaction of $${amount} to account ${toAccount} was successful.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>Your transaction of $${amount} to account ${toAccount} was successful.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = 'Transaction Failed';
  const text = `Hello ${name},\n\nWe regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of $${amount} to account ${toAccount} has failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = { sendRegistrationEmail, sendTransactionEmail, sendTransactionFailureEmail };