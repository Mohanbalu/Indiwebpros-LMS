export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export function extractErrorMessage(err: ApiError, fallback = "An unexpected error occurred"): string {
  return err.response?.data?.message || err.message || fallback;
}
