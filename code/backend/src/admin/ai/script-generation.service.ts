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

// Opening styles rotated via a hash of topic+difficulty to ensure variety
// across the 15 jobs in a batch without repeating within a batch.
const OPENING_STYLES = [
  'Start with a striking, counterintuitive fact.',
  'Open with a sharp, bold claim that the listener might disagree with.',
  'Begin mid-scenario: drop the listener into a real-world situation without preamble.',
  'Open with a direct, confident statement of what this topic is really about.',
  'Start with a vivid contrast — "most people think X, but actually Y".',
  'Open with a concrete number or statistic that reframes the topic.',
  'Begin with a short, punchy sentence that names the core tension or paradox.',
  'Start with a provocative question that you immediately answer — do not leave it hanging.',
];

@Injectable()
export class ScriptGenerationService {
  private readonly logger = new Logger(ScriptGenerationService.name);
  private readonly falKey: string;

  constructor(private readonly configService: ConfigService) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  async generate(input: ScriptGenerationInput): Promise<string> {
    const durationSeconds = input.durationTargetSeconds || 60;
    const maxWords = this.estimateWordCount(durationSeconds, input.language);
    const prompt = this.buildPrompt(input, durationSeconds, maxWords);

    this.logger.log(
      `Generating script for topic="${input.topic}" difficulty=${input.difficulty} lang=${input.language} maxWords=${maxWords}`,
    );

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
      this.logger.error(`LLM request failed: ${response.status} ${body}`);
      throw new Error(`Script generation failed: ${response.status}`);
    }

    const result = await response.json();
    const output: string = result.output || result.result || result.text || '';

    if (!output || typeof output !== 'string') {
      throw new Error('LLM returned empty or invalid output');
    }

