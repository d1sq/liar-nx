import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamePhase } from '../../models/player.model';

@Component({
  selector: 'app-revolver',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="revolver">
      @for (chamber of chambers; track $index) {
        <div 
          class="chamber" 
          [class.current]="$index === currentChamber"
          [class.loaded]="chamber && $index === currentChamber && isRoulette && isCurrentPlayer">
        </div>
      }
    </div>
  `,
  styles: `
    .revolver {
      display: flex;
      gap: 5px;
      margin-bottom: 10px;
    }
    
    .chamber {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #555;
      border: 2px solid #777;
      transition: all 0.3s ease;
    }
    
    .chamber.current {
      border-color: #fdbb2d;
    }
    
    .chamber.loaded {
      background-color: #d32f2f;
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `
})
export class RevolverComponent {
  @Input() chambers: boolean[] = [];
  @Input() currentChamber = 0;
  @Input() isRoulette = false;
  @Input() isCurrentPlayer = false;
} 