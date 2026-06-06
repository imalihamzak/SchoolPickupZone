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

exports.sendResetEmail = async (toEmail, token) => {
  const resetLink = buildClientUrl(`/reset-password?token=${encodeURIComponent(token)}`);

  const html = buildEmailTemplate({
    title: 'Reset Your Password',
    subtitle: 'Secure access for your PickupZone account.',
    greeting: 'Hello,',
    paragraphs: [
      'We received a request to reset the password for your PickupZone account.',
      'Use the button below to choose a new password.',
    ],
    actionUrl: resetLink,
    actionLabel: 'Reset Password',
    notice: 'This link expires in 15 minutes. If you did not request this reset, you can safely ignore this email.',
    tone: 'blue',
  });

  try {
    await transporter.sendMail({
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Reset your PickupZone password',
      html,
    });
  } catch (err) {
    console.error(`Failed to send reset email to ${toEmail}:`, err.message);
    throw err;
  }
};

exports.sendSetPasswordEmail = async (toEmail, token, options = {}) => {
  const setupLink = buildClientUrl(
    `/set-new-password?email=${encodeURIComponent(toEmail)}&token=${encodeURIComponent(token)}`
  );
  const roleLabel = options.role === 'guard' ? 'guard' : 'parent';
  const schoolName = options.schoolName || 'your school';
  const greetingName = [options.firstName, options.lastName].filter(Boolean).join(' ').trim();

  const html = buildEmailTemplate({
    title: 'Set Your PickupZone Password',
    subtitle: `Secure access for ${schoolName}.`,
    greeting: greetingName ? `Hello ${greetingName},` : 'Hello,',
    paragraphs: [
      `A school admin created your PickupZone ${roleLabel} account.`,
      'Use the button below to set your password and activate your account.',
    ],
    rows: [
      { label: 'School', value: schoolName },
      { label: 'Account type', value: roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) },
    ],
    actionUrl: setupLink,
    actionLabel: 'Set Password',
    notice: 'This link expires in 24 hours. If you were not expecting this account, contact the school office.',
    tone: 'teal',
  });

  try {
    await transporter.sendMail({
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Set your PickupZone password',
      html,
    });
  } catch (err) {
    console.error(`Failed to send password setup email to ${toEmail}:`, err.message);
    throw err;
  }
};

exports.sendEmailVerificationCode = async (toEmail, code, options = {}) => {
  const greetingName = [options.firstName, options.lastName].filter(Boolean).join(' ').trim();
  const html = buildEmailTemplate({
    title: 'Verify Your Email',
    subtitle: 'Confirm your PickupZone profile email change.',
    greeting: greetingName ? `Hello ${greetingName},` : 'Hello,',
    paragraphs: [
      'Use this verification code to confirm your new email address.',
      'Enter the code on your profile settings screen before saving the email change.',
    ],
    rows: [
      { label: 'Verification code', value: code },
    ],
    notice: 'This code expires in 10 minutes. If you did not request this change, keep your current email and contact support.',
    tone: 'blue',
  });

  try {
    await transporter.sendMail({
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify your PickupZone email',
      html,
    });
  } catch (err) {
    console.error(`Failed to send email verification code to ${toEmail}:`, err.message);
    throw err;
  }
};
