/**
 * Kids Drawing API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

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
