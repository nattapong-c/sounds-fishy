import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { roomController } from './controllers/room-controller';
import { wsController } from './controllers/ws-controller';
import { connectDB } from './lib/db';
import { logger } from './lib/logger';

// Connect to MongoDB
connectDB().catch((err) => {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
});

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4444';

const app = new Elysia()
    // CORS configuration
    .use(
        cors({
            origin: CORS_ORIGIN,
            credentials: true,
            allowedHeaders: ['Content-Type'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        })
    )
    
    // Health check
    .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
    
    // Room routes
    .use(roomController)
    
    // WebSocket routes
    .use(wsController)
    
    // 404 handler
    .onError(({ set, code }) => {
        if (code === 'NOT_FOUND') {
            set.status = 404;
            return { error: 'Not found' };
        }
    });

// Store server instance globally for pub/sub broadcasting from REST controllers
const server = app.listen({
  port: PORT,
  hostname: process.env.HOSTNAME || "localhost"
}, () => {
    logger.info({ port: PORT }, `Sounds Fishy API server running on http://localhost:${PORT}`);
});

// Make server available globally for broadcasting
(global as any).elysiaServer = server;

export type AppRouter = typeof app;

export default app;
