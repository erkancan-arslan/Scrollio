import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TopicSuggestions {
  beginner: Array<{ title: string; subTopic: string }>;
  intermediate: Array<{ title: string; subTopic: string }>;
  advanced: Array<{ title: string; subTopic: string }>;
}

export interface SingleDifficultySuggestions {
  items: Array<{ title: string; subTopic: string }>;
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PreviousLevelTopic {
  title: string;
  subTopic: string;
}

const DIFFICULTY_DOCTRINE: Record<Difficulty, string> = {
  beginner: [
    'Cover what things ARE at their most fundamental level.',
    'Focus on definitions, basic terminology, and why this topic matters to a complete newcomer.',
    'Assume zero prior knowledge. No jargon without a plain-language explanation.',
  ].join(' '),
  intermediate: [
    'Cover HOW things work mechanically.',
    'Go beyond definitions into strategies, instruments, and cause-and-effect relationships.',
    'Assume the listener already knows the basics — do NOT repeat beginner-level concepts.',
  ].join(' '),
  advanced: [
    'Cover sophisticated mechanisms, edge cases, and professional-grade strategies.',
    'Assume solid intermediate knowledge. Speak to someone who already operates in this space.',
    'Focus on nuance: risk management, complex instruments, second-order effects.',
    'Do not simplify. Precision and density are appropriate here.',
  ].join(' '),
};

@Injectable()
export class TopicSuggestionService {
  private readonly logger = new Logger(TopicSuggestionService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  /**
   * Suggest 5 topics for a single difficulty level.
   * Pass previousLevelTopics so the model can build meaningfully on them.
   */
  async suggestForDifficulty(
    topic: string,
    targetDifficulty: Difficulty,
    language: string,
    contentTarget: string,
    subject?: string,
    customPrompt?: string,
    previousLevelTopics?: Array<{ difficulty: Difficulty; topics: PreviousLevelTopic[] }>,
  ): Promise<Array<{ title: string; subTopic: string }>> {
    const lang = language === 'tr' ? 'Turkish' : 'English';
    const isKids = contentTarget === 'kids';
    const audienceNote = isKids
      ? 'Audience: children aged 7-12. All topics must be age-appropriate.'
      : 'Audience: adult learners.';

    const previousContext = previousLevelTopics && previousLevelTopics.length > 0
      ? previousLevelTopics.map(({ difficulty, topics }) => [
          `Already-approved ${difficulty.toUpperCase()} topics (your suggestions must NOT repeat these — build beyond them):`,
          ...topics.map((t, i) => `  ${i + 1}. "${t.title}" — ${t.subTopic}`),
        ].join('\n')).join('\n\n')
      : '';

    const prompt = [
      'You must respond with a single raw JSON array and absolutely nothing else.',
      'No markdown, no prose, no explanation — only the JSON array.',
      'The array must start with [ and end with ].',
      '',
      '=== TASK ===',
      `Suggest exactly 5 short educational video topics for the ${targetDifficulty.toUpperCase()} level of: ${topic}`,
      subject ? `Subject area: ${subject}` : '',
      `Language: ${lang}`,
      audienceNote,
      '',
      `=== ${targetDifficulty.toUpperCase()} LEVEL REQUIREMENTS ===`,
      DIFFICULTY_DOCTRINE[targetDifficulty],
      previousContext ? '' : '',
      previousContext,
      '',
      '=== COVERAGE RULES ===',
      '- Each of the 5 topics must cover a DISTINCT aspect — no overlap between them.',
      '- Topics must be at the correct difficulty level — not simpler, not more advanced.',
      targetDifficulty !== 'beginner'
        ? `- Do NOT cover ground already covered by the ${targetDifficulty === 'intermediate' ? 'beginner' : 'beginner or intermediate'} topics listed above.`
        : '',
      customPrompt ? `Additional guidance: ${customPrompt}` : '',
      '',
      '=== REQUIRED OUTPUT FORMAT ===',
      'Respond with exactly this JSON array (5 items, all fields filled in):',
      '[',
      '  { "title": "Short video title", "subTopic": "The specific concept this video explains" },',
      '  { "title": "...", "subTopic": "..." },',
      '  { "title": "...", "subTopic": "..." },',
      '  { "title": "...", "subTopic": "..." },',
      '  { "title": "...", "subTopic": "..." }',
      ']',
      '',
      'Now output the completed JSON array:',
    ].filter((l) => l !== null && l !== undefined).join('\n');

    this.logger.log(`Suggesting ${targetDifficulty} topics for "${topic}" (${lang})`);

    const result = await this.callLlm(prompt);
    const items = this.parseJsonArray(result);

    this.logger.log(`${targetDifficulty} topics suggested: ${items.length} items`);
    return items;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async callLlm(prompt: string): Promise<string> {
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
      this.logger.error(`Topic suggestion LLM failed: ${response.status} ${body}`);
      throw new Error(`Topic suggestion failed: ${response.status}`);
    }

    const res = await response.json();
    const raw: string = res.output || res.result || res.text || '';
    if (!raw) throw new Error('LLM returned empty topic suggestion');
    return raw;
  }

  private parseJsonArray(raw: string): Array<{ title: string; subTopic: string }> {
    // Strip any accidental markdown fences
    const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Try direct parse first
    try {
      const parsed = JSON.parse(stripped);
      if (Array.isArray(parsed)) return parsed;
      // Model might have returned { items: [...] } or { beginner: [...] }
      const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
      if (firstArray) return firstArray as any;
    } catch { /* fall through */ }

    // Extract first [...] block
    const match = stripped.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }

    this.logger.error(`Failed to parse topic JSON array. Raw (first 400): ${stripped.slice(0, 400)}`);
    throw new Error('Topic suggestion returned invalid JSON');
  }
}
