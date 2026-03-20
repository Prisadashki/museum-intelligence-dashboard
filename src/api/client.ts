import type {ZodType} from 'zod';
import {API_BASE_URL} from '@/utils/constants';
import {requestQueue} from './requestQueue';

export class ApiError extends Error {
    readonly status: number;
    readonly url: string;

    constructor(message: string, status: number, url: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.url = url;
    }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay for retries (1 second)
const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchOptions {
    /** AbortSignal from React Query — allows cancellation when queries are invalidated. */
    signal?: AbortSignal;
    /** Request timeout in ms. Defaults to 10s for object fetches, use 60s for large search responses. */
    timeoutMs?: number;
    /** If true, bypass the request queue entirely. Use for small, critical requests (e.g. departments). */
    skipQueue?: boolean;
    /** If true, retry on 403 errors (rate limiting). Use for endpoints where 403 means rate-limited, not restricted. */
    retryOn403?: boolean;
}

/**
 * Fetches JSON from the Met API and validates the response with a Zod schema.
 * Includes retry logic for server errors (5xx), and optionally 403 (rate limiting).
 * Uses a request queue to limit concurrent requests.
 *
 * Note: 404 errors are never retried — they're definitive "not found" responses.
 * 403 errors are only retried if `retryOn403: true` (for endpoints like departments
 * where 403 means rate-limited, not "restricted artwork").
 *
 * Pass `options.signal` (from React Query's queryFn context) to enable
 * automatic cancellation when the user changes filters or navigates away.
 */
export async function fetchJson<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodType requires these generics
    schema: ZodType<T, any, any>,
    options?: FetchOptions,
): Promise<T> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retryOn403 = options?.retryOn403 ?? false;
    if (options?.skipQueue) {
        return fetchWithRetry(path, schema, options?.signal, timeoutMs, retryOn403);
    }
    return requestQueue.add(() => fetchWithRetry(path, schema, options?.signal, timeoutMs, retryOn403));
}

async function fetchWithRetry<T>(
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: ZodType<T, any, any>,
    externalSignal: AbortSignal | undefined,
    timeoutMs: number,
    retryOn403: boolean,
    attempt: number = 0,
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    // Combine timeout + external cancellation signal.
    // If the external signal fires (e.g. React Query cancels), the fetch aborts immediately.
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const signal = externalSignal
        ? AbortSignal.any([timeoutController.signal, externalSignal])
        : timeoutController.signal;

    try {
        // Bail early if already cancelled before we even start the fetch
        if (externalSignal?.aborted) {
            throw new DOMException('Query cancelled', 'AbortError');
        }

        const response = await fetch(url, {signal});

        // Retry on server errors (5xx) — these are transient.
        // Retry on 403 ONLY if retryOn403 is true (for rate-limited endpoints like departments).
        // Never retry 404 — those are definitive "not found" responses.
        const isServerError = response.status >= 500;
        const isRateLimited = response.status === 403 && retryOn403;
        const shouldRetry = (isServerError || isRateLimited) && attempt < MAX_RETRIES;

        if (shouldRetry) {
            clearTimeout(timeoutId);
            const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
            // Use abortable sleep so we can cancel during the delay
            await abortableSleep(delay, externalSignal);
            return fetchWithRetry(path, schema, externalSignal, timeoutMs, retryOn403, attempt + 1);
        }

        if (!response.ok) {
            throw new ApiError(`API request failed: ${response.status} ${response.statusText}`, response.status, url);
        }

        const data: unknown = await response.json();
        return schema.parse(data);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof DOMException && error.name === 'AbortError') {
            // Distinguish timeout from external cancellation
            if (externalSignal?.aborted) {
                throw error; // Let React Query handle cancellation silently
            }
            throw new ApiError('Request timed out', 408, url);
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Sleep that can be cancelled via AbortSignal.
 * Throws AbortError if the signal is aborted during sleep.
 */
function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if already aborted
        if (signal?.aborted) {
            reject(new DOMException('Query cancelled', 'AbortError'));
            return;
        }

        const timeoutId = setTimeout(resolve, ms);

        // Listen for abort during sleep
        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(new DOMException('Query cancelled', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort, {once: true});

        // Clean up the event listener when timeout completes
        setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
        }, ms);
    });
}
