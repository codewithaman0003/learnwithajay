import User from '../models/User.js';
import Webinar from '../models/Webinar.js';
import { createOrder, verifyPayment } from '../utils/paymentService.js';
import { sendPaymentSuccessEmail, sendPaymentReminderEmail } from '../utils/emailService.js';

export const initiatePayment = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.redirect('/register');
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/register');
        }

        // Get active webinar
        const webinar = await Webinar.findOne({ isActive: true });
        if (!webinar) {
            return res.render('pages/error', { 
                error: 'No active webinar found' 
            });
        }

        // Create Razorpay order
        const order = await createOrder(webinar.price, `webinar_${user._id}_${Date.now()}`);
        
        user.razorpayOrderId = order.id;
        user.amount = webinar.price;
        await user.save();

        res.render('pages/payment', {
            key: process.env.RAZORPAY_KEY_ID,
            amount: webinar.price,
            orderId: order.id,
            user: user,
            webinar: webinar
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        res.render('pages/error', { 
            error: 'Payment initiation failed. Please try again.' 
        });
    }
};

export const handlePaymentSuccess = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
        
        const user = await User.findOne({ razorpayOrderId: razorpay_order_id });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify payment
        const isPaymentValid = await verifyPayment(razorpay_payment_id, razorpay_order_id);
        
        if (!isPaymentValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed' 
            });
        }

        // Update user payment status
        user.paymentStatus = 'completed';
        user.razorpayPaymentId = razorpay_payment_id;
        user.paidAt = new Date();
        await user.save();

        // Send success email
        await sendPaymentSuccessEmail(user);

        // Update session
        req.session.paymentCompleted = true;
        req.session.userId = user._id;

        res.json({ 
            success: true, 
            redirectUrl: '/success',
            message: 'Payment successful!' 
        });

    } catch (error) {
        console.error('Payment success error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment processing failed' 
        });
    }
};

export const handlePaymentFailure = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;
        
        const user = await User.findOne({ razorpayOrderId: razorpay_order_id });
        if (user) {
            user.paymentStatus = 'pending';
            await user.save();
        }

        res.render('pages/payment-failure', {
            message: 'Payment failed. Please try again.',
            user: user
        });

    } catch (error) {
        console.error('Payment failure error:', error);
        res.render('pages/payment-failure', {
            message: 'Payment processing error.'
        });
    }
};

export const checkPaymentStatus = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.json({ hasAccess: false });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ hasAccess: false });
        }

        res.json({ 
            hasAccess: user.paymentStatus === 'completed',
            paymentStatus: user.paymentStatus
        });

    } catch (error) {
        res.json({ hasAccess: false });
    }
};

export const sendPaymentReminders = async () => {
    try {
        const pendingUsers = await User.find({ 
            paymentStatus: 'pending',
            'emailSent.reminder': false 
        });

        for (const user of pendingUsers) {
            await sendPaymentReminderEmail(user);
            user.emailSent.reminder = true;
            await user.save();
        }

        console.log(`Payment reminders sent to ${pendingUsers.length} users`);
    } catch (error) {
        console.error('Payment reminder error:', error);
    }
};