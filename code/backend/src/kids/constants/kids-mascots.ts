/**
 * Canonical kids mascot ids — must match reference_videos.character_id and mobile KIDS_CHARACTERS[].id
 */
export const KIDS_MASCOT_CHARACTER_IDS = ['bird', 'cat', 'dragon'] as const;

export type KidsMascotCharacterId = (typeof KIDS_MASCOT_CHARACTER_IDS)[number];

export function isKidsMascotCharacterId(value: string): value is KidsMascotCharacterId {
  return (KIDS_MASCOT_CHARACTER_IDS as readonly string[]).includes(value);
}
