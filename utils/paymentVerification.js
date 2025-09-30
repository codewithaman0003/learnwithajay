const crypto = require('crypto');

function verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    return expectedSignature === razorpay_signature;
}

module.exports = { verifyPayment };