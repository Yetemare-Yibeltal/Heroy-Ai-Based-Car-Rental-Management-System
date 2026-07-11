import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: SocketIOServer | null = null;

/**
 * Initializes the Socket.io server on top of the existing HTTP
 * server (so it shares the same port as the REST API - no separate
 * WebSocket port to configure). Called once from server.ts on startup.
 */
export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Authenticate every socket connection using the same access
  // token the client already has from REST login - passed via the
  // connection handshake's auth payload, not a header (sockets don't
  // support custom headers on all transports).
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      // Allow anonymous connections through (e.g. for AI chat as a
      // guest) but without a userId, so they can't join private rooms.
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(); // Treat an invalid/expired token as anonymous rather than rejecting the connection outright.
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(
      `Socket connected: ${socket.id}${socket.userId ? ` (user ${socket.userId})` : ' (anonymous)'}`
    );

    if (socket.userId) {
      // Private room named after the user's own ID - events pushed
      // here only reach this specific user's connected devices/tabs.
      socket.join(`user:${socket.userId}`);
    }

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.io server initialized.');

  return io;
}

export function getSocketServer(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server has not been initialized yet.');
  }
  return io;
}

/**
 * Emits an event to a specific user's private room, reaching every
 * device/tab they currently have connected. Used by the notifications
 * gateway (next file) to push live updates.
 */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
