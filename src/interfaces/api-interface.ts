import {Hand, HandRank} from "./card-interface" ;
import {FinalUserData} from "./user-interface" ;

export interface PlaceBetPayload {
    amount: number;

}

export interface AuthenticateSuccessPayload {
    user: Partial<FinalUserData>;

}

export interface RoundResultPayload {
    roundId: string;
    dealtHand: Hand;
    handRank: HandRank;
    payoutRatio: number;
    winAmount: number;
    newBalance: number;
}
