import { Injectable, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';
import { UploadDrawingDto } from './dto';

const PIXAR_MENTOR_PROMPT = `Transform the attached hand-drawn character into a high-fidelity 3D mascot in authentic Pixar animation style. The final result should feel as if the character belongs inside a Pixar film universe, with warmth, charm, emotional clarity, and cinematic polish.

Treat the drawing as a strict blueprint. Carefully analyze the drawing before generating the 3D version and preserve the exact silhouette, proportions, shape language, and overall structure. Maintain the original color palette exactly as it appears in the drawing, without reinterpretation or stylistic recoloring. All distinctive details, including facial features, accessories, asymmetries, and unique marks, must remain faithful to the original design.

Identify whether the subject is an animal, human, object, or hybrid and recreate it using soft, rounded Pixar-style 3D geometry. The character should feature large, expressive Pixar-style eyes, subtle facial nuance, and a friendly, emotionally readable personality that matches the mood and intention of the original drawing.

All materials and textures must follow Pixar's stylized realism approach. Fur should appear soft and touchable, petals should feel velvety and layered, and skin should be smooth and matte with a handcrafted feel. Surfaces should look warm and premium, avoiding photorealism or plastic-like finishes while remaining believable and rich in detail.

Use Pixar-style cinematic studio lighting to bring the character to life. The lighting should be soft and flattering, similar to clamshell or butterfly lighting, with gentle global illumination and subtle rim light to separate the character from the background while maintaining a friendly, magical atmosphere.

Enhance the drawing with true 3D depth, soft shadows, and natural dimensionality while staying completely faithful to the original design. Pose the character in a joyful, welcoming, high-energy Pixar-style stance that reinforces personality without altering proportions or structure.

Render the final output as a professional Pixar-quality 3D character reveal with ultra-clean presentation and high detail. Use a simple, whimsical, softly blurred background so the mascot remains the clear focus. The final image should feel like a Pixar movie poster or character introduction, presented with cinematic polish and 8K-level clarity.`;

@Injectable()
export class KidsPlaygroundService {
  private readonly logger = new Logger(KidsPlaygroundService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload a drawing. Stores the base64 data and optional metadata.
   */
  async uploadDrawing(childId: string, dto: UploadDrawingDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data: drawing, error } = await admin
      .from('kids_drawings')
      .insert({
        child_profile_id: childId,
        title: dto.title ?? 'Untitled Drawing',
        image_data: dto.drawingData,
        content_id: dto.contentId ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`uploadDrawing error: ${error.message}`);
      throw new NotFoundException('Failed to save drawing');
    }

    // Award XP for drawing
    await this.addXp(admin, childId, 15);

    // Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'drawing_uploaded',
      metadata: { drawing_id: drawing.id, title: dto.title },
    });

    return { id: drawing.id, title: drawing.title, xpEarned: 15 };
  }

  /**
   * Get all drawings for a child.
   */
  async getDrawings(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_drawings')
      .select('id, title, image_data, created_at')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`getDrawings error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get a specific character for the child.
   */
  async getCharacter(childId: string, characterId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_characters')
      .select('*')
      .eq('id', characterId)
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Character not found');
    }

    return data;
  }

  /**
   * Get all characters for a child.
   */
  async getCharacters(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_characters')
      .select('*')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getCharacters error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Generate Pixar-style mentor character from drawing image via FAL image-to-image.
   */
  async generateMentor(
    _childId: string,
    imageBase64: string,
    _childName?: string,
  ): Promise<{ characterImageUrl: string; drawingDescription: string }> {
    const falKey = this.configService.get<string>('FAL_KEY');
    if (!falKey) {
      this.logger.warn('FAL_KEY not configured');
      throw new InternalServerErrorException('API key not configured');
    }
    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      throw new BadRequestException('imageBase64 is required');
    }
    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

    try {
      const { fal } = await import('@fal-ai/client');
      fal.config({ credentials: falKey });

      const result = await fal.subscribe('fal-ai/playground-v25/image-to-image', {
        input: {
          image_url: imageUrl,
          prompt: PIXAR_MENTOR_PROMPT,
          strength: 0.85,
          num_inference_steps: 28,
          format: 'png',
        },
      });

      const data = result.data as { images?: Array<{ url: string }> };
      const url = data?.images?.[0]?.url;
      if (!url) {
        this.logger.error('FAL response missing images[0].url');
        throw new InternalServerErrorException('Generation failed');
      }
      return {
        characterImageUrl: url,
        drawingDescription: 'Pixar-style 3D character transformation',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`generateMentor FAL error: ${message}`);
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException('Generation failed');
    }
  }

  /**
   * Placeholder for animation data — returns character with animation metadata.
   */
  async getAnimation(_childId: string, animationId: string) {
    // Animations are stored as metadata on characters for now
    const admin = this.supabaseService.getAdminClient();

    const { data } = await admin
      .from('kids_characters')
      .select('*')
      .eq('id', animationId)
      .maybeSingle();

    if (!data) {
      throw new NotFoundException('Animation not found');
    }

    return data;
  }

  private async addXp(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    xpAmount: number,
  ) {
    const { data: progress } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    let newXp = (progress.xp as number) + xpAmount;
    let level = progress.level as number;

    while (newXp >= level * 100) {
      newXp -= level * 100;
      level++;
    }

    await admin
      .from('kids_progress')
      .update({ xp: newXp, level, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);
  }
}
