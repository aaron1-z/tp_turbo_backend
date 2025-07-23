import { Server, Socket } from 'socket.io';
import { Card, Hand, HandRank, RANKS, SUITS, PAYOUTS } from "../interfaces/card-interface";
import { FinalUserData } from '../interfaces/user-interface';
import { DealCardsPayload, RoundResultPayload } from '../interfaces/bet-interface';
import { setCache } from '../utils/redis-connection';
import { delay } from '../utils/helpers';

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank });
        }
    }
    return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const dealHand = (): Hand => {
    const newDeck = createDeck();
    const randomizedDeck = shuffleDeck(newDeck);
    return randomizedDeck.slice(0, 3) as Hand;
};

const getRankValue = (rank: string): number => {
    if (rank >= '2' && rank <= '9') return parseInt(rank);
    if (rank === '10') return 10;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    if (rank === 'A') return 14;
    return 0; 
};

const evaluateHand = (hand: Hand): HandRank => {
    const sortedHand = [...hand].sort((a, b) => getRankValue(a.rank) - getRankValue(b.rank));
    const [card1, card2, card3] = sortedHand;

    const isFlush = card1.suit === card2.suit && card2.suit === card3.suit;

    const rankValues = sortedHand.map(c => getRankValue(c.rank));
    const isNormalStraight = rankValues[1] === rankValues[0] + 1 && rankValues[2] === rankValues[1] + 1;
    const isAceLowStraight = rankValues[0] === 2 && rankValues[1] === 3 && rankValues[2] === 14;
    const isStraight = isNormalStraight || isAceLowStraight;

    if (isStraight && isFlush) return 'Straight Flush';
    if (card1.rank === card2.rank && card2.rank === card3.rank) return '3 of a Kind';
    if (isStraight) return 'Straight';
    if (isFlush) return 'Flush';
    if (card1.rank === card2.rank || card2.rank === card3.rank) return 'Pair';
    
    return 'High Card';
};



export const resolveRound = async (
    io: Server, 
    socket: Socket, 
    userData: FinalUserData, 
    betAmount: number, 
    roundId: string, 
    debitTxnId: string
) => {
    try {
        const dealtHand = dealHand();

        const dealCardsPayload: DealCardsPayload = { dealtHand };
        socket.emit('deal_cards', dealCardsPayload);
        
        await delay(2000);

        const handRank = evaluateHand(dealtHand);
        const payoutRatio = PAYOUTS[handRank];
        const winAmount = betAmount * payoutRatio;
        
        const finalBalance = userData.balance + winAmount;

        const updatedUserData = { ...userData, balance: finalBalance };
        const redisKey = `session:${socket.id}`;
        await setCache(redisKey, JSON.stringify(updatedUserData));
        
        const roundResultPayload: RoundResultPayload = {
            handRank,
            winAmount,
            newBalance: finalBalance,
        };
        socket.emit('round_result', roundResultPayload);
        

    } catch (error) {
        console.error("Error during round resolution:", error);
        socket.emit('error', { message: 'An error occurred during the game round.' });
    }
};