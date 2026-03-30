/**
 * Kids mascot picker — ids must match:
 * - reference_videos.character_id
 * - kids_child_profiles.selected_character_id
 * - kids_content.character_id (set on publish)
 */

export interface KidsCharacter {
  id: string;
  name: string;
  imageUrl: string;
  emoji: string;
}

export const KIDS_CHARACTERS: KidsCharacter[] = [
  { id: 'bird', name: 'Kuş', imageUrl: '', emoji: '🐦' },
  { id: 'cat', name: 'Kedi', imageUrl: '', emoji: '🐱' },
  { id: 'dragon', name: 'Ejder', imageUrl: '', emoji: '🐉' },
];
