const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const propertyController = require('../controllers/propertyController');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/properties
// @desc    Get all properties
// @access  Public
router.get('/', propertyController.getAllProperties);

// @route   GET /api/properties/my
// @desc    Get current user's properties
// @access  Private
router.get('/my', authenticateToken, propertyController.getMyProperties);

// @route   GET /api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', propertyController.getPropertyById);

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private
router.post(
  '/',
  [
    authenticateToken,
    [
      body('title', 'Title is required').not().isEmpty(),
      body('description', 'Description is required').not().isEmpty(),
      body('price', 'Please include a valid price').isNumeric(),
      body('location', 'Location is required').not().isEmpty()
    ]
  ],
  propertyController.createProperty
);

// @route   PUT /api/properties/:id
// @desc    Update a property
// @access  Private
router.put(
  '/:id',
  [
    authenticateToken,
    [
      body('title', 'Title is required').optional().not().isEmpty(),
      body('description', 'Description is required').optional().not().isEmpty(),
      body('price', 'Please include a valid price').optional().isNumeric(),
      body('location', 'Location is required').optional().not().isEmpty(),
      body('status').optional().isIn(['active', 'sold'])
    ]
  ],
  propertyController.updateProperty
);

// @route   DELETE /api/properties/:id
// @desc    Delete a property
// @access  Private
router.delete('/:id', authenticateToken, propertyController.deleteProperty);

module.exports = router;
