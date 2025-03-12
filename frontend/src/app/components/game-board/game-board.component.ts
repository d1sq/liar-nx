import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { CardType, CARD_NAMES } from '../../models/card.model';
import { GamePhase, GameState, GameRoom, Player } from '../../models/game.model';
import { CardComponent } from '../card/card.component';
import { RevolverComponent } from '../revolver/revolver.component';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, RevolverComponent],
  template: `
    @if (gameState()) {
      <div class="game-container">
        <div class="game-header">
          <h1>Игра "Лжец" - Раунд {{ gameState()!.roundNumber }}</h1>
          <div class="base-card">
            Базовая карта: <span class="highlight">{{ getCardName(gameState()!.currentBaseCard) }}</span>
          </div>
          <div class="game-phase">
            Фаза игры: <span class="highlight">{{ gameState()!.gamePhase }}</span>
          </div>
        </div>
        
        <div class="game-board">
          <!-- Игровое поле -->
          <div class="table">
            @if (gameState()!.deck.length > 0) {
              <div class="deck">
                <app-card 
                  [faceDown]="true" 
                  [showCount]="true" 
                  [count]="gameState()!.deck.length">
                </app-card>
              </div>
            }
            
            @if (gameState()!.lastMove) {
              <div class="discard-pile">
                <div class="last-move-info">
                  <p>
                    {{ getPlayerName(gameState()?.lastMove?.playerId) }} положил 
                    <span class="highlight">{{ getLastMoveCount() }}</span> 
                    {{ getLastMoveType() }}
                  </p>
                </div>
                <div class="discard-cards">
                  @for (cardId of getLastMoveCards(); track cardId) {
                    <app-card [faceDown]="true"></app-card>
                  }
                </div>
              </div>
            }
          </div>
          
          <!-- Игровой порядок -->
          <div class="turn-order">
            <h3>Порядок хода:</h3>
            <div class="players-circle">
              @for (player of getOrderedPlayers(); track player.id) {
                <div class="player-circle" 
                     [class.active-player]="player.isCurrentPlayer"
                     [class.inactive-player]="!player.isActive"
                     [class.can-call-liar]="canPlayerCallLiar(player.id)">
                  <div class="player-name">{{ player.name }}</div>
                  @if (player.isCurrentPlayer) {
                    <div class="current-turn-marker">Ходит</div>
                  } @else if (canPlayerCallLiar(player.id)) {
                    <div class="can-call-liar-marker">Может сказать "Лжец!"</div>
                  }
                </div>
              }
            </div>
          </div>
          
          <!-- Игроки -->
          <div class="players-container">
            @for (player of gameState()!.players; track player.id) {
              <div class="player-area" 
                   [class.active-player]="player.isCurrentPlayer" 
                   [class.inactive-player]="!player.isActive"
                   [class.can-call-liar]="canPlayerCallLiar(player.id)">
                <div class="player-info">
                  <h3>{{ player.name }}</h3>
                  <app-revolver
                    [chambers]="player.revolver.chambers"
                    [currentChamber]="player.revolver.currentChamber"
                    [isRoulette]="gameState()!.gamePhase === GamePhase.RUSSIAN_ROULETTE"
                    [isCurrentPlayer]="player.isCurrentPlayer">
                  </app-revolver>
                  <div class="cards-count">Карт: {{ player.cards.length }}</div>
                  @if (player.isCurrentPlayer) {
                    <div class="player-status current-player">Ходит</div>
                  } @else if (canPlayerCallLiar(player.id)) {
                    <div class="player-status can-call-liar">Может сказать "Лжец!"</div>
                  }
                </div>
                
                @if (player.id === currentPlayerId) {
                  <div class="player-cards">
                    @for (cardId of player.cards; track cardId) {
                      <app-card 
                        [cardType]="getCardTypeById(cardId)"
                        [selected]="selectedCards.includes(cardId)"
                        (onClick)="toggleCardSelection(cardId)">
                      </app-card>
                    }
                  </div>
                }
              </div>
            }
          </div>
          
          <!-- Игровые действия -->
          <div class="game-actions">
            @if (gameState()!.gamePhase === GamePhase.SETUP) {
              <div class="setup-phase">
                <h2>Подготовка к игре</h2>
                <p>Ожидание начала игры...</p>
              </div>
            }
            
            @if (gameState()!.gamePhase === GamePhase.PLAYER_TURN && isCurrentPlayersTurn()) {
              <div class="move-actions">
                @if (selectedCards.length > 0) {
                  <div class="selected-info">
                    <p>
                      Вы объявите, что кладете <span class="highlight">{{ selectedCards.length }}</span> 
                      {{ getBaseCardName() }}
                    </p>
                  </div>
                }
                
                <button 
                  (click)="makeMove()" 
                  [disabled]="!canMakeMove()"
                  class="action-button">
                  Сделать ход
                </button>
              </div>
            }
            
            @if (gameState()!.gamePhase === GamePhase.PLAYER_TURN && canCallLiar()) {
              <button 
                (click)="callLiar()" 
                class="action-button liar-button">
                Лжец!
              </button>
            }
            
            @if (gameState()!.gamePhase === GamePhase.RUSSIAN_ROULETTE && isCurrentPlayersTurn()) {
              <div class="roulette-section">
                <p class="roulette-message">{{ getRouletteMessage() }}</p>
                <button 
                  (click)="triggerRoulette()" 
                  class="action-button roulette-button">
                  Нажать на курок
                </button>
              </div>
            }
            
            @if (gameState()!.gamePhase === GamePhase.GAME_OVER) {
              <div class="game-over">
                <h2>Игра окончена!</h2>
                <p>Победитель: {{ getWinnerName() }}</p>
                <button (click)="restartGame()" class="action-button">Начать новую игру</button>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="loading">Загрузка...</div>
    }
  `,
  styles: `
    .game-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
      color: white;
      padding: 20px;
      font-family: 'Roboto', sans-serif;
    }
    
    .game-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .game-header h1 {
      margin-bottom: 10px;
      color: #fdbb2d;
    }
    
    .base-card {
      font-size: 1.2rem;
      background-color: rgba(0, 0, 0, 0.5);
      display: inline-block;
      padding: 10px 20px;
      border-radius: 5px;
    }
    
    .highlight {
      color: #fdbb2d;
      font-weight: bold;
    }
    
    .error-message {
      color: #ff6b6b;
      font-weight: bold;
    }
    
    .game-board {
      max-width: 1200px;
      margin: 0 auto;
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    
    .table {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 50px;
      min-height: 150px;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .turn-order {
      margin-bottom: 30px;
      text-align: center;
    }
    
    .turn-order h3 {
      margin-bottom: 15px;
      color: #fdbb2d;
    }
    
    .players-circle {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .player-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .player-circle::after {
      content: '';
      position: absolute;
      top: 50%;
      right: -20px;
      width: 20px;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-50%);
    }
    
    .player-circle:last-child::after {
      display: none;
    }
    
    .player-circle.active-player {
      background-color: rgba(253, 187, 45, 0.3);
      box-shadow: 0 0 15px rgba(253, 187, 45, 0.5);
      transform: scale(1.1);
      z-index: 1;
    }
    
    .player-circle.inactive-player {
      opacity: 0.5;
    }
    
    .player-circle.can-call-liar {
      background-color: rgba(211, 47, 47, 0.3);
      box-shadow: 0 0 15px rgba(211, 47, 47, 0.5);
    }
    
    .player-name {
      font-weight: bold;
      margin-bottom: 5px;
      text-align: center;
    }
    
    .current-turn-marker {
      font-size: 0.8rem;
      background-color: #fdbb2d;
      color: #1a2a6c;
      padding: 3px 8px;
      border-radius: 10px;
    }
    
    .can-call-liar-marker {
      font-size: 0.7rem;
      background-color: #d32f2f;
      color: white;
      padding: 3px 8px;
      border-radius: 10px;
      text-align: center;
    }
    
    .discard-pile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .discard-cards {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .discard-cards app-card {
      margin-top: -80px;
    }
    
    .discard-cards app-card:first-child {
      margin-top: 0;
    }
    
    .last-move-info {
      background-color: rgba(0, 0, 0, 0.5);
      padding: 10px;
      border-radius: 5px;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .players-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .player-area {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 15px;
      transition: all 0.3s ease;
    }
    
    .active-player {
      background-color: rgba(253, 187, 45, 0.3);
      box-shadow: 0 0 15px rgba(253, 187, 45, 0.5);
    }
    
    .inactive-player {
      opacity: 0.5;
    }
    
    .can-call-liar {
      background-color: rgba(211, 47, 47, 0.3);
      box-shadow: 0 0 15px rgba(211, 47, 47, 0.5);
    }
    
    .player-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .player-info h3 {
      margin: 0 0 10px 0;
      color: #fdbb2d;
    }
    
    .cards-count {
      font-size: 0.9rem;
      color: #ccc;
      margin-bottom: 5px;
    }
    
    .player-status {
      font-size: 0.8rem;
      padding: 3px 8px;
      border-radius: 10px;
      margin-top: 5px;
    }
    
    .player-status.current-player {
      background-color: #fdbb2d;
      color: #1a2a6c;
    }
    
    .player-status.can-call-liar {
      background-color: #d32f2f;
      color: white;
    }
    
    .player-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }
    
    .game-actions {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .move-actions, .roulette-section, .game-over {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 500px;
    }
    
    .declare-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
      width: 100%;
    }
    
    .selected-info {
      background-color: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 8px;
      width: 100%;
      text-align: center;
    }
    
    .selected-info p {
      margin-bottom: 0;
    }
    
    label {
      font-weight: bold;
    }
    
    input, select {
      padding: 10px;
      border: none;
      border-radius: 5px;
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 1rem;
    }
    
    input:focus, select:focus {
      outline: none;
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    .action-button {
      padding: 12px 25px;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #fdbb2d;
      color: #1a2a6c;
      margin-top: 15px;
      width: 100%;
    }
    
    .action-button:hover:not([disabled]) {
      background-color: #ffcc55;
      transform: translateY(-2px);
    }
    
    .action-button[disabled] {
      background-color: #777;
      color: #aaa;
      cursor: not-allowed;
    }
    
    .liar-button {
      background-color: #d32f2f;
      color: white;
    }
    
    .liar-button:hover {
      background-color: #e33e3e;
    }
    
    .roulette-button {
      background-color: #d32f2f;
      color: white;
      animation: pulse 1.5s infinite;
    }
    
    .roulette-message {
      font-size: 1.2rem;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .game-over {
      text-align: center;
    }
    
    .game-over h2 {
      color: #fdbb2d;
      margin-bottom: 15px;
    }
    
    @media (max-width: 768px) {
      .table {
        flex-direction: column;
        gap: 20px;
      }
      
      .declare-section {
        grid-template-columns: 1fr;
      }
      
      .players-circle {
        flex-direction: column;
      }
      
      .player-circle::after {
        top: auto;
        right: auto;
        bottom: -20px;
        left: 50%;
        width: 2px;
        height: 20px;
        transform: translateX(-50%);
      }
    }
  `
})
export class GameBoardComponent implements OnInit {
  // Константы для типов карт
  CardType = CardType;
  CARD_NAMES = CARD_NAMES;
  GamePhase = GamePhase;
  
