import {
  LTX_IMAGE_TO_VIDEO_PROMPT,
  PIXAR_MENTOR_PROMPT,
} from '../custom-mascot/kids-custom-mascot.constants';

/** Step 1: drawing (URL or data URL) → 3D Pixar-style character image. */
export function buildStylizeInput(imageUrlOrDataUrl: string): Record<string, unknown> {
  return {
    prompt: PIXAR_MENTOR_PROMPT,
    image_urls: [imageUrlOrDataUrl],
  };
}

/** Step 2: stylized character → short animated talking video. */
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
