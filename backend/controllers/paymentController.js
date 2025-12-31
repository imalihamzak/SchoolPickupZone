const stripe = require('../utils/stripe');
const pool = require('../config/db');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { school_id, plan_id } = req.body;

    // Get plan info
    const [planRows] = await pool.execute(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [plan_id]
    );

    if (planRows.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const plan = planRows[0];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
            },
            unit_amount: parseInt(plan.price * 100), // Stripe needs amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:5173/success?school_id=${school_id}&plan_id=${plan_id}`,
      cancel_url: `http://localhost:5173/cancel`,
      metadata: {
        school_id,
        plan_id,
      },
    });

    res.json({ url: session.url });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
