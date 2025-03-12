import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameRoom } from './entities/game-room.entity';
import { Player } from './entities/player.entity';
import { GameState } from './entities/game-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameRoom, Player, GameState]),
  ],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {} 