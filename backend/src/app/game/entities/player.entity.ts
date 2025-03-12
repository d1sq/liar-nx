import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { GameRoom } from './game-room.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  sessionId: string;

  @Column('simple-json', { nullable: true })
  cards: number[];

  @Column('simple-json')
  revolver: {
    chambers: boolean[];
    currentChamber: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isCurrentPlayer: boolean;

  @ManyToOne(() => GameRoom, gameRoom => gameRoom.players)
  @JoinColumn()
  gameRoom: GameRoom;
} 