import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { GetProgressQueryDto, CompleteMissionDto } from './dto';

@Injectable()
export class KidsProgressionService {
  private readonly logger = new Logger(KidsProgressionService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get progress overview: level, XP, progress to next level.
   */
  async getProgress(childId: string, _query: GetProgressQueryDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data: progress, error } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (error || !progress) {
      throw new NotFoundException('Progress record not found');
    }

    const level = progress.level as number;
    const xp = progress.xp as number;
    const xpToNextLevel = level * 100;
    const progressPercentage = Math.round((xp / xpToNextLevel) * 100);

    return {
      level,
      currentXp: xp,
      xpToNextLevel,
      progressPercentage,
      progressMap: progress.progress_map,
      playgroundPoints: (progress.playground_points as number) ?? 0,
    };
  }

  /**
   * Get or generate daily missions for today.
   */
  async getDailyMissions(childId: string) {
    const admin = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if missions exist for today
    const { data: existing } = await admin
      .from('kids_daily_missions')
      .select('*')
      .eq('child_profile_id', childId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      return {
        date: today,
        missions: existing.missions,
        completed: existing.completed,
      };
    }

    // Generate 3 daily missions
    const missions = [
      {
        id: 'watch_videos',
        title: 'Watch 3 videos',
        description: 'Watch at least 3 educational videos today',
        type: 'watch_videos',
        target: 3,
        current: 0,
        xpReward: 30,
      },
      {
        id: 'quiz_score',
        title: 'Complete a quiz with 80%+',
        description: 'Score at least 80% on any quiz',
        type: 'quiz_score',
        target: 1,
        current: 0,
        xpReward: 30,
      },
      {
        id: 'upload_drawing',
        title: 'Draw something new',
        description: 'Create and save a new drawing',
        type: 'upload_drawing',
        target: 1,
        current: 0,
        xpReward: 30,
      },
    ];

    const { error } = await admin.from('kids_daily_missions').insert({
      child_profile_id: childId,
      date: today,
      missions,
      completed: [],
    });

    if (error) {
      this.logger.error(`getDailyMissions insert error: ${error.message}`);
    }

    return {
      date: today,
      missions,
      completed: [],
    };
  }

  /**
   * Complete a mission and award XP.
   */
  async completeMission(childId: string, missionId: string, _dto: CompleteMissionDto) {
    const admin = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: record } = await admin
      .from('kids_daily_missions')
      .select('*')
      .eq('child_profile_id', childId)
      .eq('date', today)
      .maybeSingle();

    if (!record) {
      throw new NotFoundException('No daily missions found for today');
    }

    const completed = (record.completed ?? []) as string[];
    if (completed.includes(missionId)) {
      throw new BadRequestException('Mission already completed');
    }

    const missions = record.missions as Array<{
      id: string;
      xpReward: number;
    }>;

    const mission = missions.find((m) => m.id === missionId);
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // Mark as completed
    const newCompleted = [...completed, missionId];
    await admin
      .from('kids_daily_missions')
      .update({ completed: newCompleted })
      .eq('id', record.id);

    // Award XP
    let xpEarned = mission.xpReward;

    // Bonus if all 3 daily missions done
    if (newCompleted.length === missions.length) {
      xpEarned += 50; // bonus for completing all daily missions
    }

    await this.addXp(admin, childId, xpEarned);

    // Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'mission_completed',
      metadata: { mission_id: missionId, xp_earned: xpEarned },
    });

    return {
      completed: true,
      xpEarned,
      allMissionsCompleted: newCompleted.length === missions.length,
    };
  }

  /**
   * Get earned rewards for a child.
   */
  async getRewards(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_rewards')
      .select('*')
      .eq('child_profile_id', childId)
      .order('earned_at', { ascending: false });

    if (error) {
      this.logger.error(`getRewards error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Shared helper: check and progress missions based on an event.
   * Called passively from other services (feed, quiz, playground).
   */
  async checkAndProgressMissions(
    childId: string,
    eventType: string,
    _eventData: Record<string, unknown> = {},
  ) {
    const admin = this.supabaseService.getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: record } = await admin
      .from('kids_daily_missions')
      .select('*')
      .eq('child_profile_id', childId)
      .eq('date', today)
      .maybeSingle();

    if (!record) return;

    const missions = record.missions as Array<{
      id: string;
      type: string;
      target: number;
      current: number;
    }>;

    const completed = (record.completed ?? []) as string[];
    let updated = false;

    for (const mission of missions) {
      if (completed.includes(mission.id)) continue;

      if (
        (eventType === 'video_view' && mission.type === 'watch_videos') ||
        (eventType === 'quiz_attempt' && mission.type === 'quiz_score') ||
        (eventType === 'drawing_uploaded' && mission.type === 'upload_drawing')
      ) {
        mission.current = (mission.current ?? 0) + 1;
        updated = true;
      }
    }

    if (updated) {
      await admin
        .from('kids_daily_missions')
        .update({ missions })
        .eq('id', record.id);
    }
  }

  private async addXp(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    xpAmount: number,
  ) {
    const { data: progress } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    let newXp = (progress.xp as number) + xpAmount;
    let level = progress.level as number;
    let leveledUp = false;

    while (newXp >= level * 100) {
      newXp -= level * 100;
      level++;
      leveledUp = true;
    }

    await admin
      .from('kids_progress')
      .update({ xp: newXp, level, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);

    if (leveledUp) {
      await admin.from('kids_rewards').insert({
        child_profile_id: childId,
        reward_type: 'level_up',
        reward_data: { newLevel: level },
        earned_at: new Date().toISOString(),
      });
    }
  }
}
