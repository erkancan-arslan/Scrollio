import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { LessonService } from './lesson.service';
import { TeacherProfileService } from './teacher-profile.service';
import { TtsService } from '../admin/ai/tts.service';
import { LipsyncService } from '../admin/ai/lipsync.service';
import { BunnyCdnService } from '../bunnycdn/bunnycdn.service';

interface Slide {
  index: number;
  title: string;
  content: string;
  bulletPoints: string[];
  narrationText: string;
  audioUrl?: string;
  videoUrl?: string;
}

/** Slayt sayısı (LLM + TTS + lipsync adımları buna göre tekrarlanır) */
const TEACHER_LESSON_SLIDE_COUNT = 3;

@Injectable()
export class LessonOrchestratorService {
  private readonly logger = new Logger(LessonOrchestratorService.name);
  private readonly falKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
    private readonly lessonService: LessonService,
    private readonly profileService: TeacherProfileService,
    private readonly ttsService: TtsService,
    private readonly lipsyncService: LipsyncService,
    private readonly bunnyCdnService: BunnyCdnService,
  ) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  async run(lesson: any): Promise<void> {
    const lessonId = lesson.id;
    this.logger.log(`Starting lesson generation pipeline for ${lessonId}`);

    try {
      await this.lessonService.updateStatus(lessonId, 'processing', {
        current_step: 'slides',
        progress_percent: 5,
      });

      // 1) Generate slides via LLM
      const slides = await this.generateSlides(lesson);
      this.logger.log(`Generated ${slides.length} slides for lesson ${lessonId}`);

      await this.lessonService.updateStatus(lessonId, 'processing', {
        current_step: 'tts',
        progress_percent: 25,
      });

      // 2) TTS for each slide
      for (let i = 0; i < slides.length; i++) {
        try {
          const rawAudioUrl = await this.ttsService.generateSpeech(
            slides[i].narrationText,
            undefined,
            lesson.language || 'tr',
          );
          // Upload TTS audio to BunnyCDN for stable, long-lived URLs
          try {
            slides[i].audioUrl = await this.bunnyCdnService.uploadFromUrl(
              rawAudioUrl,
              `classroom-lessons/${lessonId}/audio-slide-${i}.mp4`,
              'audio/mp4',
            );
            this.logger.log(`Slide ${i} TTS uploaded to BunnyCDN: ${slides[i].audioUrl}`);
          } catch (cdnErr) {
            this.logger.warn(`BunnyCDN audio upload failed for slide ${i}, using raw URL: ${cdnErr}`);
            slides[i].audioUrl = rawAudioUrl;
          }
        } catch (err) {
          this.logger.warn(`TTS failed for slide ${i}: ${err}`);
          slides[i].audioUrl = undefined;
        }

        await this.lessonService.updateStatus(lessonId, 'processing', {
          progress_percent: 25 + Math.round(((i + 1) / slides.length) * 35),
        });
      }

      await this.lessonService.updateStatus(lessonId, 'processing', {
        current_step: 'lipsync',
        progress_percent: 60,
      });

      // 3) Lipsync for each slide (requires teacher reference video)
      const profile = await this.profileService.getProfile(lesson.teacher_id);
      const refVideoUrl = profile.reference_video_url;

      if (refVideoUrl) {
        for (let i = 0; i < slides.length; i++) {
          if (!slides[i].audioUrl) continue;
          try {
            const rawVideoUrl = await this.lipsyncService.generate(
              refVideoUrl,
              slides[i].audioUrl!,
            );
            // Upload lipsync video to BunnyCDN for stable, long-lived URLs
            try {
              slides[i].videoUrl = await this.bunnyCdnService.uploadFromUrl(
                rawVideoUrl,
                `classroom-lessons/${lessonId}/video-slide-${i}.mp4`,
              );
              this.logger.log(`Slide ${i} lipsync video uploaded to BunnyCDN: ${slides[i].videoUrl}`);
            } catch (cdnErr) {
              this.logger.warn(`BunnyCDN video upload failed for slide ${i}, using raw URL: ${cdnErr}`);
              slides[i].videoUrl = rawVideoUrl;
            }
          } catch (err) {
            this.logger.warn(`Lipsync failed for slide ${i}: ${err}`);
            slides[i].videoUrl = undefined;
          }

          await this.lessonService.updateStatus(lessonId, 'processing', {
            progress_percent: 60 + Math.round(((i + 1) / slides.length) * 30),
          });
        }
      } else {
        this.logger.warn('No reference video for teacher; skipping lipsync');
      }

      // 4) Save final slides_data and mark as published
      const totalDuration = slides.length * 30;

      await this.lessonService.updateStatus(lessonId, 'published', {
        slides_data: slides,
        duration: totalDuration,
        current_step: 'done',
        progress_percent: 100,
        error_message: null,
      });

      this.logger.log(`Lesson ${lessonId} generation complete`);
    } catch (err: any) {
      this.logger.error(`Lesson generation failed for ${lessonId}: ${err.message}`);
      await this.lessonService.updateStatus(lessonId, 'failed', {
        error_message: err.message || 'Unknown error',
        current_step: 'error',
      });
    }
  }

  private async generateSlides(lesson: any): Promise<Slide[]> {
    const slideCount = TEACHER_LESSON_SLIDE_COUNT;
    const prompt = this.buildSlidePrompt(lesson, slideCount);

    const response = await fetch('https://fal.run/fal-ai/any-llm', {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        prompt,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Slide generation LLM failed: ${response.status} – ${body}`);
    }

    const result = await response.json();
    const output = result.output || result.result || result.text || '';

    const slides = this.parseSlidesJson(output, slideCount);
    return slides;
  }

  private buildSlidePrompt(lesson: any, slideCount: number): string {
    const langLabel = lesson.language === 'tr' ? 'Turkish' : 'English';
    const parts = [
      `You are an expert ${lesson.subject || 'education'} teacher creating a lesson for grade ${lesson.grade || 'middle school'} students.`,
      `Create exactly ${slideCount} structured slides for the topic: "${lesson.topic}"`,
      lesson.description ? `Additional context: ${lesson.description}` : '',
      `Tone: ${lesson.tone || 'friendly'}`,
      `Difficulty: ${lesson.difficulty || 'medium'}`,
      `Language: ${langLabel}`,
      '',
      'For each slide, output a JSON array where each element has:',
      '- "index": slide number (0-based)',
      '- "title": short slide title',
      '- "content": slide body text (can include KaTeX math like $x^2$)',
      '- "bulletPoints": array of 2-4 bullet point strings',
      '- "narrationText": spoken narration text for this slide (NO LaTeX, plain spoken language)',
      '',
      `Output ONLY valid JSON array of ${slideCount} objects. No markdown fences, no explanation.`,
    ];

    if (lesson.includes_problem_solving && lesson.problem_count > 0) {
      parts.push(
        `The last ${lesson.problem_count} slide(s) should be practice problems with step-by-step solutions in the narration.`,
      );
    }

    return parts.filter(Boolean).join('\n');
  }

  private parseSlidesJson(raw: string, expectedCount: number): Slide[] {
    let cleaned = raw.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '');
    }

    const mapSlides = (parsed: any[]): Slide[] =>
      parsed.slice(0, expectedCount).map((s: any, i: number) => ({
        index: s.index ?? i,
        title: s.title || `Slide ${i + 1}`,
        content: s.content || '',
        bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [],
        narrationText: s.narrationText || s.narration_text || s.narration || '',
      }));

    // Attempt 1: parse as-is (LLM already emits correctly escaped JSON)
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return mapSlides(parsed);
    } catch { /* fall through */ }

    // Attempt 2: fix bare single backslashes the LLM forgot to escape
    // e.g. "\frac" → "\\frac". The lookahead preserves valid JSON escapes
    // like \\, \", \n, \t, \r, \b, \f, \uXXXX.
    try {
      const fixed = cleaned.replace(/\\(?!["\\/bfnrtu0-9])/g, '\\\\');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return mapSlides(parsed);
    } catch { /* fall through */ }

    this.logger.warn('Failed to parse slides JSON, creating fallback');
    return [
      {
        index: 0,
        title: 'Introduction',
        content: raw.slice(0, 500),
        bulletPoints: [],
        narrationText: raw.slice(0, 300),
      },
    ];
  }
}
