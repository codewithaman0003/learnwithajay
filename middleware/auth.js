export const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/register');
    }
};

export const requirePayment = (req, res, next) => {
    if (req.session.paymentCompleted) {
        next();
    } else {
        res.redirect('/register');
    }
};