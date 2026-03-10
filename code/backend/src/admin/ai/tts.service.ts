import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  /**
   * Generate TTS audio. Uses language to pick voice when TURKISH_VOICE_ID is set for Turkish.
   */
  async generateSpeech(text: string, voice?: string, language?: string): Promise<string> {
    const effectiveVoice = this.getVoiceForLanguage(voice, language);
    this.logger.log(`Generating TTS audio (${text.length} chars, voice=${effectiveVoice}, lang=${language || 'n/a'})`);

    const response = await fetch(
      'https://fal.run/fal-ai/elevenlabs/text-to-dialogue/eleven-v3',
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [{ text, voice: effectiveVoice }],
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`TTS request failed: ${response.status} ${body}`);
      throw new Error(`TTS generation failed: ${response.status}`);
    }

    const result = await response.json();
    const audioUrl = result.audio_url || result.audio?.url || result.url || result.output;

    if (!audioUrl || typeof audioUrl !== 'string') {
      this.logger.error('TTS returned no audio URL', result);
      throw new Error('TTS returned no audio URL');
    }

    this.logger.log(`TTS audio generated: ${audioUrl}`);
    return audioUrl;
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
