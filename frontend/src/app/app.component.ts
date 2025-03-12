import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StartScreenComponent } from './components/start-screen/start-screen.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, StartScreenComponent, GameBoardComponent],
  template: `
    <div class="app-container">
      @if (!currentRoom()) {
        <app-start-screen></app-start-screen>
      } @else {
        <app-game-board></app-game-board>
      }
    </div>
  `,
  styles: `
    .app-container {
      min-height: 100vh;
      width: 100%;
    }
  `
})
export class AppComponent {
  currentRoom = computed(() => this.gameService.getCurrentRoom()());
  
  constructor(public gameService: GameService) {}
}
