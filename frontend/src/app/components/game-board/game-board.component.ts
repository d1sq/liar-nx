import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { GameRoom, Player } from '../../models/game.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-board" *ngIf="currentRoom() as room">
      <div class="header">
        <h1>Комната: {{ room.name }}</h1>
        <div class="room-info">ID: {{ room.id }}</div>
      </div>
      
      <div class="players-container">
        <h2>Игроки</h2>
        <div class="players">
          <div *ngFor="let player of room.players" 
               class="player-card"
               [class.active]="player.isCurrentPlayer"
               [class.current]="player.id === currentPlayer()?.id">
            <h3>{{ player.name }}</h3>
            <div class="cards">
              <div *ngFor="let cardId of player.cards" class="card">
                {{ getCardName(getCardById(cardId)) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table">
        <h2>Игровой стол</h2>
        <div class="discard-pile" *ngIf="room.discardPile && room.discardPile.length > 0">
          <h3>На столе:</h3>
          <div class="cards-container">
            <div *ngFor="let cardId of room.discardPile" class="card">
              {{ getCardName(getCardById(cardId)) }}
            </div>
          </div>
        </div>

        <div class="controls" *ngIf="currentPlayer() as player">
          <button *ngIf="player.isCurrentPlayer"
                  class="action-button move-button"
                  [disabled]="loading()"
                  (click)="makeMove(room.id, { count: selectedCards.length, type: 'hearts' }, selectedCards)">
            Сделать ход
          </button>
          <button *ngIf="!player.isCurrentPlayer"
                  class="action-button liar-button"
                  [disabled]="loading()"
                  (click)="callLiar(room.id)">
            Лжец!
          </button>
          <button *ngIf="player.isCurrentPlayer"
                  class="action-button roulette-button"
                  [disabled]="loading()"
                  (click)="triggerRoulette(room.id)">
            Нажать на курок
          </button>
        </div>
      </div>

      <div class="error" *ngIf="error()">
        {{ error() }}
      </div>
    </div>
    
    <div class="loading" *ngIf="loading()">
      <div class="spinner"></div>
      <div>Загрузка...</div>
    </div>
    
    <div class="no-room" *ngIf="!currentRoom() && !loading()">
      <h2>Комната не найдена или игра еще не началась</h2>
      <button class="action-button" (click)="goToHome()">Вернуться на главную</button>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #121212;
      color: white;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .game-board {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 40px;
      background-color: #1e1e1e;
      overflow-y: auto;
    }

    .header {
      margin-bottom: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 3rem;
      margin-bottom: 15px;
      color: #e0e0e0;
    }

    .room-info {
      font-size: 1.5rem;
      color: #9e9e9e;
    }

    h2 {
      font-size: 2.5rem;
      margin-bottom: 30px;
      color: #e0e0e0;
      text-align: center;
    }

    .players-container {
      margin-bottom: 50px;
    }

    .players {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .player-card {
      background-color: #2d2d2d;
      border-radius: 10px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .player-card h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #e0e0e0;
    }

    .active {
      border: 2px solid #4CAF50;
      background-color: rgba(76, 175, 80, 0.1);
    }

    .current {
      border: 2px solid #2196F3;
      background-color: rgba(33, 150, 243, 0.1);
    }

    .cards {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .card {
      background-color: #3d3d3d;
      border-radius: 5px;
      padding: 10px;
      font-size: 0.9rem;
    }

    .table {
      margin-bottom: 40px;
    }

    .discard-pile {
      background-color: #2d2d2d;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .discard-pile h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #e0e0e0;
    }

    .cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      margin-top: 30px;
    }

    .action-button {
      padding: 15px 30px;
      border: none;
      border-radius: 5px;
      font-size: 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .move-button {
      background-color: #4CAF50;
      color: white;
    }

    .liar-button {
      background-color: #F44336;
      color: white;
    }

    .roulette-button {
      background-color: #FF9800;
      color: white;
    }

    .action-button:hover:not([disabled]) {
      transform: translateY(-2px);
    }

    .error {
      background-color: rgba(244, 67, 54, 0.2);
      border: 1px solid #F44336;
      color: #F44336;
      padding: 15px;
      margin-top: 30px;
      border-radius: 5px;
      text-align: center;
    }
    
    .loading, .no-room {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      background-color: #121212;
      z-index: 1000;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #4CAF50;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 20px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-room h2 {
      margin-bottom: 30px;
    }
  `]
})
export class GameBoardComponent implements OnInit {
  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  
  // Выбранные карты для хода
  selectedCards: number[] = [];
  
  // Сигналы из сервиса
  currentRoom = this.gameService.getCurrentRoom();
  currentPlayer = this.gameService.getCurrentPlayer();
  error = this.gameService.getError();
  loading = this.gameService.getLoading();
  
  ngOnInit() {
    // Получаем roomId из URL и подключаемся к комнате
    this.route.paramMap.subscribe(params => {
      const roomId = params.get('roomId');
      if (roomId) {
        this.joinRoom(roomId);
      }
    });
  }
  
  async joinRoom(roomId: string) {
    try {
      // Генерируем случайное имя игрока
      const playerName = `Игрок ${Math.floor(Math.random() * 1000)}`;
      
      await this.gameService.joinRoom(roomId, playerName);
      
      // Если комната существует и игра еще не началась, автоматически начинаем игру
      const room = this.currentRoom();
      if (room && !room.gameStarted) {
        await this.gameService.startGame(roomId);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }
  
  async makeMove(roomId: string, declaredCards: { count: number; type: string }, cardIds: number[]) {
    await this.gameService.makeMove(roomId, declaredCards, cardIds);
    this.selectedCards = [];
  }

  async callLiar(roomId: string) {
    await this.gameService.callLiar(roomId);
  }

  async triggerRoulette(roomId: string) {
    await this.gameService.triggerRoulette(roomId);
  }

  getCardById(id: number): { type: string; value: number } {
    return this.gameService.getCardById(id);
  }

  getCardName(card: { type: string; value: number }): string {
    return this.gameService.getCardName(card);
  }

  toggleCard(cardId: number) {
    const index = this.selectedCards.indexOf(cardId);
    if (index === -1) {
      this.selectedCards.push(cardId);
    } else {
      this.selectedCards.splice(index, 1);
    }
  }
  
  goToHome() {
    window.location.href = '/';
  }
} 