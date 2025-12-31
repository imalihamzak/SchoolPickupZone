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

exports.sendSubscriptionEmail = async (to, adminName, planName, amount, nextBillingDate) => {
  const formattedDate = new Date(nextBillingDate).toLocaleDateString("en-US", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">🎉 Subscription Successful!</h2>
        <p style="margin: 5px 0;">Welcome to <strong>PickupZone</strong></p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <p style="font-size: 16px;">Dear <strong>${adminName}</strong>,</p>
        <p style="font-size: 15px; color: #374151;">
          We're excited to inform you that your subscription to the <strong>${planName}</strong> plan has been successfully activated.
        </p>
        <table style="width: 100%; margin: 20px 0; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #111827;">$${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Next Billing Date:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #111827;">${formattedDate}</td>
          </tr>
        </table>
        <p style="font-size: 14px; color: #4b5563;">
          If you have any questions or need assistance, feel free to reach out to our support team.
        </p>
        <p style="font-size: 14px; color: #4b5563;">
          Thank you for choosing PickupZone!
        </p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.CLIENT_URL}" style="background-color: #4f46e5; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold;">Visit Dashboard</a>
        </div>
      </div>
      <div style="background-color: #f3f4f6; color: #6b7280; font-size: 12px; text-align: center; padding: 15px;">
        © ${new Date().getFullYear()} PickupZone. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"PickupZone" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🎉 Your PickupZone Subscription is Active!`,
    html,
  });
};
