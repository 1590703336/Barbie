const cache = new Map()
const DEFAULT_TTL = 60 * 1000 // 60 seconds

export const simpleCache = {
    /**
     * Get cached value or set it by calling the fetcher function.
     * Handles request deduplication and TTL-based expiration.
     * 
     * @param {string} key - Cache key
     * @param {() => Promise<any>} fetcher - Async function to fetch data
     * @param {AbortSignal|null} signal - Optional AbortSignal for cancellation
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise<any>}
     */
    async getOrSet(key, fetcher, signal = null, ttl = DEFAULT_TTL) {
        const cached = cache.get(key)

        if (cached) {
            // If there's an ongoing request, check if it was aborted
            if (cached.promise) {
                // Return the existing promise (request deduplication)
                return cached.promise
            }
            // Check if cached value is still valid
            if (Date.now() < cached.expiry) {
                return cached.value
            }
            // Expired, remove and proceed to fetch
            cache.delete(key)
        }

        // Create the fetch promise
        const promise = fetcher()
            .then((value) => {
                // Only cache if the request wasn't aborted
                if (!signal?.aborted) {
                    cache.set(key, {
                        value,
                        expiry: Date.now() + ttl,
                    })
                }
                return value
            })
            .catch((error) => {
                // Always remove the promise entry on failure
                cache.delete(key)
                throw error
            })

        // Store the promise for deduplication
        cache.set(key, { promise })

        return promise
    },

    /**
     * Delete a specific cache entry by key.
     * @param {string} key - Cache key to delete
     */
    delete(key) {
        cache.delete(key)
    },

    /**
     * Invalidate all cache entries whose keys match the given prefix.
     * More granular than clear() - only removes related cache entries.
     * 
     * @param {string} prefix - Key prefix to match (e.g., 'budget-' will match 'budget-summary-1-2026')
     */
    invalidateByPrefix(prefix) {
        for (const key of cache.keys()) {
            if (key.startsWith(prefix)) {
                cache.delete(key)
            }
        }
    },

    /**
     * Clear all cache entries.
     * Use sparingly - prefer invalidateByPrefix for targeted invalidation.
     */
    clear() {
        cache.clear()
    },

    /**
     * Get the number of cached entries (useful for debugging).
     * @returns {number}
     */
    size() {
        return cache.size
    },
}
