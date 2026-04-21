import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizGenerationInput {
  narration: string;
  topic: string;
  difficulty?: string | null;
  language: string;
  videoId?: string;
}

/**
 * Generates 3 multiple-choice quiz questions from a narration script.
 *
 * The model is asked to return strict JSON; we parse defensively and
 * validate every question so a malformed LLM response cannot corrupt
 * the database (we return [] in that case so the video still publishes).
 */
@Injectable()
export class QuizGenerationService {
  private readonly logger = new Logger(QuizGenerationService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  async generate(input: QuizGenerationInput): Promise<QuizQuestion[]> {
    if (!input.narration || input.narration.trim().length < 20) {
      this.logger.warn('Narration too short for quiz generation; skipping');
      return [];
    }

    const prompt = this.buildPrompt(input);

    try {
      const response = await fetch('https://fal.run/fal-ai/any-llm', {
        method: 'POST',
        headers: {
          Authorization: `Key ${this.falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          prompt,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Quiz LLM request failed: ${response.status} ${body}`);
        return [];
      }

      const result = await response.json();
      const output: string = result.output || result.result || result.text || '';

      const questions = this.parseQuestions(output, input.videoId);
      this.logger.log(
        `Generated ${questions.length} quiz questions for topic="${input.topic}" difficulty=${input.difficulty ?? 'n/a'}`,
      );
      return questions;
    } catch (err) {
      this.logger.error(
        `Quiz generation failed (non-blocking): ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
  }

  // ── Prompt ────────────────────────────────────────────────────────────────

  private buildPrompt(input: QuizGenerationInput): string {
    const lang = input.language === 'tr' ? 'Turkish' : 'English';
    const difficulty = input.difficulty ?? 'beginner';

    return [
      'You are an expert educational quiz writer.',
      `Write exactly 3 multiple-choice quiz questions in ${lang} that test whether a viewer understood the following short-video narration.`,
      '',
      '=== RULES ===',
      '- Each question has exactly 4 options.',
      '- Exactly one option is correct.',
      '- Options must be plausible; avoid joke distractors.',
      '- Questions must be answerable from the narration alone — no outside knowledge.',
      `- Calibrate difficulty to tier "${difficulty}" (beginner = surface recall; intermediate = applying the idea; advanced = nuance/misconception).`,
      '- Keep questions and options concise (one sentence each).',
      '- Add a 1-sentence "explanation" for each question that justifies the correct answer.',
      '',
      '=== OUTPUT FORMAT — CRITICAL ===',
      'Return ONLY valid minified JSON, no markdown, no code fences, no commentary.',
      'Schema:',
      '{"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]}',
      '"correctAnswer" is the zero-based index of the correct option in "options".',
      '',
      `Topic: ${input.topic}`,
      `Narration:`,
      input.narration,
    ].join('\n');
  }

  // ── Parsing ───────────────────────────────────────────────────────────────

  private parseQuestions(raw: string, videoId?: string): QuizQuestion[] {
    const json = this.extractJson(raw);
    if (!json) return [];

    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      this.logger.warn(`Could not parse quiz JSON: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }

    const items: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : [];

    const results: QuizQuestion[] = [];
    items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const question = typeof item.question === 'string' ? item.question.trim() : '';
      const options = Array.isArray(item.options)
        ? item.options.map((o: any) => (typeof o === 'string' ? o.trim() : '')).filter((o: string) => o.length > 0)
        : [];
      const correctAnswer = Number.isInteger(item.correctAnswer) ? item.correctAnswer : -1;
      const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : undefined;

      if (!question || options.length !== 4) return;
      if (correctAnswer < 0 || correctAnswer >= options.length) return;

      results.push({
        id: this.makeQuestionId(videoId, idx),
        question,
        options,
        correctAnswer,
        explanation,
      });
    });

    return results;
  }

  /** Strip common wrappers (```json fences, leading prose) before JSON.parse. */
  private extractJson(raw: string): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();

    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();

    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    const start =
      firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
    if (start === -1) return null;
    const lastCloseBrace = trimmed.lastIndexOf('}');
    const lastCloseBracket = trimmed.lastIndexOf(']');
    const end = Math.max(lastCloseBrace, lastCloseBracket);
    if (end < start) return null;
    return trimmed.slice(start, end + 1);
  }

  private makeQuestionId(videoId: string | undefined, idx: number): string {
    const seed = videoId ?? Math.random().toString(36).slice(2, 10);
    return `${seed}:${idx}`;
  }
}
