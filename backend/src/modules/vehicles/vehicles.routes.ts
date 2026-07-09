import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { usersRoutes } from '../modules/users/users.routes';
import { vehiclesRoutes } from '../modules/vehicles/vehicles.routes';

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

// Further module routes will be mounted here progressively, e.g.:
// routes.use('/bookings', bookingRoutes);
