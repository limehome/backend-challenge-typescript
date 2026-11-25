import express from 'express';
import controller from '../controllers/bookings.ts';
const router = express.Router();

router.get('/', controller.healthCheck);
router.post('/api/v1/booking/', controller.createBooking);

export default router;
