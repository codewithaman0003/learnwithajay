const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const User = require('../models/User');
const Webinar = require('../models/Webinar');
const Payment = require('../models/Payment');
const { sendWelcomeEmail } = require('../utils/emailService');
const { verifyPayment } = require('../utils/paymentVerification');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order - with existing registration check
router.post('/create-order', async (req, res) => {
    try {
        const { webinarId, name, email, phone } = req.body;
        
        const webinar = await Webinar.findById(webinarId);
        if (!webinar) {
            return res.status(404).json({ error: 'Webinar not found' });
        }

        // Check if user already has a pending registration for this webinar
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            webinarId: webinarId,
            paymentStatus: 'pending'
        });

        if (existingUser) {
            // User already has a pending registration - create new order for existing user
            console.log('Found existing pending registration for:', email);
            
            // Create Razorpay order for existing user
            const options = {
                amount: webinar.price * 100,
                currency: "INR",
                receipt: `receipt_${existingUser._id}_retry`,
                notes: {
                    userId: existingUser._id.toString(),
                    webinarId: webinarId
                }
            };

            const order = await razorpay.orders.create(options);
            
            // Update existing user with new order ID and updated info
            existingUser.razorpayOrderId = order.id;
            existingUser.name = name; // Update name if changed
            existingUser.phone = phone; // Update phone if changed
            await existingUser.save();

            return res.json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                existingUser: true, // Flag to show this is an existing registration
                message: 'Continuing your existing registration'
            });
        }

        // Check if user already has a paid registration for this webinar
        const paidUser = await User.findOne({
            email: email.toLowerCase().trim(),
            webinarId: webinarId,
            paymentStatus: 'paid'
        });

        if (paidUser) {
            return res.status(400).json({ 
                error: 'You have already registered and paid for this webinar. Check your email for confirmation.' 
            });
        }

        // Create new user record for first-time registration
        const user = new User({
            name,
            email: email.toLowerCase().trim(),
            phone,
            webinarId,
            amount: webinar.price,
            paymentStatus: 'pending'
        });

        await user.save();

        // Create Razorpay order for new user
        const options = {
            amount: webinar.price * 100,
            currency: "INR",
            receipt: `receipt_${user._id}`,
            notes: {
                userId: user._id.toString(),
                webinarId: webinarId
            }
        };

        const order = await razorpay.orders.create(options);
        
        // Update user with order ID
        user.razorpayOrderId = order.id;
        await user.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            existingUser: false
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Order creation failed: ' + error.message });
    }
});

// Create order for existing user (for payment completion page)
router.post('/create-order-existing', async (req, res) => {
    try {
        const { userId, webinarId } = req.body;
        
        const user = await User.findById(userId);
        const webinar = await Webinar.findById(webinarId);
        
        if (!user || !webinar) {
            return res.status(404).json({ error: 'User or webinar not found' });
        }

        if (user.paymentStatus === 'paid') {
            return res.status(400).json({ error: 'Payment already completed' });
        }

        // Create Razorpay order for existing user
        const options = {
            amount: webinar.price * 100,
            currency: "INR",
            receipt: `receipt_${user._id}_direct`,
            notes: {
                userId: user._id.toString(),
                webinarId: webinarId
            }
        };

        const order = await razorpay.orders.create(options);
        
        // Update user with new order ID
        user.razorpayOrderId = order.id;
        await user.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Order creation error for existing user:', error);
        res.status(500).json({ error: 'Order creation failed: ' + error.message });
    }
});

// Payment verification (Serverless compatible)
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        
        if (isValid) {
            // Update user payment status
            const user = await User.findOne({ razorpayOrderId: razorpay_order_id });
            if (user) {
                user.paymentStatus = 'paid';
                user.razorpayPaymentId = razorpay_payment_id;
                await user.save();

                // Create payment record
                const payment = new Payment({
                    userId: user._id,
                    webinarId: user.webinarId,
                    amount: user.amount,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    status: 'paid'
                });
                await payment.save();

                // Send welcome email
                await sendWelcomeEmail(user.email, user.name, user.webinarId);

                res.json({ 
                    success: true, 
                    message: 'Payment verified successfully',
                    paymentId: razorpay_payment_id
                });
            } else {
                res.status(404).json({ success: false, error: 'User not found' });
            }
        } else {
            // Mark payment as failed
            const user = await User.findOne({ razorpayOrderId: razorpay_order_id });
            if (user) {
                user.paymentStatus = 'failed';
                await user.save();

                const payment = new Payment({
                    userId: user._id,
                    webinarId: user.webinarId,
                    amount: user.amount,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    status: 'failed'
                });
                await payment.save();
            }

            res.status(400).json({ success: false, error: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    }
});

// Success page
router.get('/success', async (req, res) => {
    try {
        const paymentId = req.query.payment_id;
        const payment = await Payment.findOne({ razorpayPaymentId: paymentId })
            .populate('userId')
            .populate('webinarId');

        if (!payment) {
            return res.redirect('/webinars');
        }

        res.render('pages/success', { 
            payment,
            user: payment.userId,
            webinar: payment.webinarId
        });
    } catch (error) {
        res.redirect('/webinars');
    }
});

// Complete payment page for existing registrations
router.get('/complete-payment/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('webinarId');
        
        if (!user) {
            return res.status(404).render('pages/error', { error: 'Registration not found' });
        }

        if (user.paymentStatus === 'paid') {
            return res.redirect(`/payment/success?payment_id=${user.razorpayPaymentId}`);
        }

        if (user.paymentStatus === 'failed') {
            // Allow retry for failed payments
            return res.render('pages/complete-payment', {
                user: user,
                webinar: user.webinarId,
                status: 'failed'
            });
        }

        res.render('pages/complete-payment', {
            user: user,
            webinar: user.webinarId,
            status: 'pending'
        });
    } catch (error) {
        console.error('Complete payment page error:', error);
        res.status(500).render('pages/error', { error: 'Server error: ' + error.message });
    }
});

// Get user's registration status
router.get('/check-registration/:email/:webinarId', async (req, res) => {
    try {
        const { email, webinarId } = req.params;
        
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            webinarId: webinarId
        }).populate('webinarId');

        if (!user) {
            return res.json({ registered: false });
        }

        res.json({
            registered: true,
            paymentStatus: user.paymentStatus,
            userId: user._id,
            webinar: user.webinarId,
            amount: user.amount
        });
    } catch (error) {
        console.error('Check registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Resend welcome email (for admin or users)
router.post('/resend-email/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId).populate('webinarId');
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.paymentStatus !== 'paid') {
            return res.status(400).json({ success: false, error: 'User has not completed payment' });
        }

        await sendWelcomeEmail(user.email, user.name, user.webinarId);

        res.json({ success: true, message: 'Welcome email resent successfully' });
    } catch (error) {
        console.error('Resend email error:', error);
        res.status(500).json({ success: false, error: 'Failed to resend email' });
    }
});

module.exports = router;