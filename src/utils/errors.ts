import {ApiError} from '@/api/client';

/**
 * Check if an error is a "skip-able" error (404 not found, 403 rate limited).
 * These errors mean the resource should be silently skipped in lists.
 */
export function isSkippableError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 404 || error.status === 403;
    }
    return false;
}

/** Check if an error is a 404 Not Found */
export function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}

/** Check if an error is a 403 Forbidden */
export function isForbiddenError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 403;
}
