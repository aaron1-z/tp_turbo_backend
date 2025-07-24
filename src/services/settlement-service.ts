import { executeQuery } from '../utils/db-connection'; 
import { FinalUserData } from '../interfaces/user-interface';
import { Hand, HandRank } from '../interfaces/card-interface'; 
import { createLogger } from '../utils/logger';

const logger = createLogger('SettlementService');

const SQL_INSERT_SETTLEMENT = `
  INSERT INTO settlement (
    round_id, user_id, operator_id, bet_amount, 
    hand_dealt, hand_rank, win_amount
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const saveSettlementRecord = (
    roundId: string,
    userData: FinalUserData,
    betAmount: number,
    hand: Hand,
    handRank: HandRank,
    winAmount: number
): void => {
  try {
    const params = [
      roundId,
      userData.userId,
      userData.operatorId,
      betAmount,
      JSON.stringify(hand), 
      handRank,
      winAmount
    ];

    executeQuery(SQL_INSERT_SETTLEMENT, params)
      .then(() => logger.info({ roundId, userId: userData.userId }, "Settlement record saved"))
      .catch(err => logger.error({ roundId, error: err.message }, "Failed to save settlement record"));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error({ roundId, error: errorMessage }, "Unexpected error preparing settlement data");
  }
};