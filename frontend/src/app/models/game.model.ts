import { CardType } from './card.model';

export interface GameRoom {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  gameStarted: boolean;
  currentPlayerId: string | null;
  lastMove: {
    playerId: string;
    cards: number[];
    declaredCards: {
      count: number;
      type: string;
    };
  } | null;
  discardPile: number[];
}

export interface GameStateUpdate {
  room: GameRoom;
  message?: string;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
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