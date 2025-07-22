export interface RawUserData {
    user_id: string;
    username: string;
    balance: number;
    operatorId: string;
}

export interface FinalUserData {
    game_id: string;
    userId: string;
    username: string;
    balance: number;
    operatorId: string;
    token: string;
}