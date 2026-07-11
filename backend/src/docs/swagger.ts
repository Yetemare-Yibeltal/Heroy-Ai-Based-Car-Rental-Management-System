import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { env } from '../config/env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'HEROY Car Rental API',
    version: '1.0.0',
    description:
      'REST API for HEROY - an AI-native car rental management platform. Covers authentication, fleet management, bookings, payments (Stripe and Chapa), reviews, coupons, loyalty, wishlist, and the AI assistant.',
    contact: {
      name: 'HEROY Engineering',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}/api`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'object' },
        },
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          brand: { type: 'string' },
          category: {
            type: 'string',
            enum: ['ECONOMY', 'SUV', 'LUXURY', 'VAN', 'SPORTS', 'ELECTRIC'],
          },
          pricePerDay: { type: 'number' },
          status: {
            type: 'string',
            enum: ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED', 'RETIRED'],
          },
          plate: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          vehicleId: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          totalPrice: { type: 'number' },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions: swaggerJsdoc.Options = {
  swaggerDefinition,
  // Reads JSDoc @openapi comment blocks placed above route
  // definitions throughout the modules to build the full spec.
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Application): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
