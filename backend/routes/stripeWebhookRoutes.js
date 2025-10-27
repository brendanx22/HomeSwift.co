const express = require('express');
const stripeWebhookController = require('../controllers/stripeWebhookController');

const router = express.Router();

// Stripe webhook endpoint (no authentication needed for webhooks)
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookController.handleWebhook);

module.exports = router;
