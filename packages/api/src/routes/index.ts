import { Router } from 'express';
import authRoutes from './auth.routes.js';
import caRoutes from './ca.routes.js';
import certificateRoutes from './certificate.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cas', caRoutes);
router.use('/certificates', certificateRoutes);
router.use('/users', userRoutes);

export default router;
