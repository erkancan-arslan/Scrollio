export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}
