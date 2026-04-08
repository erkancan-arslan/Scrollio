import type { ChildProfile } from '../types';

/**
 * True when the child must complete topic-interest onboarding before the main Kids app.
 */
export function childNeedsTopicOnboarding(child: ChildProfile | null | undefined): boolean {
  if (!child?.id) return false;
  const v = child.topicOnboardingCompletedAt;
  return v == null || v === '';
}
