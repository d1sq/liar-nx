import { Injectable, signal } from '@angular/core';
import { SocketService } from './socket.service';
import { GameRoom, GameStateUpdate, Player } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private rooms = signal<GameRoom[]>([]);
  private currentRoom = signal<GameRoom | null>(null);
  private currentPlayer = signal<Player | null>(null);
  public error = signal<string | null>(null);
  public loading = signal<boolean>(false);

  constructor(private socketService: SocketService) {
    this.socketService.on<GameStateUpdate>('gameStateUpdated', (data) => {
      if (data.room) {
        this.currentRoom.set(data.room);
        const player = data.room.players.find((p: Player) => p.socketId === this.socketService.socketId);
        this.currentPlayer.set(player ?? null);
      }
    });

    this.socketService.on<GameRoom[]>('roomsUpdated', (rooms) => {
      this.rooms.set(rooms);
    });

    this.socketService.on<{ result: string }>('liarResult', (data) => {
      // Обработка результата вызова "Лжец!"
      console.log('Liar result:', data);
    });

    this.socketService.on<{ result: string }>('rouletteResult', (data) => {
      // Обработка результата русской рулетки
      console.log('Roulette result:', data);
    });

    this.socketService.on<string>('error', (error) => {
      this.error.set(error);
    });
  }

  // Геттеры для сигналов
  getRooms() {
    return this.rooms.asReadonly();
  }

  getCurrentRoom() {
    return this.currentRoom.asReadonly();
  }

  getCurrentPlayer() {
    return this.currentPlayer.asReadonly();
  }

  getError() {
    return this.error.asReadonly();
  }

  getLoading() {
    return this.loading.asReadonly();
  }

  async loadRooms(): Promise<void> {
    try {
      this.loading.set(true);
      const rooms = await this.socketService.emit<GameRoom[]>('getRooms', {});
      this.rooms.set(rooms);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to load rooms');
    } finally {
      this.loading.set(false);
    }
  }

  async createRoom(name: string, maxPlayers: number, roomId?: string): Promise<{ success: boolean; room: GameRoom }> {
    try {
      this.loading.set(true);
      const response = await this.socketService.emit<{ success: boolean; room: GameRoom }>('createRoom', { 
        name, 
        maxPlayers,
        roomId
      });
      
      if (!response.success) {
        throw new Error('Failed to create room');
      }
      
      this.currentRoom.set(response.room);
      return response;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to create room');
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async joinRoom(roomId: string, playerName: string): Promise<void> {
    try {
      this.loading.set(true);
      const response = await this.socketService.emit<{ success: boolean; room: GameRoom }>('joinRoom', { 
        roomId,
        playerName
      });
      
      if (!response.success) {
        throw new Error('Failed to join room');
      }
      
      this.currentRoom.set(response.room);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to join room');
      throw error;
    } finally {
      this.loading.set(false);
    }
  }

  async startGame(roomId: string): Promise<void> {
    try {
      this.loading.set(true);
      const room = await this.socketService.emit<GameRoom>('startGame', { roomId });
      this.currentRoom.set(room);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to start game');
    } finally {
      this.loading.set(false);
    }
  }

  async leaveRoom(roomId: string): Promise<void> {
    try {
      this.loading.set(true);
      await this.socketService.emit<void>('leaveRoom', { roomId });
      this.currentRoom.set(null);
      this.currentPlayer.set(null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to leave room');
    } finally {
      this.loading.set(false);
    }
  }

  async makeMove(roomId: string, declaredCards: { count: number; type: string }, cardIds: number[]): Promise<void> {
    try {
      this.loading.set(true);
      const room = await this.socketService.emit<GameRoom>('makeMove', { roomId, declaredCards, cardIds });
      this.currentRoom.set(room);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to make move');
    } finally {
      this.loading.set(false);
    }
  }

  async callLiar(roomId: string): Promise<void> {
    try {
      this.loading.set(true);
      const room = await this.socketService.emit<GameRoom>('callLiar', { roomId });
      this.currentRoom.set(room);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to call liar');
    } finally {
      this.loading.set(false);
    }
  }

  async triggerRoulette(roomId: string): Promise<void> {
    try {
      this.loading.set(true);
      const room = await this.socketService.emit<GameRoom>('triggerRoulette', { roomId });
      this.currentRoom.set(room);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Failed to trigger roulette');
    } finally {
      this.loading.set(false);
    }
  }

  getCardById(id: number): { type: string; value: number } {
    const type = Math.floor(id / 13);
    const value = (id % 13) + 2;
    return { type: this.getCardType(type), value };
  }

  private getCardType(type: number): string {
    switch (type) {
      case 0: return 'hearts';
      case 1: return 'diamonds';
      case 2: return 'clubs';
      case 3: return 'spades';
      default: throw new Error('Invalid card type');
    }
  }

  getCardName(card: { type: string; value: number }): string {
    const valueNames = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    return `${valueNames[card.value - 2]} of ${card.type}`;
  }
} 