import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { Server } from 'socket.io';
import { connectDB, disconnectDB } from './lib/database';
import { roomController } from './controllers/room-controller';
import { setupSocketIO } from './controllers/socket-controller';

// Initialize Elysia app
const app = new Elysia()
  .use(cors())
  .use(roomController)
  .get('/', () => '🐟 Sounds Fishy API is running!')
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = app.listen(HOST, parseInt(PORT), async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

setupSocketIO(io);

// Graceful shutdown
const cleanup = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDB();
  io.close();
  server.close();
  process.exit(0);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export { app, io };
