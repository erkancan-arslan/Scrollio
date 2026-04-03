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

// All three tiers target the same audience: a curious everyday adult with no prior expertise.
// "Difficulty" picks a progressively deeper practical angle — NOT a higher academic register.
// Even "advanced" must be fully understandable in one listen with no assumed background.
const DIFFICULTY_DOCTRINE: Record<Difficulty, string> = {
  beginner: [
    'The audience is a curious adult with zero prior knowledge.',
    'Cover the single most practical, real-world angle that makes the topic immediately click.',
    'Answer: "What is this, and why does it affect my everyday life?"',
    'Use concrete relatable examples (salary, rent, shopping, savings). No abstraction.',
    'This is NOT a textbook definition — it should feel like a useful insight.',
  ].join(' '),
  intermediate: [
    'The audience is a curious adult — still no assumed expertise.',
    'Go one layer deeper into HOW this works in practice.',
    'Answer: "How does this actually function, and what drives it?"',
    'Cover one clear mechanism or cause-and-effect a real person might encounter.',
    'Think "smart friend explaining at dinner" — no formulas, no jargon.',
  ].join(' '),
  advanced: [
    'The audience is a curious adult — still zero assumed expertise.',
    'Cover one nuanced, counterintuitive, or commonly-misunderstood angle.',
    'Answer: "What do most people get wrong, or what consequence do they overlook?"',
    'NOT academic or technical complexity — the depth comes from the sharpness of the idea, not the vocabulary.',
    'Must be fully understandable in one listen without any background knowledge.',
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

  /**
   * Kids mascot batch: N distinct lesson angles on one theme (no difficulty tiers).
   * Returns exactly `count` items (pads/truncates if the model misbehaves).
   */
  async suggestKidsMascotBatchTopics(
    topic: string,
    count: number,
    language: string,
    subject?: string,
    customPrompt?: string,
  ): Promise<Array<{ title: string; subTopic: string }>> {
    const lang = language === 'tr' ? 'Turkish' : 'English';
    const n = Math.min(Math.max(count, 1), 40);

    const prompt = [
      'You must respond with a single raw JSON array and absolutely nothing else.',
      'No markdown, no prose — only the JSON array.',
      '',
      '=== TASK ===',
      `Suggest exactly ${n} DISTINCT short educational video ideas for children aged 7–12 about: ${topic}`,
      subject ? `Subject area: ${subject}` : '',
      `Language for titles: ${lang}`,
      'Audience: children. Topics must be age-appropriate, safe, and engaging.',
      '',
      '=== RULES ===',
      `- Exactly ${n} items in the array — no more, no fewer.`,
      '- Each item must cover a different angle — no overlap.',
      '- subTopic is the specific concept the narrator will explain in that video.',
      customPrompt ? `Additional guidance: ${customPrompt}` : '',
      '',
      '=== OUTPUT FORMAT ===',
      '[',
      '  { "title": "Short catchy title", "subTopic": "Specific concept for script generation" },',
      '  ...',
      ']',
      '',
      'Now output the JSON array:',
    ]
      .filter((l) => l !== '')
      .join('\n');

    this.logger.log(`Suggesting ${n} kids mascot batch sub-topics for "${topic}" (${lang})`);

    const result = await this.callLlm(prompt);
    let items = this.parseJsonArray(result);
    if (items.length < n) {
      for (let i = items.length; i < n; i++) {
        items.push({
          title: `${topic} — #${i + 1}`,
          subTopic: `${topic} — lesson ${i + 1}`,
        });
      }
    }
    if (items.length > n) {
      items = items.slice(0, n);
    }
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
