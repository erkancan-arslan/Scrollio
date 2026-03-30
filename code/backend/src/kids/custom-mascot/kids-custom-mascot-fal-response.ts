/**
 * Normalize Fal responses — shapes differ by model.
 */

export function extractFirstImageUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const fromImages = d.images;
  if (Array.isArray(fromImages) && fromImages[0] && typeof fromImages[0] === 'object') {
    const u = (fromImages[0] as { url?: string }).url;
    if (typeof u === 'string' && u) return u;
  }

  const img = d.image;
  if (img && typeof img === 'object') {
    const u = (img as { url?: string }).url;
    if (typeof u === 'string' && u) return u;
  }

  if (typeof d.image_url === 'string' && d.image_url) {
    return d.image_url;
  }

  const output = d.output;
  if (output && typeof output === 'object') {
    return extractFirstImageUrl(output);
  }

  return null;
}

export function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const v = d.video;
  if (v && typeof v === 'object') {
    const u = (v as { url?: string }).url;
    if (typeof u === 'string' && u) return u;
  }

  if (typeof d.video_url === 'string' && d.video_url) {
    return d.video_url;
  }

  const output = d.output;
  if (output && typeof output === 'object') {
    return extractVideoUrl(output);
  }

  return null;
}
