export const SUITS = ['Spades', 'Hearts', 'Diamonds', 'Clubs'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8' , '9' , '10' , 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];

export interface Card {
    suit: Suit;
    rank: Rank;
}

export type Hand = [Card, Card, Card];

export type HandRank = 

| 'High Card'
| 'Pair'
| 'Flush' 
| 'Straight'
| '3 of a Kind'
| 'Straight Flush';

export const PAYOUTS: Record<HandRank, number> = {
    'High Card': 0,
    'Pair': 2,
    'Flush': 5,
    'Straight': 6,
    '3 of a Kind': 30,
    'Straight Flush': 50
};