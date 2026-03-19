/**
 * Request queue with concurrency limiting and rate limit handling.
 * Prevents 403 errors from APIs that throttle parallel requests.
 */

type QueuedRequest<T> = {
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
};

// Met API allows 80 req/s. With 8 concurrent + 15ms delay we peak at ~53 req/s,
// well within limits while dramatically improving page load times.
const DELAY_BETWEEN_REQUESTS_MS = 15;
const MAX_CONCURRENT = 8;

class RequestQueue {
    private queue: QueuedRequest<unknown>[] = [];
    private activeCount = 0;
    private lastRequestTime = 0;

    async add<T>(execute: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({execute, resolve, reject} as QueuedRequest<unknown>);
            this.processQueue();
        });
    }

    /**
     * Clear all pending requests from the queue.
     * Use this when filters change to prevent old requests from blocking new ones.
     * Note: This only clears pending requests, not in-flight ones.
     */
    clear(): void {
        // Reject all pending requests with an abort error
        const pendingRequests = this.queue.splice(0, this.queue.length);
        for (const request of pendingRequests) {
            request.reject(new DOMException('Queue cleared', 'AbortError'));
        }
    }

    private async processQueue(): Promise<void> {
        if (this.activeCount >= MAX_CONCURRENT || this.queue.length === 0) {
            return;
        }

        const request = this.queue.shift();
        if (!request) return;

        // Add delay between requests to avoid rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < DELAY_BETWEEN_REQUESTS_MS) {
            await this.sleep(DELAY_BETWEEN_REQUESTS_MS - timeSinceLastRequest);
        }

        this.activeCount++;
        this.lastRequestTime = Date.now();

        try {
            const result = await request.execute();
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        } finally {
            this.activeCount--;
            this.processQueue();
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Global queue instance
export const requestQueue = new RequestQueue();
