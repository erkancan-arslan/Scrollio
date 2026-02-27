/**
 * Six cute monster characters for Kids character selection.
 * IDs match backend (selected_character_id): monster_1 .. monster_6.
 */

export interface KidsCharacter {
  id: string;
  name: string;
  imageUrl: string;
  emoji: string;
}

export const KIDS_CHARACTERS: KidsCharacter[] = [
  { id: 'monster_1', name: 'Pamuk', imageUrl: '', emoji: '👾' },
  { id: 'monster_2', name: 'Mavi', imageUrl: '', emoji: '🐲' },
  { id: 'monster_3', name: 'Zıpzıp', imageUrl: '', emoji: '🦖' },
  { id: 'monster_4', name: 'Pıtır', imageUrl: '', emoji: '🐸' },
  { id: 'monster_5', name: 'Leylek', imageUrl: '', emoji: '🦕' },
  { id: 'monster_6', name: 'Bulut', imageUrl: '', emoji: '☁️' },
];
