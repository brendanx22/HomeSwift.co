import express from 'express';
import { getProperties, getPropertyById, createProperty } from '../controllers/propertyController.js';
const router = express.Router();

router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.post('/', createProperty);

export default router;
