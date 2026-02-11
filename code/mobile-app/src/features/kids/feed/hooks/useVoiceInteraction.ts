/**
 * useVoiceInteraction — Manages voice input state and transcription
 */

const noop = () => {};

interface UseVoiceInteractionReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
}

export const useVoiceInteraction = (): UseVoiceInteractionReturn => {
  return {
    isListening: false,
    startListening: noop,
    stopListening: noop,
    transcript: '',
  };
};
