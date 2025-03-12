import { Component, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardType, CARD_NAMES } from '../../models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="card" 
      [class.card-back]="faceDown" 
      [class.selected]="selected"
      [class.queen]="!faceDown && cardType === CardType.QUEEN"
      [class.king]="!faceDown && cardType === CardType.KING"
      [class.ace]="!faceDown && cardType === CardType.ACE"
      [class.joker]="!faceDown && cardType === CardType.JOKER"
      (click)="onClick.emit()"
    >
      @if (!faceDown) {
        <div class="card-content">
          <div class="card-corner top-left">
            <div class="card-value">{{ getCardSymbol() }}</div>
          </div>
          
          <div class="card-center">
            <div class="card-symbol">{{ getCardSymbol() }}</div>
          </div>
          
          <div class="card-corner bottom-right">
            <div class="card-value">{{ getCardSymbol() }}</div>
          </div>
        </div>
      } @else {
        <div class="card-back-design"></div>
        @if (showCount && count !== undefined) {
          <div class="card-count">{{ count }}</div>
        }
      }
    </div>
  `,
  styles: `
    .card {
      width: 80px;
      height: 120px;
      border-radius: 8px;
      background-color: white;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      user-select: none;
    }
    
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .card.selected {
      transform: translateY(-10px);
      box-shadow: 0 5px 15px rgba(253, 187, 45, 0.7);
      border: 2px solid #fdbb2d;
    }
    
    .card-back {
      background: linear-gradient(45deg, #b71c1c, #d32f2f);
      color: white;
    }
    
    .card-back-design {
      width: 100%;
      height: 100%;
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(0, 0, 0, 0.1) 10px,
        rgba(0, 0, 0, 0.1) 20px
      );
      border-radius: 8px;
    }
    
    .card-count {
      position: absolute;
      top: 5px;
      right: 5px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border-radius: 50%;
      width: 25px;
      height: 25px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.8rem;
    }
    
    .card-content {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 5px;
    }
    
    .card-corner {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .top-left {
      align-self: flex-start;
    }
    
    .bottom-right {
      align-self: flex-end;
      transform: rotate(180deg);
    }
    
    .card-value {
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .card-center {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
    }
    
    .card-symbol {
      font-size: 2rem;
      font-weight: bold;
    }
    
    .queen {
      color: #d32f2f;
    }
    
    .king {
      color: #1a2a6c;
    }
    
    .ace {
      color: #388e3c;
    }
    
    .joker {
      background: linear-gradient(135deg, #f57f17, #7b1fa2);
      color: white;
    }
  `
})
export class CardComponent {
  @Input() cardType?: CardType;
  @Input() faceDown = false;
  @Input() selected = false;
  @Input() count?: number;
  @Input() showCount = false;
  @Output() onClick = new EventEmitter<void>();
  
  CardType = CardType;
  
  getCardSymbol(): string {
    if (!this.cardType) return '';
    
    switch (this.cardType) {
      case CardType.QUEEN: return 'Д';
      case CardType.KING: return 'К';
      case CardType.ACE: return 'Т';
      case CardType.JOKER: return 'Дж';
      default: return '';
    }
  }
} 