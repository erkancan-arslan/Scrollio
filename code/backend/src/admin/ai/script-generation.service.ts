import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ScriptGenerationInput {
  topic: string;
  subject?: string;
  contentTarget: string;
  language: string;
  tone: string;
  durationTargetSeconds?: number;
  difficulty?: string;
  customPrompt?: string;
}

@Injectable()
export class ScriptGenerationService {
  private readonly logger = new Logger(ScriptGenerationService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  async generate(input: ScriptGenerationInput): Promise<string> {
    const wordCount = this.estimateWordCount(input.durationTargetSeconds || 60, input.language);
    const systemPrompt = this.buildSystemPrompt(input, wordCount);
    const userPrompt = this.buildUserPrompt(input);

    this.logger.log(`Generating script for topic="${input.topic}" target=${input.contentTarget} lang=${input.language}`);

    const response = await fetch('https://fal.run/fal-ai/any-llm', {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        prompt: `${systemPrompt}\n\n${userPrompt}`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`LLM request failed: ${response.status} ${body}`);
      throw new Error(`Script generation failed: ${response.status}`);
    }

    const result = await response.json();
    const output = result.output || result.result || result.text || '';

    if (!output || typeof output !== 'string') {
      throw new Error('LLM returned empty or invalid output');
    }

    this.logger.log(`Script generated: ${output.length} characters`);
    return output.trim();
  }

  private estimateWordCount(durationSeconds: number, language: string): number {
    const wordsPerSecond = language === 'tr' ? 2.2 : 2.5;
    return Math.round(durationSeconds * wordsPerSecond);
  }

  private buildSystemPrompt(input: ScriptGenerationInput, wordCount: number): string {
    const isKids = input.contentTarget === 'kids';

    if (isKids) {
      return [
        'You are a friendly educational content writer for children aged 7-12.',
        'Write in simple, clear language that is easy for children to understand.',
        'Be enthusiastic and encouraging. Use analogies kids relate to.',
        'The content must be age-appropriate and safe.',
        `Write approximately ${wordCount} words of spoken narration.`,
        'Output ONLY the spoken narration text. No markdown, no bullet points, no stage directions, no headers.',
        `Language: ${input.language === 'tr' ? 'Turkish' : 'English'}`,
        `Tone: ${input.tone}`,
        input.difficulty ? `Difficulty level: ${input.difficulty}` : '',
      ].filter(Boolean).join('\n');
    }

    return [
      'You are a smart, concise, modern educational content creator.',
      'Write engaging short-form video scripts that explain topics clearly and memorably.',
      'Be insightful and use real-world examples.',
      `Write approximately ${wordCount} words of spoken narration.`,
      'Output ONLY the spoken narration text. No markdown, no bullet points, no stage directions, no headers.',
      `Language: ${input.language === 'tr' ? 'Turkish' : 'English'}`,
      `Tone: ${input.tone}`,
      input.difficulty ? `Difficulty level: ${input.difficulty}` : '',
    ].filter(Boolean).join('\n');
  }

  private buildUserPrompt(input: ScriptGenerationInput): string {
    const parts = [`Topic: ${input.topic}`];
    if (input.subject) parts.push(`Subject area: ${input.subject}`);
    if (input.customPrompt) parts.push(`Additional instructions: ${input.customPrompt}`);
    return parts.join('\n');
  }
}
