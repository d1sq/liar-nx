import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { GameRoom } from '../../models/game.model';

@Component({
  selector: 'app-start-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="start-screen">
      <div class="container">
        <h1 class="title">Лжец</h1>
        <div class="card-game">Карточная игра с русской рулеткой</div>
        
        @if (error()) {
          <div class="error-message">
            {{ error() }}
          </div>
        }
        
        @if (!currentPlayerName()) {
          <div class="player-setup">
            <h2>Введите ваше имя</h2>
            <div class="name-input">
              <input 
                type="text" 
                [(ngModel)]="tempPlayerName" 
                placeholder="Ваше имя"
                required
              />
              <button 
                class="confirm-button" 
                [disabled]="!tempPlayerName.trim() || loading()" 
                (click)="confirmName()"
              >
                Подтвердить
              </button>
            </div>
          </div>
        } @else {
          <div class="room-selection">
            <h2>Выберите комнату</h2>
            
            <div class="create-room">
              <input 
                type="text" 
                [(ngModel)]="newRoomName" 
                placeholder="Название новой комнаты"
              />
              <button 
                class="create-button" 
                [disabled]="!newRoomName.trim() || loading()" 
                (click)="createRoom()"
              >
                Создать комнату
              </button>
            </div>
            
            <div class="room-list">
              <h3>Доступные комнаты:</h3>
              @if (loading()) {
                <div class="loading">Загрузка...</div>
              } @else if (rooms().length === 0) {
                <div class="no-rooms">Нет доступных комнат</div>
              } @else {
                @for (room of rooms(); track room.id) {
                  <div class="room-item">
                    <div class="room-info">
                      <span class="room-name">{{ room.name }}</span>
                      <span class="room-players">Игроков: {{ room.players?.length || 0 }}/{{ room.maxPlayers }}</span>
                    </div>
                    @if (!room.isActive) {
                      @if (isCreator(room)) {
                        <button 
                          class="start-button" 
                          [disabled]="(room.players?.length || 0) < 2 || loading()" 
                          (click)="startGame(room)"
                        >
                          Начать игру
                        </button>
                      } @else {
                        <button 
                          class="join-button" 
                          [disabled]="(room.players?.length || 0) >= room.maxPlayers || loading()" 
                          (click)="joinRoom(room)"
                        >
                          Присоединиться
                        </button>
                      }
                    } @else {
                      <span class="game-started">Игра началась</span>
                    }
                  </div>
                }
              }
            </div>
          </div>
        }
        
        <div class="actions">
          <button 
            class="rules-button" 
            (click)="toggleRules()"
          >
            {{ showRules ? 'Скрыть правила' : 'Показать правила' }}
          </button>
        </div>
        
        @if (showRules) {
          <div class="rules">
            <h2>Правила игры "Лжец"</h2>
            <h3>Количество игроков:</h3>
            <p>4 игрока.</p>
            
            <h3>Комплект карт:</h3>
            <p>Колода состоит из 20 карт:</p>
            <ul>
              <li>6 дам</li>
              <li>6 королей</li>
              <li>6 тузов</li>
              <li>2 джокера</li>
            </ul>
            
            <h3>Цель игры:</h3>
            <p>Первым избавиться от всех своих карт или остаться единственным игроком в игре после выбывания остальных.</p>
            
            <h3>Подготовка к игре:</h3>
            <ul>
              <li>Перетасуйте колоду и раздайте каждому игроку по 5 карт.</li>
              <li>Оставшиеся карты положите рубашкой вверх в центр стола — это колода.</li>
              <li>Случайным образом выберите базовую карту (например, «король») — это тип карты, на который все будут ссылаться в текущем раунде.</li>
              <li>Определите первого игрока случайным образом.</li>
            </ul>
            
            <h3>Ход игры:</h3>
            <p><strong>Базовая карта:</strong> В начале раунда объявляется базовая карта (например, «король»). Она остаётся неизменной до конца раунда.</p>
            <p><strong>Ход игрока:</strong> Игрок кладет одну или несколько карт рубашкой вверх на стол и объявляет, что это карты, соответствующие базовой карте. Игроки не видят реальных карт — игрок может говорить правду или блефовать.</p>
            <p><strong>Ходы остальных игроков:</strong> Каждый следующий игрок либо кладет свои карты, соответствующие базовой карте, либо подозревает предыдущего игрока в блефе и объявляет «лжец!».</p>
            
            <h3>"Лжец!" и разоблачение:</h3>
            <p>Если кто-то заявляет «лжец!», игрок, который сделал последний ход, должен открыть свои карты.</p>
            <ul>
              <li>Если карты соответствуют заявленным: Игрок, который вызвал "лжеца", проигрывает и участвует в русской рулетке.</li>
              <li>Если карты не соответствуют заявленным: Проигрывает тот, кто блефовал, и он триггерит револьвер.</li>
            </ul>
            
            <h3>Русская рулетка:</h3>
            <ul>
              <li>Каждый игрок имеет револьвер с шестью ячейками и одним патроном.</li>
              <li>Проигравший триггерит свой револьвер.</li>
              <li>Вероятность выстрела на первом круге составляет 1/6 (16,67%).</li>
              <li>Если выстрела не произошло, револьвер сдвигается на следующую ячейку, и вероятность выстрела увеличивается: 1/5 (20%), 1/4 (25%), 1/3 (33,33%), 1/2 (50%), 1/1 (100%).</li>
              <li>Если произошёл выстрел, игрок выбывает из игры.</li>
            </ul>
            
            <h3>Правила джокера:</h3>
            <ul>
              <li>Универсальные карты: Джокеры могут заменять любую карту.</li>
              <li>За использование джокера игрок не может быть вызван на "лжеца", так как это считается валидным ходом.</li>
            </ul>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .start-screen {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Roboto', sans-serif;
      color: white;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    
    .title {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #fdbb2d;
    }
    
    .card-game {
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.2rem;
      color: #ccc;
    }
    
    .error-message {
      background-color: rgba(255, 0, 0, 0.2);
      border: 1px solid #ff0000;
      color: #ff0000;
      padding: 10px;
      margin-bottom: 20px;
      border-radius: 5px;
      text-align: center;
    }
    
    .player-setup, .room-selection {
      margin-bottom: 30px;
    }
    
    h2 {
      margin-bottom: 15px;
      color: #fdbb2d;
    }
    
    .name-input, .create-room {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    input {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 5px;
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
    }
    
    input:focus {
      outline: none;
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .confirm-button, .create-button {
      background-color: #fdbb2d;
      color: #1a2a6c;
    }
    
    .confirm-button:hover:not([disabled]), 
    .create-button:hover:not([disabled]) {
      background-color: #ffcc55;
      transform: translateY(-2px);
    }
    
    .room-list {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      padding: 15px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .room-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin-bottom: 10px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
    }
    
    .room-info {
      display: flex;
      flex-direction: column;
    }
    
    .room-name {
      font-size: 1.1rem;
      font-weight: bold;
    }
    
    .room-players {
      font-size: 0.9rem;
      color: #ccc;
    }
    
    .join-button {
      background-color: #4CAF50;
      color: white;
    }
    
    .join-button:hover:not([disabled]) {
      background-color: #45a049;
      transform: translateY(-2px);
    }
    
    .rules-button {
      background-color: transparent;
      border: 2px solid #fdbb2d;
      color: #fdbb2d;
    }
    
    .rules-button:hover {
      background-color: rgba(253, 187, 45, 0.1);
    }
    
    .rules {
      margin-top: 20px;
      padding: 20px;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
    }
    
    .rules h2 {
      color: #fdbb2d;
      margin-bottom: 20px;
    }
    
    .rules h3 {
      color: #fdbb2d;
      margin: 15px 0 10px;
    }
    
    .rules p, .rules li {
      margin-bottom: 10px;
      line-height: 1.5;
    }
    
    .rules ul {
      list-style-type: disc;
      margin-left: 20px;
    }
    
    .start-button {
      background-color: #4CAF50;
      color: white;
    }
    
    .game-started {
      color: #ccc;
      font-style: italic;
    }
  `
})
export class StartScreenComponent {
  currentPlayerName = signal<string>('');
  protected loading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  
  tempPlayerName = '';
  newRoomName = '';
  showRules = false;
  
  constructor(private gameService: GameService) {
    // Загружаем список комнат при инициализации
    this.gameService.loadRooms();
  }
  
  get rooms() {
    return this.gameService.getAvailableRooms();
  }
  
  getLoading() {
    return this.loading();
  }
  
  getError() {
    return this.error();
  }
  
  confirmName() {
    if (this.tempPlayerName.trim()) {
      this.currentPlayerName.set(this.tempPlayerName.trim());
      // Загружаем список доступных комнат
      this.gameService.loadRooms();
    }
  }
  
  async createRoom() {
    if (!this.newRoomName.trim() || !this.currentPlayerName()) return;
    
    try {
      const room = await this.gameService.createRoom(this.newRoomName.trim());
      await this.joinRoom(room);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
  
  async joinRoom(room: GameRoom) {
    if (!this.currentPlayerName()) return;
    
    try {
      await this.gameService.joinRoom(room.id, this.currentPlayerName());
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }
  
  toggleRules() {
    this.showRules = !this.showRules;
  }
  
  // Проверяем, является ли текущий игрок создателем комнаты
  isCreator(room: GameRoom): boolean {
    if (!room.players || !Array.isArray(room.players) || !room.players.length) return false;
    const currentPlayer = this.gameService.getCurrentPlayer()();
    return currentPlayer?.id === room.players[0].id;
  }
  
  // Запуск игры
  async startGame(room: GameRoom) {
    if (this.loading()) return;
    
    try {
      this.loading.set(true);
      await this.gameService.startGame(room.id);
    } catch (error) {
      console.error('Error starting game:', error);
      this.error.set('Ошибка при запуске игры');
    } finally {
      this.loading.set(false);
    }
  }
} 