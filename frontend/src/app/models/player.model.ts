export interface Player {
  id: number;
  name: string;
  cards: number[]; // ID карт в руке игрока
  revolver: {
    chambers: boolean[]; // true - патрон, false - пусто
    currentChamber: number; // Текущая позиция барабана (0-5)
  };
  isActive: boolean; // Активен ли игрок в текущей игре
  isCurrentPlayer: boolean; // Ход этого игрока сейчас?
}

export interface GameState {
  players: Player[];
  deck: number[]; // ID карт в колоде
  discardPile: number[]; // ID карт в сбросе
  currentBaseCard: string; // Текущая базовая карта (тип)
  currentPlayerIndex: number; // Индекс текущего игрока
  lastMove: {
    playerId: number;
    declaredCards: { count: number; type: string }; // Что объявил игрок
    actualCardIds: number[]; // Фактические ID карт, которые положил игрок
  } | null;
  gamePhase: GamePhase;
  roundNumber: number;
  winner: number | null; // ID победителя, если игра завершена
}

export enum GamePhase {
  SETUP = 'SETUP', // Подготовка к игре
  PLAYER_TURN = 'PLAYER_TURN', // Ход игрока
  CHALLENGE = 'CHALLENGE', // Вызов "Лжец!"
  RUSSIAN_ROULETTE = 'RUSSIAN_ROULETTE', // Русская рулетка
  ROUND_END = 'ROUND_END', // Конец раунда
  GAME_OVER = 'GAME_OVER' // Конец игры
} 