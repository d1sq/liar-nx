import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { GameState } from './game-state.entity';

@Entity()
export class GameRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: 4 })
  maxPlayers: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Player, player => player.gameRoom, { cascade: true })
  players: Player[];

  @OneToOne(() => GameState, { cascade: true })
  @JoinColumn()
  gameState: GameState;
} 