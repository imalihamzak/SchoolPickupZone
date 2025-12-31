require('dotenv').config();
const stripe = require('../utils/stripe');
const pool = require('../config/db');
const { sendSubscriptionEmail } = require('../utils/sendSubscriptionEmail');

exports.createCheckoutSession = async (req, res) => {
    try {
      const planId = req.body.planId;
      const schoolId = req.user?.school_id;
  
      if (!schoolId || !planId) {
        return res.status(400).json({ error: 'Missing schoolId or planId' });
      }
  
      // Prevent duplicate active subscriptions
      const [existingSubscriptions] = await pool.execute(`
        SELECT * FROM subscriptions 
        WHERE school_id = ? AND status IN ('Active', 'Pending')
        ORDER BY start_date DESC
        LIMIT 1
      `, [schoolId]);
  
      if (existingSubscriptions.length > 0) {
        return res.status(400).json({ error: 'You already have an active subscription.' });
      }
  
      const [[plan]] = await pool.execute(
        `SELECT * FROM subscription_plans WHERE id = ?`, [planId]
      );
  
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: plan.name },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: plan.billing_interval === 'monthly' ? 'month' :
                        plan.billing_interval === 'yearly' ? 'year' :
                        plan.billing_interval,
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        metadata: {
          schoolId: String(schoolId),
          planId: String(planId),
        },
        success_url: `${process.env.CLIENT_URL}/payment-success?payment=success`,
        cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      });
  
      res.json({ url: session.url });
    } catch (err) {
      console.error('Stripe session error:', err.message);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  };
  
  

  exports.handleStripeWebhook = async (req, res) => {
    console.log("🔥 Stripe webhook hit");
  
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];
  
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret); 
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
  
      // Expand session to get line_items
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'subscription'],
      });
  
      const metadata = session.metadata;
      console.log('💬 Webhook metadata:', metadata);
  
      const schoolId = parseInt(metadata.schoolId, 10);
      const planId = parseInt(metadata.planId, 10);
      const amountPaid = sessionWithLineItems.amount_total / 100;
      const interval = sessionWithLineItems.line_items.data[0].price.recurring.interval;
  
      const now = new Date();
      const nextBilling = new Date(now);
      const endDate = new Date(now);
  
      if (interval === 'year') {
        nextBilling.setFullYear(now.getFullYear() + 1);
        endDate.setFullYear(now.getFullYear() + 1);
      } else {
        nextBilling.setMonth(now.getMonth() + 1);
        endDate.setMonth(now.getMonth() + 1);
      }
  
      try {
        // Record payment
        await pool.execute(`
          INSERT INTO payments (school_id, plan_id, amount, method, status, payment_date, transaction_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [schoolId, planId, amountPaid, 'Credit Card', 'Successful', now, session.id]
        );
  
        // Insert or update subscription
        await pool.execute(`
          INSERT INTO subscriptions 
            (school_id, plan_id, status, start_date, end_date, next_billing_date, last_payment_amount)
          VALUES (?, ?, 'Active', ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = 'Active',
            start_date = VALUES(start_date),
            end_date = VALUES(end_date),
            next_billing_date = VALUES(next_billing_date),
            last_payment_amount = VALUES(last_payment_amount)
        `, [schoolId, planId, now, endDate, nextBilling, amountPaid]);
  
        console.log(`✅ Subscription and payment recorded for school ${schoolId}`);
  
        // 🔔 Fetch admin info and send email
        const [[admin]] = await pool.execute(`
          SELECT u.email, u.firstName, u.lastName, p.name AS planName
          FROM users u
          JOIN schools s ON s.id = u.school_id
          JOIN subscription_plans p ON p.id = ?
          WHERE u.school_id = ? AND u.role = 'admin'
          LIMIT 1
        `, [planId, schoolId]);
  
        if (admin) {
          const { email, firstName, lastName, planName } = admin;
          const adminName = `${firstName} ${lastName}`;
          try {
            await sendSubscriptionEmail(email, adminName, planName, amountPaid, nextBilling);
            console.log(`📧 Subscription email sent to ${email}`);
          } catch (emailErr) {
            console.error('❌ Failed to send subscription email:', emailErr.message);
          }
        }
  
      } catch (dbErr) {
        console.error('❌ DB error during webhook handling:', dbErr.message);
      }
    }
  
    res.json({ received: true });
  };
  