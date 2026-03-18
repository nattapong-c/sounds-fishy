import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './lib/database';
import { roomController } from './controllers/room-controller';
import { wsController } from './controllers/ws-controller';
import { logger } from './lib/logger';

// Initialize Database connection
connectDB();

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  )
  .use(wsController)
  .use(roomController)
  .get('/', () => '🐟 Sounds Fishy API is running!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(process.env.PORT || 3001);

logger.info(
  `🐟 Sounds Fishy is running at ${app.server?.hostname}:${app.server?.port}`,
);
logger.info(`🔌 WebSocket endpoint: ws://${app.server?.hostname}:${app.server?.port}/ws`);

export type AppRouter = typeof app;
