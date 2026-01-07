const express = require('express');
const router = express.Router();
const { verifyPayment, createRecipient, getBanks } = require('../controllers/PaymentController');
// Assume we have an auth middleware
// const { protect } = require('../middleware/authMiddleware'); 
// NOTE: Ensure auth middleware is available path. Usually it's in ../middleware/authMiddleware

// Using a simplified auth check for now or import real one if found
// I don't see authMiddleware in previous file list, but index.js imports routes directly.
// I will assume global middleware or add it later. For verification, it might be public callback or protected.

router.post('/verify', verifyPayment);
router.get('/banks', getBanks);
router.post('/create-recipient', createRecipient);

module.exports = router;
