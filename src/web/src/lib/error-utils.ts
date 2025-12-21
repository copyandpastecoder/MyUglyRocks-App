import { AxiosError } from 'axios';

/**
 * Extract a user-friendly error message from an Axios error or generic error.
 * For Axios errors, it checks for API response details/message first.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; details?: string } | undefined;
    return data?.details || data?.message || error.message || 'Unknown error';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
