import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = async (amount, receipt) => {
    try {
        const options = {
            amount: amount * 100, // amount in paise
            currency: 'INR',
            receipt: receipt,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error) {
        throw new Error('Order creation failed');
    }
};

export const verifyPayment = async (paymentId, orderId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment.status === 'captured';
    } catch (error) {
        return false;
    }
};