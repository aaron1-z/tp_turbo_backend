import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import {createLogger} from './utils/logger';

const logger = createLogger('Server');

const PORT = 3000;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});


httpServer.listen(PORT, () => {
    logger.info(`TP Turbo server running on port ${PORT}`);
});