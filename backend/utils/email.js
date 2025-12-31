const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetEmail = (toEmail, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const html = `
    <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">🔒 Reset Your Password</h2>
        <p style="margin: 5px 0;">Secure access to your PickupZone account</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 15px; color: #374151;">
          We received a request to reset the password associated with your account.
        </p>
        <p style="font-size: 15px; color: #374151;">
          Click the button below to proceed with resetting your password:
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          This link will expire in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore the message.
        </p>
        <p style="font-size: 14px; color: #4b5563; margin-top: 30px;">
          Best regards,<br/><strong>PickupZone Team</strong>
        </p>
      </div>
      <div style="background-color: #f3f4f6; color: #6b7280; font-size: 12px; text-align: center; padding: 15px;">
        © ${new Date().getFullYear()} PickupZone. All rights reserved.
      </div>
    </div>
  `;

  transporter.sendMail({
    from: `"PickupZone" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Reset Your Password | PickupZone',
    html,
  }).catch((err) => {
    console.error(`❌ Failed to send reset email to ${toEmail}:`, err.message);
  });
};
