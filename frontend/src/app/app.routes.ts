import { Routes } from '@angular/router';
import { StartScreenComponent } from './components/start-screen/start-screen.component';
import { GameBoardComponent } from './components/game-board/game-board.component';

export const routes: Routes = [
  { path: '', component: StartScreenComponent },
  { path: ':roomId', component: GameBoardComponent },
  { path: '**', redirectTo: '' }
];
