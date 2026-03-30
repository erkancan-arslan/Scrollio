import { ConfigService } from '@nestjs/config';

/**
 * Fal model IDs per pipeline step. Override via env only if you change endpoints.
 */
export function getMascotFalEndpoints(config: ConfigService) {
  return {
    /** 2D drawing → 3D-style image */
    model3d: config.get<string>('KIDS_MASCOT_FAL_MODEL_3D') ?? 'fal-ai/nano-banana-pro/edit',
    /** Reframe to 9:16 */
    reframer: config.get<string>('KIDS_MASCOT_FAL_REFRAMER') ?? 'fal-ai/image-editing/reframe',
    /** SeedVR upscale */
    upscaler: config.get<string>('KIDS_MASCOT_FAL_UPSCALER') ?? 'fal-ai/seedvr/upscale/image',
    /** LTX image → video */
    imageToVideo: config.get<string>('KIDS_MASCOT_FAL_IMAGE_TO_VIDEO') ?? 'fal-ai/ltx-video-13b-distilled/image-to-video',
  };
}
