import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { VoiceCommandDto } from './dto';

/**
 * Supported voice commands:
 *   "next"       → skip to next content
 *   "bookmark"   → bookmark current content
 *   "quiz"       → start a quiz
 *   "missions"   → navigate to missions
 *   "profile"    → navigate to profile
 *   "search X"   → search for topic X
 */

export interface VoiceAction {
  action: string;
  payload?: Record<string, unknown>;
  response: string;
}

@Injectable()
export class KidsVoiceService {
  private readonly logger = new Logger(KidsVoiceService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async processCommand(childId: string, dto: VoiceCommandDto): Promise<VoiceAction> {
    const raw = (dto.command ?? '').trim().toLowerCase();

    // Log the voice command
    const admin = this.supabaseService.getAdminClient();
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'voice_command',
      metadata: { command: raw, screenContext: dto.screenContext },
    });

    // Match commands
    if (raw === 'next' || raw === 'skip') {
      return { action: 'NEXT_CONTENT', response: 'Showing next content!' };
    }

    if (raw === 'bookmark' || raw === 'save' || raw === 'like') {
      return { action: 'TOGGLE_BOOKMARK', response: 'Toggling bookmark!' };
    }

    if (raw === 'quiz' || raw === 'question') {
      return { action: 'START_QUIZ', response: 'Starting quiz!' };
    }

    if (raw === 'missions' || raw === 'daily missions') {
      return { action: 'NAVIGATE', payload: { screen: 'missions' }, response: 'Opening missions!' };
    }

    if (raw === 'profile' || raw === 'me') {
      return { action: 'NAVIGATE', payload: { screen: 'profile' }, response: 'Opening profile!' };
    }

    if (raw === 'draw' || raw === 'playground' || raw === 'play') {
      return { action: 'NAVIGATE', payload: { screen: 'playground' }, response: 'Opening playground!' };
    }

    if (raw.startsWith('search ') || raw.startsWith('find ')) {
      const query = raw.replace(/^(search|find)\s+/, '');
      return { action: 'SEARCH', payload: { query }, response: `Searching for "${query}"` };
    }

    return { action: 'UNKNOWN', response: "I didn't understand that. Try saying 'next', 'bookmark', or 'quiz'." };
  }
}
