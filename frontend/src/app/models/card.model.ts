export enum CardType {
  QUEEN = 'QUEEN',
  KING = 'KING',
  ACE = 'ACE',
  JOKER = 'JOKER'
}

export interface Card {
  id: number;
  type: CardType;
  image?: string; // Путь к изображению карты
}

export const CARD_NAMES: Record<CardType, string> = {
  [CardType.QUEEN]: 'Дама',
  [CardType.KING]: 'Король',
  [CardType.ACE]: 'Туз',
  [CardType.JOKER]: 'Джокер'
}; 