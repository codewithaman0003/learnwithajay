import express from 'express';
import { getRegisterPage, registerUser, successPage } from '../controllers/userController.js';
import { initiatePayment, handlePaymentSuccess, handlePaymentFailure, checkPaymentStatus } from '../controllers/paymentController.js';
import { requirePayment } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => res.redirect('/register'));
router.get('/register', getRegisterPage);
router.post('/register', registerUser);
router.get('/payment', initiatePayment);
router.post('/payment-success', handlePaymentSuccess);
router.post('/payment-failure', handlePaymentFailure);
router.get('/payment-status', checkPaymentStatus);
router.get('/success', requirePayment, successPage);

export default router;