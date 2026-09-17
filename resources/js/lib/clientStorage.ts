/**
 * Lightweight Client Storage Helper with Auto-Expiry & Garbage Collection.
 * Designed for PWAs: Zero-dependencies, ultra-fast, prevents storage clutter and lag.
 */

const STORAGE_PREFIX = 'cm_pref_';
const LAST_CLEANUP_KEY = 'cm_last_storage_cleanup';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Run cleanup once per day
const DEFAULT_TTL_DAYS = 7; // Items expire after 7 days if not updated

interface StorageItem<T> {
    value: T;
    expiresAt: number;
}

/**
 * Perform garbage collection of expired items.
 * Runs at most once per day, takes < 1 millisecond.
 */
export function cleanupStorage(): void {
    if (typeof window === 'undefined') return;

    try {
        const now = Date.now();
        const lastCleanup = Number(localStorage.getItem(LAST_CLEANUP_KEY) || 0);

        // Run only if 24 hours have passed since last cleanup
        if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
            return;
        }

        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed: StorageItem<any> = JSON.parse(raw);
                        if (parsed.expiresAt && now > parsed.expiresAt) {
                            keysToRemove.push(key);
                        }
                    }
                } catch {
                    // Corrupted item, clean it up
                    keysToRemove.push(key);
                }
            }
        }

        // Remove expired keys
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        localStorage.setItem(LAST_CLEANUP_KEY, String(now));
    } catch {
        // Storage might be restricted / private mode
    }
}

/**
 * Save preference with TTL (Time To Live in days).
 */
export function setClientPref<T>(key: string, value: T, ttlDays: number = DEFAULT_TTL_DAYS): void {
    if (typeof window === 'undefined') return;

    try {
        const expiresAt = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
        const payload: StorageItem<T> = { value, expiresAt };
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload));
    } catch {
        // Silent catch for private browsing or quota limits
    }
}

/**
 * Get preference value. Automatically removes expired item.
 */
export function getClientPref<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;

    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) return defaultValue;

        const parsed: StorageItem<T> = JSON.parse(raw);
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            localStorage.removeItem(STORAGE_PREFIX + key);
            return defaultValue;
        }

        return parsed.value !== undefined ? parsed.value : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Remove specific preference.
 */
export function removeClientPref(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
        // Silent catch
    }
}
