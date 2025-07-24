import { Server, Socket } from 'socket.io';
import { Card, Hand, HandRank, RANKS, SUITS, PAYOUTS, Rank } from "../interfaces/card-interface";
import { FinalUserData } from '../interfaces/user-interface';
import { DealCardsPayload, RoundResultPayload } from '../interfaces/bet-interface';
import { setCache } from '../utils/redis-connection';
import { delay } from '../utils/helpers'; 
import { queueCredit } from './bet-service';
import { saveSettlementRecord } from './settlement-service';

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

const getRankValue = (rank: Rank): number => {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
};

const evaluateHand = (hand: Hand): HandRank => {
    const isFlush = hand[0].suit === hand[1].suit && hand[1].suit === hand[2].suit;
    const ranks = hand.map(card => getRankValue(card.rank)).sort((a, b) => a - b);
    const isNormalStraight = ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2];
    const isAceLowStraight = ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 14;
    const isStraight = isNormalStraight || isAceLowStraight;

    if (isStraight && isFlush) return 'Straight Flush';
    if (hand[0].rank === hand[1].rank && hand[1].rank === hand[2].rank) return '3 of a Kind';
    if (isStraight) return 'Straight';
    if (isFlush) return 'Flush';
    if (hand[0].rank === hand[1].rank || hand[1].rank === hand[2].rank || hand[0].rank === hand[2].rank) return 'Pair';
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

        if (winAmount > 0) {
            queueCredit(userData, winAmount, roundId, debitTxnId);
        }

        const updatedUserData = { ...userData, balance: finalBalance };
        const redisKey = `session:${socket.id}`;
        await setCache(redisKey, JSON.stringify(updatedUserData));
        
        const roundResultPayload: RoundResultPayload = {
            handRank,
            winAmount,
            newBalance: finalBalance,
        };
        socket.emit('round_result', roundResultPayload);

         saveSettlementRecord(roundId, userData, betAmount, dealtHand, handRank, winAmount);
        

    } catch (error) {
        console.error("Error during round resolution:", error);
        socket.emit('error', { message: 'An error occurred during the game round.' });
    }
};