export interface Topic {
  id: string;
  label: string;
  emoji: string;
}

export const TOPICS: Topic[] = [
  { id: 'finance',          label: 'Finance',          emoji: '💰' },
  { id: 'entrepreneurship', label: 'Entrepreneur',     emoji: '🚀' },
  { id: 'technology',       label: 'Technology',       emoji: '💻' },
  { id: 'science',          label: 'Science',          emoji: '🔬' },
  { id: 'history',          label: 'History',          emoji: '📜' },
  { id: 'psychology',       label: 'Psychology',       emoji: '🧠' },
  { id: 'health',           label: 'Health & Fitness', emoji: '💪' },
  { id: 'art',              label: 'Art & Design',     emoji: '🎨' },
  { id: 'music',            label: 'Music',            emoji: '🎵' },
  { id: 'travel',           label: 'Travel',           emoji: '✈️' },
  { id: 'food',             label: 'Food & Cooking',   emoji: '🍳' },
  { id: 'sports',           label: 'Sports',           emoji: '⚽' },
  { id: 'environment',      label: 'Environment',      emoji: '🌱' },
  { id: 'space',            label: 'Space',            emoji: '🌌' },
  { id: 'literature',       label: 'Literature',       emoji: '📚' },
  { id: 'economics',        label: 'Economics',        emoji: '📊' },
  { id: 'film',             label: 'Film & Cinema',    emoji: '🎬' },
  { id: 'philosophy',       label: 'Philosophy',       emoji: '🤔' },
  { id: 'politics',         label: 'Politics',         emoji: '🗳️' },
  { id: 'mathematics',      label: 'Mathematics',      emoji: '📐' },
];

export const TOPIC_MAP: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
);

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_LEVELS: { id: DifficultyLevel; label: string; emoji: string; description: string }[] = [
  { id: 'beginner',     label: 'Beginner',     emoji: '🌱', description: 'New to this' },
  { id: 'intermediate', label: 'Intermediate', emoji: '📈', description: 'Some experience' },
  { id: 'advanced',     label: 'Advanced',     emoji: '🎯', description: 'Deep knowledge' },
];
