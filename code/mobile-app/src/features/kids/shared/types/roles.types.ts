export enum UserRole {
  USER = 'user',
  PARENT = 'parent',
  KID = 'kid',
  SCHOOL = 'school',
}

export interface ChildProfile {
  id: string;
  parentId: string;
  displayName: string;
  avatarConfig: Record<string, unknown>;
  dateOfBirth?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  selectedCharacterId?: string | null;
  /** ISO timestamp when child saved ≥3 topics; null/undefined → show topic onboarding */
  topicOnboardingCompletedAt?: string | null;
}
