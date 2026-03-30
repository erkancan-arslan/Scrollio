import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  /**
   * Generate TTS audio. Uses language to pick voice when TURKISH_VOICE_ID is set for Turkish.
   * Sends ISO 639-1 `language_code` to FAL so ElevenLabs is not invoked with a null language (can cause downstream 500s).
   */
  async generateSpeech(text: string, voice?: string, language?: string): Promise<string> {
    const effectiveVoice = this.getVoiceForLanguage(voice?.trim(), language);
    const languageCode = this.iso6391FromJobLanguage(language);
    this.logger.log(
      `Generating TTS audio (${text.length} chars, voice=${effectiveVoice}, lang=${language || 'n/a'}, language_code=${languageCode})`,
    );

    const voiceArg = typeof effectiveVoice === 'string' ? effectiveVoice.trim() : effectiveVoice;

    const ttsUrl = 'https://fal.run/fal-ai/elevenlabs/text-to-dialogue/eleven-v3';
    const requestBody = JSON.stringify({
      inputs: [{ text, voice: voiceArg }],
      language_code: languageCode,
      stability: 0.5,
    });

    const maxLogChars = 12_000;
    if (requestBody.length <= maxLogChars) {
      this.logger.log(`TTS request POST ${ttsUrl} body=${requestBody}`);
    } else {
      this.logger.log(
        `TTS request POST ${ttsUrl} body (${requestBody.length} bytes, truncated for log)=${requestBody.slice(0, maxLogChars)}…`,
      );
    }

    const response = await this.postTtsWithRetries(ttsUrl, requestBody, voiceArg);

    const result = await response.json();
    const audioUrl = result.audio_url || result.audio?.url || result.url || result.output;

    if (!audioUrl || typeof audioUrl !== 'string') {
      this.logger.error('TTS returned no audio URL', result);
      throw new Error('TTS returned no audio URL');
    }

    this.logger.log(`TTS audio generated: ${audioUrl}`);
    return audioUrl;
  }

  /** Map app language (`tr` | `en`) to ElevenLabs / FAL ISO 639-1 code. */
  private iso6391FromJobLanguage(language?: string): string {
    const l = (language || 'en').toLowerCase().trim();
    if (l === 'tr' || l.startsWith('tr')) return 'tr';
    return 'en';
  }

  /** Retries on transient FAL / ElevenLabs failures (429, 5xx). */
  private async postTtsWithRetries(ttsUrl: string, requestBody: string, voiceArg: string): Promise<Response> {
    const maxAttempts = 4;
    let lastStatus = 0;
    let lastBody = '';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.falKey}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (response.ok) {
        if (attempt > 0) {
          this.logger.log(`TTS succeeded after ${attempt + 1} attempt(s)`);
        }
        return response;
      }

      lastStatus = response.status;
      lastBody = await response.text();
      this.logger.error(`TTS request failed: ${response.status} ${lastBody}`);

      const retryable = response.status === 429 || (response.status >= 500 && response.status <= 504);
      if (!retryable || attempt === maxAttempts - 1) {
        break;
      }

      const delayMs = Math.min(1000 * 2 ** attempt, 10_000);
      this.logger.warn(`TTS retry ${attempt + 2}/${maxAttempts} in ${delayMs}ms (transient ${response.status})`);
      await sleep(delayMs);
    }

    let detail = lastBody;
    try {
      const j = JSON.parse(lastBody) as { detail?: unknown; message?: string };
      if (j?.detail != null) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
      else if (j?.message) detail = j.message;
    } catch {
      /* keep raw body */
    }
    const hint =
      /voice/i.test(detail) && voiceArg
        ? ' For eleven-v3 dialogue, set KIDS_TTS_VOICE_* to an ElevenLabs voice_id from your library (not only the display name).'
        : '';
    const downstream =
      /downstream_service_error/i.test(detail) || /Downstream service error/i.test(detail)
        ? ' If this persists, check status.fal.ai and ElevenLabs; reduce parallel TTS load (batch size) during outages.'
        : '';
    throw new Error(`TTS generation failed (${lastStatus}): ${detail}${hint}${downstream}`);
  }

  private getVoiceForLanguage(voice?: string, language?: string): string {
    if (voice) return voice;
    if (language === 'tr') {
      const turkishVoice = this.configService.get<string>('TURKISH_VOICE_ID');
      return turkishVoice || 'Adam'; // Adam is multilingual; set TURKISH_VOICE_ID for a Turkish voice
    }
    return 'Adam';
  }
}
