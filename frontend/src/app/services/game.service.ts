import { Injectable, signal } from '@angular/core';
import { Card, CardType, CARD_NAMES } from '../models/card.model';
import { GamePhase, GameState, GameRoom, Player } from '../models/game.model';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // Сигналы для реактивного обновления UI
  private currentRoom = signal<GameRoom | null>(null);
  private currentPlayer = signal<Player | null>(null);
  private availableRooms = signal<GameRoom[]>([]);
  private isLoading = signal<boolean>(false);
  private gameState = signal<GameState | null>(null);
  private cards = signal<Card[]>([]);
  private error = signal<string | null>(null);
  
  constructor(private socketService: SocketService) {
    // Подписываемся на обновления комнаты
    this.socketService.on<GameRoom>('roomUpdated', (room) => {
      if (this.currentRoom() && this.currentRoom()?.id === room.id) {
        this.currentRoom.set(room);
        
        // Проверяем и инициализируем gameState
        if (room.gameState) {
          // Убедимся, что players существует в gameState
          if (!room.gameState.players && room.players) {
            room.gameState.players = room.players;
          }
          this.gameState.set(room.gameState);
        }
        
        // Обновляем текущего игрока
        const player = room.players.find(p => p.sessionId === this.socketService.getSessionId()());
        if (player) {
          this.currentPlayer.set(player);
        }
      }
    });
    
    // Подписываемся на начало игры
    this.socketService.on<GameRoom>('gameStarted', (room) => {
      console.log('Game started event received:', room);
      if (this.currentRoom() && this.currentRoom()?.id === room.id) {
        this.currentRoom.set(room);
        
        // Проверяем и инициализируем gameState
        if (room.gameState) {
          console.log('Game state before update:', room.gameState);
          // Убедимся, что players существует в gameState
          if (!room.gameState.players && room.players) {
            console.log('Adding players to gameState:', room.players);
            room.gameState.players = room.players;
          }
          this.gameState.set(room.gameState);
          console.log('Game state after update:', this.gameState());
        } else {
          console.warn('No game state in room:', room);
        }
        
        // Обновляем текущего игрока
        const player = room.players.find(p => p.sessionId === this.socketService.getSessionId()());
        if (player) {
          this.currentPlayer.set(player);
          console.log('Current player updated:', player);
        } else {
          console.warn('Current player not found in room players');
        }
      }
    });
    
    // Подписываемся на ошибки подключения
    this.socketService.on<string>('error', (error) => {
      this.error.set(error);
      this.isLoading.set(false);
    });

    // Подписываемся на изменение состояния подключения
    this.socketService.on('connect', () => {
      this.error.set(null);
      this.loadRooms();
    });

    this.socketService.on('disconnect', () => {
      this.error.set('Нет подключения к серверу');
    });

    this.socketService.on('connect_error', () => {
      this.error.set('Ошибка подключения к серверу');
    });
    
    // Загружаем доступные комнаты при инициализации
    if (this.socketService.getIsConnected()()) {
      this.loadRooms();
    } else {
      this.error.set('Нет подключения к серверу');
    }
  }
  
  // Геттеры для получения текущего состояния
  getCurrentRoom() {
    return this.currentRoom.asReadonly();
  }
  
  getCurrentPlayer() {
    return this.currentPlayer.asReadonly();
  }
  
  getAvailableRooms() {
    return this.availableRooms.asReadonly();
  }
  
  getIsLoading() {
    return this.isLoading.asReadonly();
  }
  
  getGameState() {
    return this.gameState.asReadonly();
  }
  
  getCards() {
    return this.cards.asReadonly();
  }
  
  getError() {
    return this.error.asReadonly();
  }
  
  // Загрузка доступных комнат
  async loadRooms() {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      return;
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ rooms: GameRoom[] }>('getRooms', {});
      this.availableRooms.set(response.rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      this.error.set('Ошибка при загрузке комнат');
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Создание новой комнаты
  async createRoom(roomName: string) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ room: GameRoom }>('createRoom', { roomName });
      this.availableRooms.update(rooms => [...rooms, response.room]);
      return response.room;
    } catch (error) {
      console.error('Error creating room:', error);
      this.error.set('Ошибка при создании комнаты');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Присоединение к комнате
  async joinRoom(roomId: string, playerName: string) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ player: Player; room: GameRoom }>('joinRoom', { roomId, playerName });
      
      // Сохраняем sessionId
      this.socketService.saveSessionId(response.player.sessionId);
      
      // Обновляем текущую комнату и игрока
      this.currentRoom.set(response.room);
      this.currentPlayer.set(response.player);
      this.gameState.set(response.room.gameState);
      
      return response;
    } catch (error) {
      console.error('Error joining room:', error);
      this.error.set('Ошибка при присоединении к комнате');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Начало игры
  async startGame(roomId: string) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      console.log('Starting game for room:', roomId);
      const response = await this.socketService.emit<{ room: GameRoom }>('startGame', { roomId });
      console.log('Start game response:', response);
      
      // Проверяем и инициализируем gameState
      if (response.room.gameState) {
        console.log('Game state from response:', response.room.gameState);
        // Убедимся, что players существует в gameState
        if (!response.room.gameState.players && response.room.players) {
          console.log('Adding players to gameState:', response.room.players);
          response.room.gameState.players = response.room.players;
        }
      } else {
        console.warn('No game state in response room');
      }
      
      this.currentRoom.set(response.room);
      this.gameState.set(response.room.gameState);
      console.log('Game state after start game:', this.gameState());
      
      return response.room;
    } catch (error) {
      console.error('Error starting game:', error);
      this.error.set('Ошибка при запуске игры');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  // Получение карты по ID
  getCardById(cardId: number): Card | undefined {
    const gameState = this.currentRoom()?.gameState;
    if (!gameState) return undefined;
    
    const card = gameState.cards.find(card => card.id === cardId);
    if (!card) return undefined;
    
    return {
      id: card.id,
      type: card.type
    };
  }
  
  // Получение имени карты
  getCardName(cardType: CardType): string {
    return CARD_NAMES[cardType];
  }
  
  // Выход из комнаты
  leaveRoom() {
    this.currentRoom.set(null);
    this.currentPlayer.set(null);
    this.socketService.clearSessionId();
  }
  
  // Игровые методы
  async initGame(playerNames: string[]) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ gameState: GameState }>('initGame', { playerNames });
      this.gameState.set(response.gameState);
    } catch (error) {
      console.error('Error initializing game:', error);
      this.error.set('Ошибка при инициализации игры');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async makeMove(playerId: string, declaredCards: { count: number; type: string }, cardIds: number[]) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ gameState: GameState }>('makeMove', {
        playerId,
        declaredCards,
        cardIds
      });
      this.gameState.set(response.gameState);
    } catch (error) {
      console.error('Error making move:', error);
      this.error.set('Ошибка при выполнении хода');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async callLiar(playerId: string) {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ gameState: GameState }>('callLiar', { playerId });
      this.gameState.set(response.gameState);
    } catch (error) {
      console.error('Error calling liar:', error);
      this.error.set('Ошибка при объявлении лжеца');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async triggerRoulette() {
    if (!this.socketService.getIsConnected()()) {
      this.error.set('Нет подключения к серверу');
      throw new Error('Not connected to server');
    }
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const response = await this.socketService.emit<{ gameState: GameState }>('triggerRoulette', {});
      this.gameState.set(response.gameState);
    } catch (error) {
      console.error('Error triggering roulette:', error);
      this.error.set('Ошибка при запуске рулетки');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }
} 