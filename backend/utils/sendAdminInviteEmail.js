const nodemailer = require('nodemailer');
require('dotenv').config();

const { buildClientUrl, buildEmailTemplate } = require('./emailTemplate');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendAdminInviteEmail = async ({ to, token, firstName }) => {
  const resetLink = buildClientUrl(
    `/set-new-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`
  );

  const html = buildEmailTemplate({
    title: 'Set Up Your Admin Account',
    subtitle: 'You have been invited to manage a PickupZone school account.',
    greeting: `Hi ${firstName || 'Admin'},`,
    paragraphs: [
      'A Super Admin has added you as a school admin in PickupZone.',
      'Use the button below to create your password and activate your admin access.',
    ],
    actionUrl: resetLink,
    actionLabel: 'Set My Password',
    notice: 'This secure link expires in 24 hours. If you were not expecting this invitation, you can ignore this email.',
    tone: 'teal',
  });

  try {
    await transporter.sendMail({
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Set your PickupZone admin password',
      html,
    });
    console.log(`Admin invite sent to ${to}`);
  } catch (err) {
    console.error(`Failed to send admin invite to ${to}:`, err.message);
    throw err;
  }
};

module.exports = sendAdminInviteEmail;
