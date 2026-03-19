import {ApiError} from '@/api/client';

/**
 * Type guard to check if error has a numeric status property.
 * This is more robust than `instanceof` which can fail in production builds
 * if the error crosses module boundaries or is serialized/deserialized.
 */
function hasHttpStatus(error: unknown): error is {status: number} {
    return (
        error !== null &&
        typeof error === 'object' &&
        'status' in error &&
        typeof (error as {status: unknown}).status === 'number'
    );
}

/**
 * Check if an error is a "skip-able" error (404 not found, 403 rate limited).
 * These errors mean the resource should be silently skipped in lists.
 */
export function isSkippableError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 404 || error.status === 403;
    }
    // Fallback: check for status property directly (handles production edge cases)
    if (hasHttpStatus(error)) {
        return error.status === 404 || error.status === 403;
    }
    return false;
}

/** Check if an error is a 404 Not Found */
export function isNotFoundError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 404;
    }
    return hasHttpStatus(error) && error.status === 404;
}

/** Check if an error is a 403 Forbidden */
export function isForbiddenError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 403;
    }
    return hasHttpStatus(error) && error.status === 403;
}