  // Максимальное количество карт за ход
  readonly MAX_CARDS_PER_MOVE = 3;
  
  // Текущий игрок (для отображения карт)
  currentPlayerId = '';
  
  // Выбранные карты для хода
  selectedCards: number[] = [];
  
  // Геттер для получения состояния игры
  gameState = computed(() => this.gameService.getGameState()());
  
  constructor(private gameService: GameService) {
    // Получаем ID текущего игрока из сессии
    const sessionId = this.gameService.getCurrentPlayer()()?.sessionId;
    if (sessionId) {
      this.currentPlayerId = sessionId;
    }
  }
  
  ngOnInit() {
    // Получаем данные о текущей комнате
    const room = this.gameService.getCurrentRoom()();
    if (!room) {
      console.error('No current room found');
    } else {
      console.log('Current room:', room);
      console.log('Game state:', room.gameState);
      console.log('Current player:', this.gameService.getCurrentPlayer()());
      console.log('Game state from service:', this.gameService.getGameState()());
    }
  }
  
  cards() {
    return this.gameService.getCards()();
  }
  
  // Получение игроков в порядке хода
  getOrderedPlayers(): Player[] {
    const state = this.gameState();
    if (!state || !state.players || !Array.isArray(state.players)) return [];
    
    const players = [...state.players];
    const currentIndex = state.currentPlayerIndex || 0;
    
    return [
      ...players.slice(currentIndex),
      ...players.slice(0, currentIndex)
    ];
  }
  
