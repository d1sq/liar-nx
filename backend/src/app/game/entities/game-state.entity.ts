import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum CardType {
  QUEEN = 'QUEEN',
  KING = 'KING',
  ACE = 'ACE',
  JOKER = 'JOKER'
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYER_TURN = 'PLAYER_TURN',
  CHALLENGE = 'CHALLENGE',
  RUSSIAN_ROULETTE = 'RUSSIAN_ROULETTE',
  ROUND_END = 'ROUND_END',
  GAME_OVER = 'GAME_OVER'
}

@Entity()
export class GameState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-json')
  deck: number[];

  @Column('simple-json')
  discardPile: number[];

  @Column()
  currentBaseCard: string;

  @Column({ default: 0 })
  currentPlayerIndex: number;

  @Column('simple-json', { nullable: true })
  lastMove: {
    playerId: string;
    declaredCards: { count: number; type: string };
    actualCardIds: number[];
  } | null;

  @Column({
    type: 'simple-enum',
    enum: GamePhase,
    default: GamePhase.SETUP
  })
  gamePhase: GamePhase;

  @Column({ default: 1 })
  roundNumber: number;

  @Column({ nullable: true })
  winner: string | null;

  @Column('simple-json')
  cards: {
    id: number;
    type: CardType;
  }[];
} 