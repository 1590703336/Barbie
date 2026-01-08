const cache = new Map();
const DEFAULT_TTL = 60 * 1000; // 60 seconds

export const simpleCache = {
    get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            cache.delete(key);
            return null;
        }
        return item.value;
    },
    set: (key, value, ttl = DEFAULT_TTL) => {
        cache.set(key, {
            value,
            expiry: Date.now() + ttl,
        });
    },
    clear: () => {
        cache.clear();
    },
    delete: (key) => {
        cache.delete(key);
    }
};
