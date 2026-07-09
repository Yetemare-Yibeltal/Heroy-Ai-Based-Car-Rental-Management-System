import { Router } from "express";

export const routes = Router();

routes.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HEROY API is running.",
    timestamp: new Date().toISOString(),
  });
});

// Module routes will be mounted here progressively as each module
// is built, e.g.:
// routes.use('/auth', authRoutes);
// routes.use('/vehicles', vehicleRoutes);
// routes.use('/bookings', bookingRoutes);
