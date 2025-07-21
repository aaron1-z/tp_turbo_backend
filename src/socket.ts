import { Server, Socket } from 'socket.io';
import { createLogger } from './utils/logger';
import { authenticateUserByToken } from './services/user-service';
import { InfoPayload } from './interfaces/bet-interface';
import { setCache, deleteCache } from './utils/redis-connection';
import { registerSocketEvents} from './routes/event-router';

const logger = createLogger('Socket');

export const initializeSocketHandlers = (io: Server) => {
    io.on('connection', async (socket: Socket) => {

        try {
            const token = socket.handshake.query.token as string;
            const game_id = socket.handshake.query.game_id as string;

            if (!token || !game_id) {
                socket.emit('error', { message: 'Token and game_id are required.' });
                socket.disconnect(true);
                return;
            }
            const userData = await authenticateUserByToken(token, game_id);

            if (!userData) {
                socket.emit('error', { message: 'Authentication failed.' });
                socket.disconnect(true);
                return;
            } 
            socket.data.userId = userData.userId;

            const redisKey = `session:${socket.id}`;
            await setCache(redisKey, JSON.stringify(userData));

            const infoPayload: InfoPayload = {
                user_id: userData.userId,
                username: userData.username,
                balance: userData.balance,
            };
            socket.emit('user_info', infoPayload);
            
            registerSocketEvents(io, socket);

            socket.on('disconnect', () => {
                deleteCache(redisKey);
            });

        } catch (error) {
            socket.emit('error', { message: 'Internal server error.' });
            socket.disconnect(true);
        }
    });
};