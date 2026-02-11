/**
 * useCharacterAI — Manages AI-generated character creation
 */

import { KidsCharacter } from '../types/playground.types';

const asyncNoop = async () => {};

interface UseCharacterAIReturn {
  character: KidsCharacter | null;
  generateCharacter: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export const useCharacterAI = (): UseCharacterAIReturn => {
  return {
    character: null,
    generateCharacter: asyncNoop,
    isGenerating: false,
  };
};
