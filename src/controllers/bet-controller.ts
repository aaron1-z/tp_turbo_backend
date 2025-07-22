import { Server, Socket } from "socket.io";
import { createLogger } from "../utils/logger";
import { FinalUserData } from "../interfaces/user-interface";
import { PlaceBetPayload, InfoPayload } from "../interfaces/bet-interface";
import { getCache, setCache } from "../utils/redis-connection";
import { processDebit } from "../services/bet-service";
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('GameController');

export const handlePlaceBet = async (io: Server, socket: Socket, payload: PlaceBetPayload) => {
    const redisKey = `session:${socket.id}`;
    try {
        const sessionString = await getCache(redisKey);
        if (!sessionString) {
            return socket.emit('error', { message: 'Your session has expired. Please reconnect.' });
        }
        
        const userData: FinalUserData = JSON.parse(sessionString);
        const betAmount = payload.amount;

        if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
            return socket.emit('error', { message: 'Invalid bet amount provided.' });
        }
        if (userData.balance < betAmount) {
            return socket.emit('error', { message: 'Insufficient balance.' });
        }
        
        const roundId = uuidv4();

        const debitResult = await processDebit(
            userData.userId,
            userData.game_id,
            userData.token,
            betAmount,
            roundId
        );

        if (!debitResult.status) {
            return socket.emit('error', { message: debitResult.message });
        }

        userData.balance -= betAmount;
        await setCache(redisKey, JSON.stringify(userData));

        const infoPayload: InfoPayload = {
            user_id: userData.userId,
            username: userData.username,
            balance: userData.balance,
        };
        socket.emit('user_info', infoPayload);

    } catch (error) {
        logger.error({ socketId: socket.id, error }, "An error occurred in handlePlaceBet controller.");
        socket.emit('error', { message: "An internal server error occurred." });
    }
};