  // Получение имени игрока по ID
  getPlayerName(playerId: string | undefined | null): string {
    if (!playerId) return '';
    const state = this.gameState();
    if (!state || !state.players || !Array.isArray(state.players)) return '';
    
    const player = state.players.find((p: Player) => p.id === playerId);
    return player ? player.name : '';
  }
  
  // Получение имени победителя
  getWinnerName(): string {
    const state = this.gameState();
    if (!state || !state.winner) return '';
    return this.getPlayerName(state.winner);
  }
  
  // Получение типа карты по ID
  getCardTypeById(cardId: number): CardType | undefined {
    const card = this.cards().find(c => c.id === cardId);
    return card ? card.type as CardType : undefined;
  }
  
  // Получение количества карт в последнем ходе
  getLastMoveCount(): number {
    const state = this.gameState();
    return state?.lastMove?.declaredCards?.count || 0;
  }
  
  // Получение типа карт в последнем ходе
  getLastMoveType(): string {
    const state = this.gameState();
    const type = state?.lastMove?.declaredCards?.type || '';
    return this.getCardName(type);
  }
  
  // Получение карт в последнем ходе
  getLastMoveCards(): number[] {
    const state = this.gameState();
    return state?.lastMove?.actualCardIds || [];
  }
  
  // Проверка, ход ли текущего игрока
  isCurrentPlayersTurn(): boolean {
    const state = this.gameState();
    if (!state || !state.players || !Array.isArray(state.players)) return false;
    
    const currentPlayer = state.players.find(p => p.id === this.currentPlayerId);
    return Boolean(currentPlayer?.isCurrentPlayer);
  }
  