    // Hard-truncate if the model still exceeded the limit by more than 20%
    const truncated = this.truncateToWordLimit(output.trim(), Math.ceil(maxWords * 1.2));
    this.logger.log(`Script generated: ${this.countWords(truncated)} words (limit ${maxWords})`);
    return truncated;
  }

  // ── Prompt builder ────────────────────────────────────────────────────────

  private buildPrompt(input: ScriptGenerationInput, durationSeconds: number, maxWords: number): string {
    const lang = input.language === 'tr' ? 'Turkish' : 'English';
    const openingStyle = this.pickOpeningStyle(input.topic, input.difficulty);
    const isKids = input.contentTarget === 'kids';

    const lines: string[] = [
      // ── Length constraint — stated first and last ──────────────────────────
      `STRICT WORD LIMIT: ${maxWords} words maximum. This script is for a ${durationSeconds}-second video.`,
      'Do NOT exceed this limit under any circumstances. Short and punchy is the goal.',
      '',
    ];

    if (isKids) {
      lines.push(
        'You are a friendly educational content writer for children aged 7-12.',
        'Write in simple, clear language. Be enthusiastic and encouraging.',
        'FORBIDDEN openings: "Ever wondered", "Have you ever", "Did you know", "Imagine if".',
        `Opening instruction: ${openingStyle}`,
        '',
        '=== OUTPUT FORMAT ===',
        'Output ONLY the spoken narration. No markdown, no bullet points, no stage directions, no headers.',
        'Do NOT output labels like "Script:", "Narration:", "Topic:", etc.',
        'Begin directly with the first spoken word.',
        `Language: ${lang}. Tone: ${input.tone}.`,
        '',
        '=== CONTENT ===',
        `Topic: ${input.topic}`,
        input.subject ? `Subject area: ${input.subject}` : '',
        input.customPrompt ? `Additional instructions: ${input.customPrompt}` : '',
        '',
        `REMINDER: Maximum ${maxWords} words. Stop when you reach the limit.`,
      );
    } else {
      const difficultyDoctrine = this.buildDifficultyDoctrine(input.difficulty);
      lines.push(
        'You are a world-class educational short-video scriptwriter.',
        'Your scripts are spoken directly to camera by a knowledgeable, confident narrator.',
        '',
        '=== OUTPUT FORMAT — CRITICAL ===',
        'Your entire response is ONLY the spoken narration — nothing else.',
        'Do NOT output "Topic:", "Sub-topic:", "Difficulty:", "Title:", "Script:", or any label.',
        'Do NOT write a title line. Do NOT add a prefix or suffix.',
        'The very first character of your response must be the first spoken word of the narration.',
        '',
        '=== FORBIDDEN OPENINGS ===',
        'NEVER start with: "Ever wondered", "Have you ever", "Did you know", "Imagine if",',
        '"Welcome to", "Today we\'re going to", "In this video", or any unanswered rhetorical question.',
        '',
        `=== OPENING STYLE ===`,
        openingStyle,
        '',
        '=== DIFFICULTY DOCTRINE ===',
        'Difficulty determines WHAT you cover, not just HOW you explain it.',
        difficultyDoctrine,
        '',
        '=== CONTENT PARAMETERS (planning inputs — do not narrate these) ===',
        `Topic: ${input.topic}`,
        `Difficulty tier: ${input.difficulty ?? 'general'}`,
        input.subject ? `Subject area: ${input.subject}` : '',
        '',
        'Choose the specific sub-aspect most appropriate for this difficulty tier.',
        'Do not drift into sub-aspects that belong to a different tier.',
        `Language: ${lang}. Tone: ${input.tone}.`,
        input.customPrompt ? `Additional instructions: ${input.customPrompt}` : '',
        '',
        // ── Length constraint repeated at the end to catch the model mid-generation
        `FINAL REMINDER — STRICT LIMIT: ${maxWords} words maximum for a ${durationSeconds}-second video.`,
        'Cut ruthlessly. Every sentence must earn its place. Stop writing when the limit is reached.',
        'Begin narrating now:',
      );
    }

    return lines.filter((l) => l !== undefined && l !== null).join('\n');
  }

  // ── Difficulty doctrine ───────────────────────────────────────────────────

  private buildDifficultyDoctrine(difficulty?: string): string {
    switch (difficulty) {
      case 'beginner':
        return [
          'BEGINNER: Cover what things ARE at their most fundamental level.',
          'Focus on definitions, basic terminology, and why this topic matters to a complete newcomer.',
          'Assume zero prior knowledge. No jargon without an immediate plain-language explanation.',
        ].join('\n');

      case 'intermediate':
        return [
          'INTERMEDIATE: Cover HOW things work mechanically.',
          'Go beyond definitions into strategies, positions, and instruments a practitioner would use.',
          'Assume the listener already knows the basics. Do NOT explain entry-level concepts.',
          'Introduce meaningful complexity: trade-offs, mechanics, cause-and-effect relationships.',
        ].join('\n');

      case 'advanced':
        return [
          'ADVANCED: Cover sophisticated mechanisms, edge cases, and professional-grade strategies.',
          'Assume solid intermediate knowledge. Speak to someone who already operates in this space.',
          'Focus on nuance: risk management, complex instruments, second-order effects, expert debates.',
          'Do not simplify. Precision and density are appropriate here.',
        ].join('\n');

      default:
        return 'Cover this topic in a clear, engaging way appropriate for a general audience.';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private estimateWordCount(durationSeconds: number, language: string): number {
    // Turkish natural speech is slightly slower than English
    const wordsPerSecond = language === 'tr' ? 2.2 : 2.5;
    return Math.round(durationSeconds * wordsPerSecond);
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  private truncateToWordLimit(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    // Truncate and end cleanly at the last sentence boundary if possible
    const truncated = words.slice(0, maxWords).join(' ');
    const lastPeriod = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
    );
    if (lastPeriod > truncated.length * 0.6) {
      return truncated.slice(0, lastPeriod + 1);
    }
    return truncated;
  }

  private pickOpeningStyle(topic: string, difficulty?: string): string {
    const seed = `${topic}::${difficulty ?? ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return OPENING_STYLES[hash % OPENING_STYLES.length];
  }
}
