const cache = new Map();
const DEFAULT_TTL = 60 * 1000; // 60 seconds

export const simpleCache = {
    async getOrSet(key, fetcher, ttl = DEFAULT_TTL) {
        const cached = cache.get(key);

        if (cached) {
            if (cached.promise) return cached.promise;
            if (Date.now() < cached.expiry) return cached.value;
            cache.delete(key);
        }

        const promise = fetcher()
            .then((value) => {
                cache.set(key, {
                    value,
                    expiry: Date.now() + ttl,
                });
                return value;
            })
            .catch((error) => {
                // If it fails, remove the promise from cache so it can be retried
                cache.delete(key);
                throw error;
            });

        cache.set(key, { promise });
        return promise;
    },

    delete(key) {
        cache.delete(key);
    },

    clear() {
        cache.clear();
    },
};
