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
    @MessageBody() data: { roomName: string },
  ) {
    try {
      const room = await this.gameService.createRoom(data.roomName);
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
} 