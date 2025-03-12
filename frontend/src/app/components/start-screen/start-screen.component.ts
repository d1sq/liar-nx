import { Component, inject } from '@angular/core';
import { GameService } from '../../services/game.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

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
        
        <div class="room-form">
          <h2>Создать новую игру</h2>
          
          <div class="room-input">
            <input 
              type="text" 
              [ngModel]="roomId()" 
              (ngModelChange)="roomId.set($event)" 
              placeholder="Введите ID комнаты (опционально)"
            />
          </div>
          
          <div class="room-actions">
            <button 
              class="create-button" 
              [disabled]="loading()" 
              (click)="createRoom()"
            >
              Создать новую комнату
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .start-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #121212;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    
    .container {
      width: 100%;
      height: 100%;
      background-color: #1e1e1e;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    .title {
      font-size: 6rem;
      text-align: center;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 8px;
      color: #e0e0e0;
    }
    
    .card-game {
      text-align: center;
      margin-bottom: 80px;
      font-size: 2rem;
      color: #9e9e9e;
    }
    
    .error-message {
      background-color: rgba(255, 0, 0, 0.2);
      border: 1px solid #ff0000;
      color: #ff0000;
      padding: 20px;
      margin-bottom: 40px;
      border-radius: 5px;
      text-align: center;
      width: 100%;
      max-width: 600px;
    }
    
    .room-form {
      margin-bottom: 40px;
      width: 100%;
      max-width: 600px;
    }
    
    h2 {
      margin-bottom: 40px;
      color: #e0e0e0;
      text-align: center;
      font-size: 2.5rem;
    }
    
    .room-input {
      margin-bottom: 40px;
    }
    
    input {
      width: 100%;
      padding: 20px;
      border: none;
      border-radius: 5px;
      background-color: #2d2d2d;
      color: white;
      font-size: 1.5rem;
      text-align: center;
    }
    
    input:focus {
      outline: none;
      background-color: #3d3d3d;
    }
    
    .room-actions {
      display: flex;
      justify-content: center;
    }
    
    button {
      padding: 20px 40px;
      border: none;
      border-radius: 5px;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .create-button {
      background-color: #4CAF50;
      color: white;
    }
    
    .create-button:hover:not([disabled]) {
      transform: translateY(-2px);
      background-color: #5dbd61;
    }
  `
})
export class StartScreenComponent {
  private gameService = inject(GameService);
  
  roomId = signal<string>('');
  
  // Сигналы из сервиса
  error = this.gameService.getError();
  loading = this.gameService.getLoading();
  
  async createRoom() {
    if (this.loading()) return;
    
    try {
      // Используем введенный ID или генерируем случайный
      const roomId = this.roomId() || Math.random().toString(36).substring(2, 8);
      const roomName = `Комната ${roomId}`;
      
      // Создаем комнату через WebSocket
      const { success, room } = await this.gameService.createRoom(roomName, 4, roomId);
      
      if (!success) {
        throw new Error('Не удалось создать комнату');
      }
      
      // Перенаправляем на страницу комнаты
      window.location.href = `/${roomId}`;
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
} 