  // Выбор/отмена выбора карты
  toggleCardSelection(cardId: number) {
    const state = this.gameState();
    if (!state || state.gamePhase !== GamePhase.PLAYER_TURN || !this.isCurrentPlayersTurn()) {
      return;
    }
    
    const index = this.selectedCards.indexOf(cardId);
    if (index === -1) {
      // Если карта еще не выбрана и не превышен лимит, добавляем ее
      if (this.selectedCards.length < this.MAX_CARDS_PER_MOVE) {
        this.selectedCards.push(cardId);
      }
    } else {
      // Если карта уже выбрана, убираем ее
      this.selectedCards.splice(index, 1);
    }
  }
  
  // Получение максимального количества карт, которые можно объявить
  getMaxDeclaredCount(): number {
    const state = this.gameState();
    if (!state || !state.players || !Array.isArray(state.players)) return 0;
    
    const currentPlayer = state.players.find((p: Player) => p.id === this.currentPlayerId);
    return currentPlayer ? Math.min(currentPlayer.cards.length, this.MAX_CARDS_PER_MOVE) : 0;
  }
  
  // Проверка, можно ли сделать ход
  canMakeMove(): boolean {
    return this.selectedCards.length > 0 && 
           this.selectedCards.length <= this.MAX_CARDS_PER_MOVE && 
           this.isCurrentPlayersTurn();
  }
  
