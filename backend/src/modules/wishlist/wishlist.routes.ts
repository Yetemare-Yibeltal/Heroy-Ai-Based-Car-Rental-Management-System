import { Router } from 'express';
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

export const routes = Router();

routes.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HEROY API is running.',
    timestamp: new Date().toISOString(),
  });
});

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

// Further module routes will be mounted here progressively, e.g.:
// routes.use('/ai', aiRoutes);
