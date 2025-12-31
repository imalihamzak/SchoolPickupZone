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

const sendAdminInviteEmail = async ({ to, token, firstName }) => {
  const resetLink = `${process.env.CLIENT_URL}/set-new-password?token=${token}&email=${encodeURIComponent(to)}`;

  const html = `
    <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">🎉 Welcome to PickupZone!</h2>
        <p style="margin: 5px 0;">You're invited as an <strong>Admin</strong></p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          You've been added as an Admin to <strong>PickupZone</strong>. To activate your account, please set your password by clicking the button below:
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Set My Password
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          This link will expire in <strong>24 hours</strong>. If you didn't expect this invitation, please ignore this email.
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

  try {
    await transporter.sendMail({
      from: `"PickupZone" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔐 Set Your Admin Password | PickupZone`,
      html,
    });
    console.log(`✅ Admin invite sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send admin invite to ${to}:`, err.message);
  }
};

module.exports = sendAdminInviteEmail;
