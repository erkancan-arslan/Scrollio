/**
 * Kids Animation API Service
 * Handles character and animation retrieval
 */

/** GET /api/kids/characters/{id} */
export const getCharacter = async (
  id: string,
): Promise<{ data: null; error: null }> => {
  void id;
  return { data: null, error: null };
};

/** GET /api/kids/characters */
export const getCharacters = async (): Promise<{ data: null; error: null }> => {
  return { data: null, error: null };
};

/** GET /api/kids/animations/{id} */
export const getAnimation = async (
  id: string,
): Promise<{ data: null; error: null }> => {
  void id;
  return { data: null, error: null };
};
