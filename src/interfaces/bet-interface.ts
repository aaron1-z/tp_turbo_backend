export interface InfoPayload {
    user_id: string;
    username: string;
    balance: number;
}

export interface PlaceBetPayload {
    amount: number;
}

export interface DebitWebHookData {
  txn_id: string; 
  user_id: string;
  game_id: string; 
  round_id: string; 
  amount: string; 
  description: string;
  txn_type: 0; 
}

interface DebitSuccess {
    status: true;
    debitTxnId: string;
}

interface DebitFailure {
    status: false;
    message: string;
}

export type DebitResult = DebitSuccess | DebitFailure;