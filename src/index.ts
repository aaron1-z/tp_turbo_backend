import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createLogger } from './utils/logger';
import { initializeSocketHandlers } from './socket'; 
import { config } from './config/env-config';
import { initializeRedis } from './utils/redis-connection';

const logger = createLogger('Server');
const PORT = config.port;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' },
});

const startServer = async () => {
    try {
        await initializeRedis();
        logger.info('Services connected successfully.');

        initializeSocketHandlers(io);

        httpServer.listen(PORT, () => {
            logger.info({ port: PORT }, `TP Turbo server is running`);
        });
    } catch (err) {
        logger.fatal({ error: err }, 'Server failed to start');
        process.exit(1);
    }
};

startServer();