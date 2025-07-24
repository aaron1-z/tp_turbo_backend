import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { DebitWebHookData, CreditWebHookData, DebitResult, } from '../interfaces/bet-interface';
import { apiClient } from '../config/api-client';
import { createLogger } from '../utils/logger';
import {sendToQueue} from '../utils/amqp';
import {config} from '../config/env-config';
import { FinalUserData } from '@/interfaces/user-interface';


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

export const queueCredit = (
    userData: FinalUserData, 
    winAmount: number, 
    roundId: string, 
    debitTxnId: string
): void => {
    try {
        const creditPayload: CreditWebHookData = {
            txn_id: uuidv4(),
            user_id: userData.userId,
            game_id: userData.game_id,
            txn_ref_id: debitTxnId, 
            amount: winAmount.toFixed(2),
            description: `Winnings of ${winAmount.toFixed(2)} for TP Turbo round ${roundId}`,
            txn_type: 1
        };

        const finalMessage = {
            ...creditPayload,
            operatorId: userData.operatorId,
            token: userData.token,
        };

        sendToQueue(config.amqpExchangeName, "games_cashout", JSON.stringify(finalMessage));
        
        logger.info({ userId: userData.userId, winAmount, roundId }, 'Credit transaction successfully queued.');

    } catch (error) {
        logger.error({ userId: userData.userId, roundId, error }, 'Failed to queue credit transaction.');
    }
};