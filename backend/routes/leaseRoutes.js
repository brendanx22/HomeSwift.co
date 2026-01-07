const express = require('express');
const router = express.Router();
const { generateLease } = require('../controllers/LeaseController');

router.post('/generate', generateLease);

module.exports = router;
