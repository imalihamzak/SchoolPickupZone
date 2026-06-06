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

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const dashboardUrl = () => buildClientUrl('/');

exports.sendSubscriptionEmail = async (to, adminName, planName, amount, nextBillingDate) => {
  const html = buildEmailTemplate({
    title: 'Subscription Active',
    subtitle: 'Your PickupZone package is ready to use.',
    greeting: `Hi ${adminName || 'there'},`,
    paragraphs: [
      `Your subscription to the ${planName || 'selected'} package has been activated successfully.`,
      'You can now manage school pickup operations from your PickupZone dashboard.',
    ],
    rows: [
      { label: 'Package', value: planName || 'Selected package' },
      { label: 'Amount Paid', value: formatMoney(amount) },
      { label: 'Next Billing Date', value: formatDate(nextBillingDate) },
    ],
    actionUrl: dashboardUrl(),
    actionLabel: 'Open Dashboard',
    tone: 'teal',
  });

  await transporter.sendMail({
    from: `"PickupZone" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your PickupZone subscription is active',
    html,
  });
};

exports.sendBillingReminderEmail = async ({
  to,
  adminName,
  schoolName,
  planName,
  amountDue,
  dueAt,
  invoiceUrl,
}) => {
  const html = buildEmailTemplate({
    title: 'Upcoming Payment Reminder',
    subtitle: 'A scheduled PickupZone payment is coming due.',
    greeting: `Hi ${adminName || 'there'},`,
    paragraphs: [
      `Your upcoming PickupZone payment for ${schoolName || 'your school'} is coming due soon.`,
    ],
    rows: [
      { label: 'Package', value: planName || 'Current package' },
      { label: 'Amount Due', value: formatMoney(amountDue) },
      { label: 'Due Date', value: formatDate(dueAt) },
    ],
    actionUrl: invoiceUrl || dashboardUrl(),
    actionLabel: invoiceUrl ? 'View Invoice' : 'Open Dashboard',
    notice: 'Keeping billing current helps avoid service interruption for the school.',
    tone: 'amber',
  });

  await transporter.sendMail({
    from: `"PickupZone" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'PickupZone payment reminder',
    html,
  });
};

exports.sendPaymentRetryEmail = async ({
  to,
  adminName,
  schoolName,
  planName,
  amountDue,
  nextRetryAt,
  invoiceUrl,
}) => {
  const html = buildEmailTemplate({
    title: 'Payment Retry Scheduled',
    subtitle: 'We could not complete the latest PickupZone payment.',
    greeting: `Hi ${adminName || 'there'},`,
    paragraphs: [
      `The latest PickupZone payment for ${schoolName || 'your school'} failed. We have scheduled another retry.`,
      'Please review the invoice or payment method before the next retry attempt.',
    ],
    rows: [
      { label: 'Package', value: planName || 'Current package' },
      { label: 'Amount Due', value: formatMoney(amountDue) },
      { label: 'Next Retry', value: formatDate(nextRetryAt) },
    ],
    actionUrl: invoiceUrl || dashboardUrl(),
    actionLabel: invoiceUrl ? 'Review Invoice' : 'Open Dashboard',
    tone: 'red',
  });

  await transporter.sendMail({
    from: `"PickupZone" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'PickupZone payment failed - retry scheduled',
    html,
  });
};
