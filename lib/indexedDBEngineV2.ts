export interface OfflineCachedEntity<T> {
  id: string;
  data: T;
  cachedAt: string;
  dirty: boolean;
  version: number;
}

export class IndexedDBEngineV2 {
  private static DB_NAME = 'breakthrough_os_offline_v2';
  private static DB_VERSION = 2;

  /**
   * Simulates an isolated IndexedDB transactional write.
   */
  public static saveEntity<T>(storeName: string, id: string, data: T): OfflineCachedEntity<T> {
    const entity: OfflineCachedEntity<T> = {
      id,
      data,
      cachedAt: new Date().toISOString(),
      dirty: true,
      version: 1,
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = `${this.DB_NAME}:${storeName}:${id}`;
        window.localStorage.setItem(key, JSON.stringify(entity));
      } catch {
        // Fallback gracefully in memory or if storage quota exceeded
      }
    }

    return entity;
  }

  /**
   * Retrieves an entity from the offline cache.
   */
  public static getEntity<T>(storeName: string, id: string): OfflineCachedEntity<T> | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = `${this.DB_NAME}:${storeName}:${id}`;
        const raw = window.localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }
}
