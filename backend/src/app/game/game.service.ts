import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRoom } from './entities/game-room.entity';
import { Player } from './entities/player.entity';
import { GamePhase, GameState } from './entities/game-state.entity';
import { v4 as uuidv4 } from 'uuid';

export enum CardType {
  QUEEN = 'QUEEN',
  KING = 'KING',
  ACE = 'ACE',
  JOKER = 'JOKER'
}

@Injectable()
export class GameService {
  private readonly TOTAL_CARDS = 20;
  private readonly CARDS_PER_PLAYER = 5;
  private readonly MAX_CARDS_PER_MOVE = 3;

  constructor(
    @InjectRepository(GameRoom)
    private gameRoomRepository: Repository<GameRoom>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(GameState)
    private gameStateRepository: Repository<GameState>,
  ) {}

  async createRoom(roomName: string): Promise<GameRoom> {
    const gameState = this.gameStateRepository.create({
      deck: [],
      discardPile: [],
      currentBaseCard: '',
      currentPlayerIndex: 0,
      lastMove: null,
      gamePhase: GamePhase.SETUP,
      roundNumber: 1,
      winner: null,
      cards: this.createCards(),
    });

    await this.gameStateRepository.save(gameState);

    const room = this.gameRoomRepository.create({
      name: roomName,
      isActive: false,
      gameState,
    });

    return this.gameRoomRepository.save(room);
  }

  async joinRoom(roomId: string, playerName: string, sessionId: string): Promise<Player> {
    const room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Проверяем, есть ли уже игрок с таким sessionId
    const existingPlayer = await this.playerRepository.findOne({
      where: { sessionId, gameRoom: { id: roomId } },
    });

    if (existingPlayer) {
      return existingPlayer;
    }

    // Проверяем, не заполнена ли комната
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    const player = this.playerRepository.create({
      name: playerName,
      sessionId,
      cards: [],
      revolver: {
        chambers: [true, false, false, false, false, false],
        currentChamber: 0,
      },
      isActive: true,
      isCurrentPlayer: false,
      gameRoom: room,
    });

    return this.playerRepository.save(player);
  }

  async startGame(roomId: string): Promise<GameRoom> {
    const room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.length < 2) {
      throw new Error('Not enough players to start the game');
    }

    // Перемешиваем колоду
    const shuffledDeck = this.shuffleArray([...Array(this.TOTAL_CARDS).keys()].map(i => i + 1));
    
    // Раздаем карты игрокам
    for (let i = 0; i < room.players.length; i++) {
      room.players[i].cards = shuffledDeck.splice(0, this.CARDS_PER_PLAYER);
      room.players[i].isCurrentPlayer = i === 0;
      await this.playerRepository.save(room.players[i]);
    }
    
    // Выбираем случайную базовую карту
    const baseCardTypes = [CardType.QUEEN, CardType.KING, CardType.ACE];
    const randomBaseCard = baseCardTypes[Math.floor(Math.random() * baseCardTypes.length)];
    
    // Обновляем состояние игры
    room.gameState.deck = shuffledDeck;
    room.gameState.currentBaseCard = randomBaseCard;
    room.gameState.gamePhase = GamePhase.PLAYER_TURN;
    await this.gameStateRepository.save(room.gameState);
    
    room.isActive = true;
    return this.gameRoomRepository.save(room);
  }

  async getRooms(): Promise<GameRoom[]> {
    return this.gameRoomRepository.find({
      relations: ['players'],
    });
  }

  async getRoom(roomId: string): Promise<GameRoom> {
    return this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });
  }

  async getPlayerBySession(sessionId: string): Promise<Player> {
    return this.playerRepository.findOne({
      where: { sessionId },
      relations: ['gameRoom'],
    });
  }

  async updatePlayerSession(player: Player, newSessionId: string): Promise<Player> {
    player.sessionId = newSessionId;
    return this.playerRepository.save(player);
  }

  private createCards() {
    const cards = [];
    let id = 1;
    
    // Добавляем 6 дам
    for (let i = 0; i < 6; i++) {
      cards.push({ id: id++, type: CardType.QUEEN });
    }
    
    // Добавляем 6 королей
    for (let i = 0; i < 6; i++) {
      cards.push({ id: id++, type: CardType.KING });
    }
    
    // Добавляем 6 тузов
    for (let i = 0; i < 6; i++) {
      cards.push({ id: id++, type: CardType.ACE });
    }
    
    // Добавляем 2 джокера
    for (let i = 0; i < 2; i++) {
      cards.push({ id: id++, type: CardType.JOKER });
    }
    
    return cards;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
} 