/**
 * useTopics — Manages topic selection and search
 */

import { KidsTopic } from '../types/profile.types';

const asyncNoop = async () => {};

interface UseTopicsReturn {
  topics: KidsTopic[];
  selectedTopics: KidsTopic[];
  selectTopics: (ids: string[]) => Promise<void>;
  searchTopics: (query: string) => Promise<void>;
}

export const useTopics = (): UseTopicsReturn => {
  return {
    topics: [],
    selectedTopics: [],
    selectTopics: asyncNoop,
    searchTopics: asyncNoop,
  };
};
