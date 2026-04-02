// types/api.d.ts
export interface ApiValidationErrors {
  [key: string]: string;
}

export interface ApiErrorResponse {
  errors?: ApiValidationErrors;
  error?: string;
  message?: string;
}

export interface ApiSuccessResponse<T> {
  message: string;
  data?: T;
}
