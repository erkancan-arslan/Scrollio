/**
 * Scrollio mentor generation — server-side pipeline (Fal.ai + optional Supabase).
 *
 * Use from Next.js Route Handlers, Express, or any Node runtime with `FAL_KEY`.
 * Do not import this file from React Native client bundles (keys must stay on the server).
 *
 * Peer deps: `@fal-ai/client`, `@supabase/supabase-js` (optional if you omit supabase).
 */

import { fal } from "@fal-ai/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DRAWING_DESCRIPTION = "Pixar-style 3D character transformation";

/** Same prompt as the landing app — image-to-image via fal-ai/nano-banana-pro/edit */
export const PIXAR_MENTOR_PROMPT = `Transform the attached hand-drawn character into a high-fidelity 3D mascot in authentic Pixar animation style. The final result should feel as if the character belongs inside a Pixar film universe, with warmth, charm, emotional clarity, and cinematic polish.

Treat the drawing as a strict blueprint. Carefully analyze the drawing before generating the 3D version and preserve the exact silhouette, proportions, shape language, and overall structure. Maintain the original color palette exactly as it appears in the drawing, without reinterpretation or stylistic recoloring. All distinctive details, including facial features, accessories, asymmetries, and unique marks, must remain faithful to the original design.

Identify whether the subject is an animal, human, object, or hybrid and recreate it using soft, rounded Pixar-style 3D geometry. The character should feature large, expressive Pixar-style eyes, subtle facial nuance, and a friendly, emotionally readable personality that matches the mood and intention of the original drawing.

All materials and textures must follow Pixar's stylized realism approach. Fur should appear soft and touchable, petals should feel velvety and layered, and skin should be smooth and matte with a handcrafted feel. Surfaces should look warm and premium, avoiding photorealism or plastic-like finishes while remaining believable and rich in detail.

Use Pixar-style cinematic studio lighting to bring the character to life. The lighting should be soft and flattering, similar to clamshell or butterfly lighting, with gentle global illumination and subtle rim light to separate the character from the background while maintaining a friendly, magical atmosphere.

Enhance the drawing with true 3D depth, soft shadows, and natural dimensionality while staying completely faithful to the original design. Pose the character in a joyful, welcoming, high-energy Pixar-style stance that reinforces personality without altering proportions or structure.

Render the final output as a professional Pixar-quality 3D character reveal with ultra-clean presentation and high detail. Use a simple, whimsical, softly blurred background so the mascot remains the clear focus. The final image should feel like a Pixar movie poster or character introduction, presented with cinematic polish and 8K-level clarity.`;

export function mentorVideoPrompt(learningTopic: string): string {
  return `A cute animated mentor character teaching a child about ${learningTopic}. The character is friendly, gently animated, making small movements, looking at the viewer warmly. Educational children's video style, colorful background, engaging, fun learning moment.`;
}

export type GeneratePipelineInput = {
  imageBase64?: string;
  characterImageUrl?: string;
  learningPrompt?: string;
  generateVideo?: boolean;
  /** Optional — stored in Supabase when provided */
  email?: string | null;
  childName?: string | null;
};

export type GeneratePipelineSuccess = {
  success: true;
  drawingDescription?: string;
  characterImageUrl?: string | null;
  videoUrl?: string | null;
};

function logVideoError(videoError: unknown): void {
  console.error("Video generation failed:", videoError);
  if (videoError && typeof videoError === "object") {
    if ("body" in videoError) {
      console.error("Video error body:", JSON.stringify((videoError as { body: unknown }).body, null, 2));
    }
    if ("status" in videoError) {
      console.error("Video error status:", (videoError as { status: number }).status);
    }
    if ("message" in videoError) {
      console.error("Video error message:", (videoError as { message: string }).message);
    }
  }
}

/**
 * Runs Fal image-to-image (mentor) and optionally Sora image-to-video.
 * Configures `fal` with the given API key for this request.
 */
export async function runGeneratePipeline(
  input: GeneratePipelineInput,
  options: {
    falKey: string;
    supabase: SupabaseClient | null;
  }
): Promise<GeneratePipelineSuccess> {
  const { falKey, supabase } = options;

  fal.config({ credentials: falKey });

  const {
    imageBase64,
    characterImageUrl,
    learningPrompt,
    generateVideo,
    email,
    childName,
  } = input;

  // ── Video-only (existing character URL) ─────────────────
  if (characterImageUrl && generateVideo) {
    if (!learningPrompt?.trim()) {
      throw new Error("learningPrompt is required for video generation");
    }
    try {
      const videoResult = await fal.subscribe("fal-ai/sora-2/image-to-video", {
        input: {
          prompt: mentorVideoPrompt(learningPrompt.trim()),
          image_url: characterImageUrl,
        },
      });
      const videoUrl = (videoResult.data as { video?: { url: string } })?.video?.url ?? null;
      return { success: true, videoUrl };
    } catch (videoError: unknown) {
      logVideoError(videoError);
      const errorDetails = videoError instanceof Error ? videoError.message : String(videoError);
      throw new Error(`Video generation failed: ${errorDetails}`);
    }
  }

  // ── Mentor image from drawing ───────────────────────────
  if (!imageBase64) {
    throw new Error("Image is required");
  }

  const imageResult = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
    input: {
      prompt: PIXAR_MENTOR_PROMPT,
      image_urls: [imageBase64],
    },
  });

  const generatedImageUrl =
    (imageResult.data as { images?: Array<{ url: string }> })?.images?.[0]?.url ?? null;

  if (supabase && generatedImageUrl) {
    try {
      const { error: dbError } = await supabase.from("drawings").insert({
        original_drawing: imageBase64,
        mentor_image_url: generatedImageUrl,
        drawing_description: DRAWING_DESCRIPTION,
        user_email: email ?? null,
        child_name: childName ?? null,
        created_at: new Date().toISOString(),
      });
      if (dbError) console.error("Supabase save error:", dbError);
    } catch (saveError) {
      console.error("Error saving to Supabase:", saveError);
    }
  }

  let videoUrl: string | null = null;
  if (generateVideo && learningPrompt?.trim() && generatedImageUrl) {
    try {
      const videoResult = await fal.subscribe("fal-ai/sora-2/image-to-video", {
        input: {
          prompt: mentorVideoPrompt(learningPrompt.trim()),
          image_url: generatedImageUrl,
        },
      });
      videoUrl = (videoResult.data as { video?: { url: string } })?.video?.url ?? null;
    } catch (videoError: unknown) {
      logVideoError(videoError);
    }
  }

  return {
    success: true,
    drawingDescription: DRAWING_DESCRIPTION,
    characterImageUrl: generatedImageUrl,
    videoUrl,
  };
}
