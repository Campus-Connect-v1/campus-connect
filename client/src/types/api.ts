// Shared types for university API responses

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data?: T;
  message?: string;
}
