import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { usersRoutes } from '../modules/users/users.routes';
import { vehiclesRoutes } from '../modules/vehicles/vehicles.routes';
import { bookingsRoutes } from '../modules/bookings/bookings.routes';
import { paymentsRoutes } from '../modules/payments/payments.routes';
import { reviewsRoutes } from '../modules/reviews/reviews.routes';
import { locationsRoutes } from '../modules/locations/locations.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';
import { couponsRoutes } from '../modules/coupons/coupons.routes';
import { wishlistRoutes } from '../modules/wishlist/wishlist.routes';
import { aiRoutes } from '../modules/ai/ai.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { verificationRoutes } from '../modules/verification/verification.routes';
import { inspectionRoutes } from '../modules/inspection/inspection.routes';
import { maintenanceRoutes } from '../modules/maintenance/maintenance.routes';

export const routes = Router();

routes.use('/health', healthRoutes);

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/vehicles', vehiclesRoutes);
routes.use('/bookings', bookingsRoutes);
routes.use('/payments', paymentsRoutes);
routes.use('/reviews', reviewsRoutes);
routes.use('/locations', locationsRoutes);
routes.use('/notifications', notificationsRoutes);
routes.use('/coupons', couponsRoutes);
routes.use('/wishlist', wishlistRoutes);
routes.use('/ai', aiRoutes);
routes.use('/admin', adminRoutes);
routes.use('/verification', verificationRoutes);
routes.use('/inspections', inspectionRoutes);
routes.use('/maintenance', maintenanceRoutes);

// Further module routes will be mounted here progressively, e.g.:
// routes.use('/corporate', corporateRoutes);
