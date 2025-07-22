import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { DebitWebHookData, DebitResult } from '../interfaces/bet-interface';
import { apiClient } from '../config/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('PaymentService');

const debitUserBalanceAPI = async (debitPayload: DebitWebHookData, token: string): Promise<boolean> => {
  try {
    const response = await apiClient.post('/service/operator/user/balance/v2', debitPayload, {
      headers: { token },
    });
    return response.data?.status === true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error({ error: error.response?.data || error.message }, 'Axios error during debit API call');
    } else {
      logger.error({ error }, 'Unknown error during debit API call');
    }
    return false;
  }
};

export const processDebit = async (
    userId: string,
    gameId: string,
    token: string,
    amount: number, 
    roundId: string
): Promise<DebitResult> => {
  const debitTxnId = uuidv4();

  const debitPayload: DebitWebHookData = {
    txn_id: debitTxnId,
    user_id: userId,
    game_id: gameId,
    round_id: roundId,
    amount: amount.toFixed(2),
    description: `Bet of ${amount.toFixed(2)} for Teen Patti Turbo round ${roundId}`,
    txn_type: 0,
  };

  const isDebitSuccessful = await debitUserBalanceAPI(debitPayload, token);

  if (isDebitSuccessful) {
    return {
      status: true,
      debitTxnId: debitTxnId,
    };
  }
  
  return {
    status: false,
    message: 'Transaction declined by payment server.',
  };
};