import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Type guard to check if a value is an object with a 'message' property.
 */
const isErrorWithMessage = (
  error: unknown
): error is { message: string } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
};

/**
 * Type guard to check if an error is an Axios-like error with response data.
 */
const isAxiosError = (
  error: unknown
): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

/**
 * Extracts a user-friendly error message from an unknown error type.
 * @param error The error object.
 * @param defaultMessage The default message to return if no specific message can be found.
 * @returns A string containing the error message.
 */
export const getErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return defaultMessage;
};

