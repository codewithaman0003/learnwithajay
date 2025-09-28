import crypto from 'crypto';
import connectDB from '../../config/database.js';
import User from '../../models/User.js';
import { sendPaymentSuccessEmail, sendFailureEmail } from '../../utils/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    await connectDB();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign.toString()).digest('hex');

    const isValid = expectedSign === razorpay_signature;

    // find user by order id
    const user = await User.findOne({ 'payment.orderId': razorpay_order_id });

    if (!user) {
      console.warn('User not found for order:', razorpay_order_id);
    }

    if (isValid) {
      if (user) {
        user.payment = user.payment || {};
        user.payment.status = 'success';
        user.payment.paymentId = razorpay_payment_id;
        user.webinarAccess = true;
        await user.save();

        // send success email
        try { await sendPaymentSuccessEmail(user); } catch(e){ console.error('Email send error', e); }
      }

      return res.status(200).json({ success: true, message: 'Payment verified' });
    } else {
      if (user) {
        user.payment = user.payment || {};
        user.payment.status = 'failed';
        await user.save();
        try { await sendFailureEmail(user); } catch(e){ console.error('Failure email error', e); }
      }
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
}
