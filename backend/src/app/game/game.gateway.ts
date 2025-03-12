import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { GameRoom } from './entities/game-room.entity';
import { Player } from './entities/player.entity';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header'],
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
  path: '/socket.io'
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Здесь можно добавить логику для обработки отключения игрока
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string, maxPlayers: number, roomId?: string },
  ) {
    try {
      const room = await this.gameService.createRoom(data.name, data.maxPlayers, data.roomId);
      
      // Присоединяем клиента к комнате
      client.join(room.id);
      
      // Отправляем всем обновленную информацию о комнатах
      this.server.emit('roomsUpdated', await this.gameService.getRooms());
      
      return { success: true, room };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; playerName: string },
  ) {
    try {
      const player = await this.gameService.joinRoom(
        data.roomId,
        data.playerName,
        client.id,
      );
      
      // Присоединяем клиента к комнате
      client.join(data.roomId);
      
      // Получаем обновленную информацию о комнате
      const room = await this.gameService.getRoom(data.roomId);
      
      // Отправляем всем в комнате обновленную информацию
      this.server.to(data.roomId).emit('roomUpdated', room);
      
      return { success: true, player, room };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const room = await this.gameService.startGame(data.roomId);
      
      // Отправляем всем в комнате обновленную информацию
      this.server.to(data.roomId).emit('gameStarted', room);
      
      return { success: true, room };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getRooms')
  async handleGetRooms() {
    try {
      const rooms = await this.gameService.getRooms();
      return { success: true, rooms };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('reconnectPlayer')
  async handleReconnectPlayer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      // Находим игрока по предыдущему sessionId
      const player = await this.gameService.getPlayerBySession(data.sessionId);
      
      if (!player) {
        return { success: false, error: 'Player not found' };
      }
      
      // Обновляем sessionId игрока и сохраняем
      const updatedPlayer = await this.gameService.updatePlayerSession(player, client.id);
      
      // Присоединяем клиента к комнате
      client.join(updatedPlayer.gameRoom.id);
      
      // Получаем обновленную информацию о комнате
      const room = await this.gameService.getRoom(updatedPlayer.gameRoom.id);
      
      return { success: true, player: updatedPlayer, room };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @MessageBody() data: { roomId: string; playerId: string; declaredCards: { count: number; type: string }; cardIds: number[] }
  ) {
    try {
      const room = await this.gameService.makeMove(
        data.roomId,
        data.playerId,
        data.declaredCards,
        data.cardIds
      );

      this.server.to(data.roomId).emit('gameStateUpdated', room);
      return { success: true, room };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('callLiar')
  async handleCallLiar(
    @MessageBody() data: { roomId: string; playerId: string }
  ) {
    try {
      const result = await this.gameService.callLiar(data.roomId, data.playerId);
      
      this.server.to(data.roomId).emit('gameStateUpdated', result.room);
      this.server.to(data.roomId).emit('liarResult', {
        allMatch: result.allMatch,
        cardTypes: result.cardTypes
      });

      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('triggerRoulette')
  async handleTriggerRoulette(
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const result = await this.gameService.triggerRoulette(data.roomId);
      
      this.server.to(data.roomId).emit('gameStateUpdated', result.room);
      this.server.to(data.roomId).emit('rouletteResult', {
        willFire: result.willFire
      });

      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
} 