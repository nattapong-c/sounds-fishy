import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './lib/database';
import { roomController } from './controllers/room-controller';
import { setupSocketIO } from './controllers/socket-controller';
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
  .use(roomController)
  .get('/', () => '🐟 Sounds Fishy API is running!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .listen(process.env.PORT || 3001);

// Setup Socket.IO on top of Elysia's server
const io = setupSocketIO(app.server!);

logger.info(
  `🐟 Sounds Fishy is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type AppRouter = typeof app;
export { io };
