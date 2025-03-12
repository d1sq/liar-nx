import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, CardType, CARD_NAMES } from '../../models/card.model';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-player-hand',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="player-hand" [class.active]="player.isCurrentPlayer">
      <div class="player-info">
        <h3 class="player-name">{{ player.name }}</h3>
        <div class="player-status" [class.current-player]="player.isCurrentPlayer">
          {{ player.isCurrentPlayer ? 'Ваш ход' : '' }}
        </div>
        <div class="revolver-status">
          <div class="revolver">
            <div class="chamber" 
                *ngFor="let chamber of player.revolver.chambers; let i = index"
                [class.current]="i === player.revolver.currentChamber"
                [class.loaded]="chamber && debug">
            </div>
          </div>
          <div class="chamber-info">
            Шанс выстрела: {{ getRouletteChance() }}%
          </div>
        </div>
      </div>
      
      <div class="cards-container">
        @for (cardId of player.cards; track cardId) {
          <div class="card" 
               [class.selected]="selectedCards.includes(cardId)"
               (click)="toggleCardSelection(cardId)">
            <div class="card-inner">
              <div class="card-front">
                <div class="card-value">{{ getCardName(getCardById(cardId)?.type) }}</div>
              </div>
              <div class="card-back"></div>
            </div>
          </div>
        }
      </div>
      
      @if (player.isCurrentPlayer && selectedCards.length > 0) {
        <div class="action-panel">
          <div class="declare-section">
            <label>Объявить как:</label>
            <select [(ngModel)]="declaredType">
              <option [value]="CardType.QUEEN">{{ CARD_NAMES[CardType.QUEEN] }}</option>
              <option [value]="CardType.KING">{{ CARD_NAMES[CardType.KING] }}</option>
              <option [value]="CardType.ACE">{{ CARD_NAMES[CardType.ACE] }}</option>
            </select>
            <span class="card-count">x {{ selectedCards.length }}</span>
          </div>
          
          <button class="play-button" (click)="playCards()">Сыграть карты</button>
        </div>
      }
      
      @if (!player.isCurrentPlayer && canCallLiar) {
        <div class="liar-section">
          <button class="liar-button" (click)="callLiar()">Лжец!</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-hand {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .player-hand.active {
      background-color: #e3f2fd;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
      transform: translateY(-4px);
    }
    
    .player-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .player-name {
      margin: 0;
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .player-status {
      font-weight: bold;
      color: #2196f3;
      opacity: 0;
    }
    
    .player-status.current-player {
      opacity: 1;
    }
    
    .revolver-status {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .revolver {
      display: flex;
      gap: 4px;
      margin-bottom: 4px;
    }
    
    .chamber {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #ddd;
      border: 1px solid #999;
    }
    
    .chamber.current {
      background-color: #f44336;
      border-color: #d32f2f;
    }
    
    .chamber.loaded {
      background-color: #000;
    }
    
    .chamber-info {
      font-size: 0.8rem;
      color: #666;
    }
    
    .cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .card {
      width: 100px;
      height: 140px;
      perspective: 1000px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: translateY(-10px);
    }
    
    .card.selected {
      transform: translateY(-20px);
    }
    
    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s;
      transform-style: preserve-3d;
      box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
      border-radius: 8px;
    }
    
    .card-front, .card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      border-radius: 8px;
    }
    
    .card-front {
      background-color: white;
      color: black;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid #ddd;
    }
    
    .card-back {
      background-color: #b71c1c;
      background-image: linear-gradient(45deg, #d32f2f 25%, transparent 25%, transparent 75%, #d32f2f 75%, #d32f2f),
                        linear-gradient(45deg, #d32f2f 25%, transparent 25%, transparent 75%, #d32f2f 75%, #d32f2f);
      background-size: 20px 20px;
      background-position: 0 0, 10px 10px;
      transform: rotateY(180deg);
    }
    
    .card-value {
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .action-panel {
      background-color: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 1rem;
    }
    
    .declare-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    
    .card-count {
      font-weight: bold;
    }
    
    .play-button {
      width: 100%;
      padding: 0.75rem;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
    }
    
    .play-button:hover {
      background-color: #388e3c;
    }
    
    .liar-section {
      margin-top: 1rem;
      text-align: center;
    }
    
    .liar-button {
      padding: 0.75rem 2rem;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: bold;
      transition: all 0.3s;
    }
    
    .liar-button:hover {
      background-color: #d32f2f;
      transform: scale(1.05);
    }
  `]
})
export class PlayerHandComponent {
  @Input() player!: Player;
  @Input() cards: Card[] = [];
  @Input() canCallLiar = false;
  @Input() debug = false; // Для отладки (показывает патрон в барабане)
  
  @Output() playCardsEvent = new EventEmitter<{
    playerId: number;
    cardIds: number[];
    declaredType: string;
    declaredCount: number;
  }>();
  
  @Output() callLiarEvent = new EventEmitter<number>();
  
  selectedCards: number[] = [];
  declaredType = CardType.KING;
  
  CardType = CardType;
  CARD_NAMES = CARD_NAMES;
  
  toggleCardSelection(cardId: number) {
    if (this.selectedCards.includes(cardId)) {
      this.selectedCards = this.selectedCards.filter(id => id !== cardId);
    } else {
      this.selectedCards.push(cardId);
    }
  }
  
  playCards() {
    if (this.selectedCards.length > 0) {
      this.playCardsEvent.emit({
        playerId: this.player.id,
        cardIds: [...this.selectedCards],
        declaredType: this.declaredType,
        declaredCount: this.selectedCards.length
      });
      this.selectedCards = [];
    }
  }
  
  callLiar() {
    this.callLiarEvent.emit(this.player.id);
  }
  
  getCardById(cardId: number): Card | undefined {
    return this.cards.find(card => card.id === cardId);
  }
  
  getCardName(type: CardType | undefined): string {
    return type ? CARD_NAMES[type] : '';
  }
  
  getRouletteChance(): number {
    const chambersLeft = 6 - this.player.revolver.currentChamber;
    const loadedChambersLeft = this.player.revolver.chambers
      .slice(this.player.revolver.currentChamber)
      .filter(Boolean).length;
    
    if (chambersLeft === 0 || loadedChambersLeft === 0) {
      return 0;
    }
    
    return Math.round((loadedChambersLeft / chambersLeft) * 100);
  }
} 