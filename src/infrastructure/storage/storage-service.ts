/**
 * StorageService is the single seam between the app and its persistence
 * layer. Every repository talks to data exclusively through this
 * interface, so the concrete adapter (localStorage today) can be
 * replaced by an ApiStorageService or CloudStorageService later without
 * touching repositories, hooks, or components.
 */
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  update<T>(key: string, updater: (current: T | null) => T): T;
  remove(key: string): void;
  clear(): void;
}

/**
 * Temporary mock-backend adapter. Reads/writes JSON-serialized data to
 * window.localStorage. Treat this as disposable infrastructure: nothing
 * outside this file should know it exists.
 */
export class LocalStorageService implements StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`StorageService.get failed for key "${key}"`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`StorageService.set failed for key "${key}"`, error);
    }
  }

  update<T>(key: string, updater: (current: T | null) => T): T {
    const next = updater(this.get<T>(key));
    this.set(key, next);
    return next;
  }

  remove(key: string): void {
    window.localStorage.removeItem(key);
  }

  clear(): void {
    window.localStorage.clear();
  }
}

/** Shared singleton instance used across all local repositories. */
export const storageService: StorageService = new LocalStorageService();
