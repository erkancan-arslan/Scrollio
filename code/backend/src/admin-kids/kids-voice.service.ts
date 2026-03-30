import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Maps mascot reference_videos.character_id → voice string for FAL eleven-v3 TTS (TtsService).
 *
 * Env: KIDS_TTS_VOICE_BIRD, KIDS_TTS_VOICE_CAT, KIDS_TTS_VOICE_DRAGON.
 * Values: ElevenLabs voice name or voice_id — same as FAL docs.
 * If missing, generateSpeech uses language defaults (see TtsService).
 */
@Injectable()
export class KidsVoiceService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns ElevenLabs voice name/id for fal-ai elevenlabs, or undefined to fall back to TtsService defaults.
   */
  voiceForCharacter(characterId: string | null | undefined): string | undefined {
    if (!characterId?.trim()) return undefined;
    const envKey = `KIDS_TTS_VOICE_${characterId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    const v = this.configService.get<string>(envKey);
    return v?.trim() || undefined;
  }
}
