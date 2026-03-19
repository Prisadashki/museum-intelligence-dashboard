import {fetchJson, type FetchOptions} from './client';
import {rawMetObjectSchema, searchResponseSchema, departmentsResponseSchema} from './schemas';

export interface SearchParams {
    query: string;
    departmentId?: number;
    dateBegin?: number;
    dateEnd?: number;
    hasImages?: boolean;
    isHighlight?: boolean;
}

/**
 * Search for objects matching criteria. Returns only object IDs.
 *
 * Bypasses the request queue — search is a critical request that should
 * not be delayed by pending artwork fetches.
 *
 * Uses retryOn403 because the Met API returns 403 for rate limiting,
 * not for restricted access (unlike artwork endpoints).
 */
export async function searchObjects(params: SearchParams, options?: FetchOptions) {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.query);

    if (params.departmentId != null) {
        searchParams.set('departmentId', String(params.departmentId));
    }
    if (params.dateBegin != null) {
        searchParams.set('dateBegin', String(params.dateBegin));
    }
    if (params.dateEnd != null) {
        searchParams.set('dateEnd', String(params.dateEnd));
    }
    if (params.hasImages) {
        searchParams.set('hasImages', 'true');
    }
    if (params.isHighlight) {
        searchParams.set('isHighlight', 'true');
    }

    // Search can return 470K+ IDs — a large JSON payload that needs a longer timeout.
    return fetchJson(`/search?${searchParams.toString()}`, searchResponseSchema, {
        ...options,
        timeoutMs: 60_000,
        skipQueue: true,
        retryOn403: true,
    });
}

/**
 * Fetch a single object by ID.
 */
export async function getObject(id: number, options?: FetchOptions) {
    return fetchJson(`/objects/${id}`, rawMetObjectSchema, options);
}

/**
 * Fetch all departments. Small list, cache for a long time.
 * Bypasses the request queue — this is a critical, fast request that
 * should never be delayed by the queue of artwork fetches.
 *
 * Uses retryOn403 because the Met API returns 403 for rate limiting,
 * not for restricted access (unlike artwork endpoints).
 */
export async function getDepartments(options?: FetchOptions) {
    return fetchJson('/departments', departmentsResponseSchema, {
        ...options,
        skipQueue: true,
        retryOn403: true,
    });
}
