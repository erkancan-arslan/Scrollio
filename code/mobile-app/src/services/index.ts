// Services exports
export { authService } from './auth/authService';
export type { User, Session, AuthResponse, SignUpParams, SignInParams, AuthState } from './auth/authService';

export { apiClient } from './api/apiClient';
export type { ApiResponse } from './api/apiClient';

export { feedService } from './feed/feedService';
export { coreQuizApi } from './feed/coreQuizApi';
export type {
  QuizLevel,
  QuizStatus,
  QuizQuestionPublic,
  QuizSubmitResult,
  VideoDifficulty,
} from './feed/coreQuizApi';

export { profileService } from './profile/profileService';

export { secureStorage, STORAGE_KEYS } from './storage/secureStorage';

