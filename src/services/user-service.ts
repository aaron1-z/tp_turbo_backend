import axios from 'axios';
import { apiClient } from '../config/api-client';
import { FinalUserData, RawUserData } from '../interfaces/user-interface';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserService');

export const authenticateUserByToken = async (
    token: string,
    game_id: string
): Promise<FinalUserData | null> => { 
    try {
        const response = await apiClient.get('/service/user/detail', {
            headers: { token }
        });

        const rawData: RawUserData | undefined = response?.data?.user;
        if (!rawData) {
            return null;
        }

        const finalData: FinalUserData = {
            userId: rawData.user_id,
            username: rawData.username,
            balance: rawData.balance,
            operatorId: rawData.operatorId,
            token: token,
        };
        return finalData;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error({ 
                message: 'Authentication API call FAILED', 
                error: error.response?.data || error.message,
                status: error.response?.status
            });
        } else {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error({ message: 'Unknown error during authentication', error: errorMessage });
        }
        return null;
    }
}; 