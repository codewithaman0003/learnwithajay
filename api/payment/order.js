import Razorpay from 'razorpay';
import connectDB from '../../config/database.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    await connectDB();
    const { amount } = req.body;
    // find logged-in user via a session cookie or token - fallback to query param or body (you may adapt)
    const userId = req.body.userId || req.query.userId || null;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userId: userId || 'anonymous' }
    };

    const order = await razorpay.orders.create(options);

    // If userId provided, attach order info to user doc
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.payment = user.payment || {};
        user.payment.orderId = order.id;
        user.payment.amount = amount;
        user.payment.status = 'created';
        await user.save();
      }
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    return res.status(500).json({ success: false, error: 'Order creation failed' });
  }
}
