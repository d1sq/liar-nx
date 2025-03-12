import { CardType } from './card.model';

export interface GameRoom {
  id: string;
  name: string;
  isActive: boolean;
  maxPlayers: number;
  createdAt: Date;
  players: Player[];
  gameState: GameState;
}

export interface Player {
  id: string;
  name: string;
  sessionId: string;
  cards: number[];
  revolver: {
    chambers: boolean[];
    currentChamber: number;
  };
  isActive: boolean;
  isCurrentPlayer: boolean;
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYER_TURN = 'PLAYER_TURN',
  CHALLENGE = 'CHALLENGE',
  RUSSIAN_ROULETTE = 'RUSSIAN_ROULETTE',
  ROUND_END = 'ROUND_END',
  GAME_OVER = 'GAME_OVER'
}

export interface GameState {
  id: string;
  players: Player[];
  deck: number[];
  discardPile: number[];
  currentBaseCard: string;
  currentPlayerIndex: number;
  lastMove: {
    playerId: string;
    declaredCards: { count: number; type: string };
    actualCardIds: number[];
  } | null;
  gamePhase: GamePhase;
  roundNumber: number;
  winner: string | null;
  cards: {
    id: number;
    type: CardType;
  }[];
} 