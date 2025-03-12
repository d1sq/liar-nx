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

  async createRoom(roomName: string, maxPlayers = 4, customRoomId?: string): Promise<GameRoom> {
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
      id: customRoomId || undefined, // Если указан customRoomId, используем его
      name: roomName,
      isActive: false,
      maxPlayers,
      gameState,
    });

    return this.gameRoomRepository.save(room);
  }

  async joinRoom(roomId: string, playerName: string, sessionId: string): Promise<Player> {
    let room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    // Если комната не найдена, создаем новую
    if (!room) {
      room = await this.createRoom(`Комната ${roomId}`, 4, roomId);
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
      name: playerName || `Игрок ${room.players.length + 1}`,
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

    // Создаем и перемешиваем колоду
    const deck = this.createCards();
    const shuffledDeck = this.shuffleArray(deck);
    
    // Раздаем карты игрокам
    for (let i = 0; i < room.players.length; i++) {
      // Берем 5 карт для каждого игрока
      const playerCards = shuffledDeck.splice(0, this.CARDS_PER_PLAYER);
      room.players[i].cards = playerCards.map(card => card.id);
      room.players[i].isCurrentPlayer = i === 0;
      await this.playerRepository.save(room.players[i]);
    }
    
    // Выбираем случайную базовую карту
    const baseCardTypes = [CardType.QUEEN, CardType.KING, CardType.ACE];
    const randomBaseCard = baseCardTypes[Math.floor(Math.random() * baseCardTypes.length)];
    
    // Обновляем состояние игры
    room.gameState.deck = shuffledDeck.map(card => card.id); // Оставшиеся карты в колоде
    room.gameState.currentBaseCard = randomBaseCard;
    room.gameState.gamePhase = GamePhase.PLAYER_TURN;
    room.gameState.cards = deck; // Сохраняем информацию о всех картах
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

  // Сделать ход
  async makeMove(roomId: string, playerId: string, declaredCards: { count: number; type: string }, cardIds: number[]) {
    const room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    if (!room || !room.gameState) {
      throw new Error('Room not found or game not initialized');
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Проверяем, что это ход данного игрока
    if (!player.isCurrentPlayer) {
      throw new Error('Not your turn');
    }

    // Проверяем, что у игрока есть эти карты
    const hasAllCards = cardIds.every(cardId => player.cards.includes(cardId));
    if (!hasAllCards) {
      throw new Error('Invalid cards');
    }

    // Удаляем карты из руки игрока
    player.cards = player.cards.filter(cardId => !cardIds.includes(cardId));
    await this.playerRepository.save(player);

    // Обновляем состояние игры
    room.gameState.discardPile = cardIds;
    room.gameState.lastMove = {
      playerId,
      declaredCards,
      actualCardIds: cardIds
    };

    // Переходим к следующему игроку
    const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    
    room.players[currentPlayerIndex].isCurrentPlayer = false;
    room.players[nextPlayerIndex].isCurrentPlayer = true;
    room.gameState.currentPlayerIndex = nextPlayerIndex;

    await this.gameStateRepository.save(room.gameState);
    await this.gameRoomRepository.save(room);

    return room;
  }

  // Сказать "Лжец!"
  async callLiar(roomId: string, playerId: string) {
    const room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    if (!room || !room.gameState || !room.gameState.lastMove) {
      throw new Error('Room not found or no last move');
    }

    const caller = room.players.find(p => p.id === playerId);
    if (!caller) {
      throw new Error('Player not found');
    }

    // Проверяем, может ли игрок сказать "Лжец!"
    const lastMovePlayerIndex = room.players.findIndex(p => p.id === room.gameState.lastMove.playerId);
    const callerIndex = room.players.findIndex(p => p.id === playerId);
    if (callerIndex !== (lastMovePlayerIndex + 1) % room.players.length) {
      throw new Error('You cannot call liar now');
    }

    // Проверяем карты последнего хода
    const lastMoveCards = room.gameState.lastMove.actualCardIds;
    const declaredType = room.gameState.lastMove.declaredCards.type;
    
    // Получаем типы карт
    const cardTypes = lastMoveCards.map(cardId => {
      const card = room.gameState.cards.find(c => c.id === cardId);
      return card?.type;
    });

    // Проверяем, все ли карты соответствуют заявленному типу или являются джокерами
    const allMatch = cardTypes.every(type => type === declaredType || type === CardType.JOKER);

    // Определяем проигравшего
    const loserIndex = allMatch ? callerIndex : lastMovePlayerIndex;
    const loser = room.players[loserIndex];

    // Переходим к фазе русской рулетки
    room.gameState.gamePhase = GamePhase.RUSSIAN_ROULETTE;
    loser.isCurrentPlayer = true;
    room.gameState.currentPlayerIndex = loserIndex;

    await this.gameStateRepository.save(room.gameState);
    await this.gameRoomRepository.save(room);

    return { room, allMatch, cardTypes };
  }

  // Выстрел из револьвера
  async triggerRoulette(roomId: string) {
    const room = await this.gameRoomRepository.findOne({
      where: { id: roomId },
      relations: ['players', 'gameState'],
    });

    if (!room || !room.gameState) {
      throw new Error('Room not found or game not initialized');
    }

    const currentPlayer = room.players[room.gameState.currentPlayerIndex];
    if (!currentPlayer) {
      throw new Error('Current player not found');
    }

    // Проверяем, выстрелит ли револьвер
    const chamber = currentPlayer.revolver.currentChamber;
    const willFire = currentPlayer.revolver.chambers[chamber];

    if (willFire) {
      // Игрок выбывает
      currentPlayer.isActive = false;
      await this.playerRepository.save(currentPlayer);

      // Проверяем, остался ли только один активный игрок
      const activePlayers = room.players.filter(p => p.isActive);
      if (activePlayers.length === 1) {
        // Игра окончена
        room.gameState.gamePhase = GamePhase.GAME_OVER;
        room.gameState.winner = activePlayers[0].id;
      } else {
        // Продолжаем игру
        this.startNextRound(room);
      }
    } else {
      // Револьвер не выстрелил
      currentPlayer.revolver.currentChamber = (chamber + 1) % 6;
      await this.playerRepository.save(currentPlayer);
      
      // Продолжаем игру
      this.startNextRound(room);
    }

    await this.gameStateRepository.save(room.gameState);
    await this.gameRoomRepository.save(room);

    return { room, willFire };
  }

  // Вспомогательный метод для начала нового раунда
  private async startNextRound(room: GameRoom) {
    if (!room.gameState || !room.gameState.lastMove) return;

    room.gameState.gamePhase = GamePhase.PLAYER_TURN;
    room.gameState.roundNumber++;

    // Находим следующего активного игрока после того, кто сделал последний ход
    const lastMovePlayerIndex = room.players.findIndex(p => p.id === room.gameState.lastMove.playerId);
    let nextPlayerIndex = (lastMovePlayerIndex + 1) % room.players.length;
    while (!room.players[nextPlayerIndex].isActive) {
      nextPlayerIndex = (nextPlayerIndex + 1) % room.players.length;
    }

    // Обновляем текущего игрока
    room.players.forEach((p, i) => p.isCurrentPlayer = i === nextPlayerIndex);
    room.gameState.currentPlayerIndex = nextPlayerIndex;

    // Очищаем информацию о последнем ходе
    room.gameState.lastMove = null;
    room.gameState.discardPile = [];
  }
} 