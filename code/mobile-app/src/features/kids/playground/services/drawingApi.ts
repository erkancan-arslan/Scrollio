/**
 * Kids Drawing API Service
 */

import { kidsApi, KidsApiResponse, TIMEOUT_MS_LONG } from '../../shared/utils/api';

interface DrawingUploadResponse {
  id: string;
  title: string;
  xpEarned: number;
}

interface Drawing {
  id: string;
  title: string;
  image_data: string;
  created_at: string;
}

/** POST /api/v1/kids/playground/drawing */
export const uploadDrawing = async (
  drawingData: string,
  title?: string,
  contentId?: string,
): Promise<KidsApiResponse<DrawingUploadResponse>> => {
  return kidsApi.post<DrawingUploadResponse>('/kids/playground/drawing', {
    drawingData,
    title,
    contentId,
  });
};

/** GET /api/v1/kids/playground/drawings — custom endpoint we add */
export const getDrawings = async (): Promise<KidsApiResponse<Drawing[]>> => {
  return kidsApi.get<Drawing[]>('/kids/playground/characters');
};

export interface GenerateMentorResponse {
  characterImageUrl: string;
  drawingDescription: string;
}

/** POST /api/v1/kids/playground/generate-mentor — drawing → Pixar-style character via FAL */
export const generateMentor = async (
  imageBase64: string,
  childName?: string,
): Promise<KidsApiResponse<GenerateMentorResponse>> => {
  return kidsApi.post<GenerateMentorResponse>(
    '/kids/playground/generate-mentor',
    { imageBase64, childName },
    true,
    { timeoutMs: TIMEOUT_MS_LONG },
  );
};
