import { ConfigService } from '@nestjs/config';

/**
 * Fal model IDs for the 48h drawing-video pipeline. Override via env if you change endpoints.
 *
 * The pipeline is intentionally short:
 *   1. `stylize`        — child drawing → 3D Pixar character image (also yields a public CDN URL).
 *   2. `imageToVideo`   — character image URL → short animated video.
 */
export function getDrawingVideoFalEndpoints(config: ConfigService) {
  return {
    stylize:
      config.get<string>('KIDS_DRAWING_VIDEO_FAL_STYLIZE') ??
      'fal-ai/nano-banana-pro/edit',
    imageToVideo:
      config.get<string>('KIDS_DRAWING_VIDEO_FAL_IMAGE_TO_VIDEO') ??
      'fal-ai/ltx-video-13b-distilled/image-to-video',
  };
}
