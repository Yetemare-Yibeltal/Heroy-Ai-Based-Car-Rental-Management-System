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
import { corporateRoutes } from '../modules/corporate/corporate.routes';
import { subscriptionRoutes } from '../modules/corporate/subscription.routes';
import { complianceRoutes } from '../modules/compliance/compliance.routes';
import { reportsRoutes } from '../modules/reports/reports.routes';
import { growthRoutes } from '../modules/growth/growth.routes';
import { partnerRoutes } from '../modules/partner/partner.routes';

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
routes.use('/corporate', corporateRoutes);
routes.use('/subscriptions', subscriptionRoutes);
routes.use('/compliance', complianceRoutes);
routes.use('/reports', reportsRoutes);
routes.use('/growth', growthRoutes);
routes.use('/partner', partnerRoutes);

// Further module routes will be mounted here progressively, e.g.:
// routes.use('/accessibility', accessibilityRoutes);