  // Сделать ход
  makeMove() {
    if (!this.canMakeMove()) return;
    
    const state = this.gameState();
    if (!state) return;
    
    this.gameService.makeMove(
      this.currentPlayerId,
      { count: this.selectedCards.length, type: state.currentBaseCard },
      this.selectedCards
    );
    
    // Сбрасываем выбранные карты
    this.selectedCards = [];
  }
  
  // Проверка, может ли текущий игрок вызвать "Лжец!"
  canCallLiar(): boolean {
    const state = this.gameState();
    if (!state || !state.lastMove || !state.players || !Array.isArray(state.players)) return false;
    
    const currentPlayer = state.players.find((p: Player) => p.id === this.currentPlayerId);
    if (!currentPlayer || !currentPlayer.isActive) return false;
    
    return currentPlayer.id !== state.lastMove.playerId;
  }
  
  // Вызвать "Лжец!"
  callLiar() {
    if (!this.canCallLiar()) return;
    this.gameService.callLiar(this.currentPlayerId);
  }
  
  // Получение сообщения для русской рулетки
  getRouletteMessage(): string {
    const state = this.gameState();
    if (!state || !state.players || !Array.isArray(state.players)) return '';
    
    const currentPlayer = state.players.find(p => p.isCurrentPlayer);
    if (!currentPlayer) return '';
    
    const chamber = currentPlayer.revolver.currentChamber;
    const chambersLeft = 6 - chamber;
    const probability = Math.round((1 / chambersLeft) * 100);
    
    return `${currentPlayer.name} должен нажать на курок. Вероятность выстрела: ${probability}%`;
  }
  
  // Нажать на курок
  triggerRoulette() {
    this.gameService.triggerRoulette();
  }
  
  // Перезапустить игру
  restartGame() {
    this.gameService.initGame(['Игрок 1', 'Игрок 2', 'Игрок 3', 'Игрок 4']);
    this.selectedCards = [];
  }
  
  // Проверка, может ли игрок сказать "Лжец"
  canPlayerCallLiar(playerId: string): boolean {
    const state = this.gameState();
    if (!state || !state.lastMove || !state.players || !Array.isArray(state.players)) return false;
    
    const player = state.players.find((p: Player) => p.id === playerId);
    if (!player || !player.isActive) return false;
    
    const lastMovePlayer = state.players.find((p: Player) => p.id === state.lastMove?.playerId);
    if (!lastMovePlayer) return false;
    
    return player.id !== lastMovePlayer.id;
  }
  
  // Получение имени карты по типу
  getCardName(type: string): string {
    return CARD_NAMES[type as CardType] || type;
  }
  
  // Получение имени базовой карты
  getBaseCardName(): string {
    const state = this.gameState();
    if (!state) return '';
    
    const baseCardType = state.currentBaseCard;
    const cardName = this.getCardName(baseCardType);
    
    // Склонение названия карты в зависимости от количества
    const count = this.selectedCards.length;
    if (count === 1) {
      return cardName;
    } else if (count > 1 && count < 5) {
      // Для 2-4 карт
      if (baseCardType === CardType.QUEEN) return 'Дамы';
      if (baseCardType === CardType.KING) return 'Короля';
      if (baseCardType === CardType.ACE) return 'Туза';
      if (baseCardType === CardType.JOKER) return 'Джокера';
    } else {
      // Для 5+ карт
      if (baseCardType === CardType.QUEEN) return 'Дам';
      if (baseCardType === CardType.KING) return 'Королей';
      if (baseCardType === CardType.ACE) return 'Тузов';
      if (baseCardType === CardType.JOKER) return 'Джокеров';
    }
    
    return cardName;
  }
} 