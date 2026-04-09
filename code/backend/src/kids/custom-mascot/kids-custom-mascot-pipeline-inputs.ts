/**
 * Fal request bodies per step. Image URLs are injected at runtime; all other fields match your API.
 *
 * Pipeline: 2D drawing → 3D image → reframe → upscale → image-to-video → (ffmpeg) video+audio.
 */

import { LTX_IMAGE_TO_VIDEO_PROMPT, PIXAR_MENTOR_PROMPT } from './kids-custom-mascot.constants';

/** Step 1: 2D drawing (data URL) → 3D-style mascot image. */
export function buildModel3dInput(imageBase64DataUrl: string): Record<string, unknown> {
  return {
    prompt: PIXAR_MENTOR_PROMPT,
    image_urls: [imageBase64DataUrl],
  };
}

/** Step 2: `fal-ai/image-editing/reframe` */
export function buildReframerInput(imageUrl: string): Record<string, unknown> {
  return {
    image_url: imageUrl,
    guidance_scale: 3.5,
    num_inference_steps: 30,
    safety_tolerance: '2',
    output_format: 'jpeg',
    aspect_ratio: '9:16',
  };
}

/** Step 3: `fal-ai/seedvr/upscale/image` */
export function buildUpscalerInput(imageUrl: string): Record<string, unknown> {
  return {
    image_url: imageUrl,
    upscale_mode: 'factor',
    upscale_factor: 2,
    target_resolution: '1080p',
    noise_scale: 0.1,
    output_format: 'jpg',
  };
}

/** Step 4: `fal-ai/ltx-video-13b-distilled/image-to-video`
 * 65 frames @ 24fps ≈ 2.7s — sufficient for mascot intro, generates ~2× faster than 121 frames.
 * Keep resolution at 480p to avoid GPU OOM and long queue times on Fal.
 */
export function buildImageToVideoInput(imageUrl: string): Record<string, unknown> {
  return {
    loras: [],
    prompt: LTX_IMAGE_TO_VIDEO_PROMPT,
    image_url: imageUrl,
    frame_rate: 24,
    resolution: '480p',
    aspect_ratio: '9:16',
    expand_prompt: false,
    reverse_video: false,
    negative_prompt: 'worst quality, inconsistent motion, blurry, jittery, distorted',
    number_of_frames: 65,
    constant_rate_factor: 35,
    enable_safety_checker: true,
    first_pass_number_of_steps: 8,
    first_pass_skip_final_steps: 1,
    second_pass_number_of_steps: 8,
    second_pass_skip_initial_steps: 5,
  };
}
