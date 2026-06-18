interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private sweepInterval: ReturnType<typeof setInterval>;

  constructor(private maxSize = 500) {
    this.sweepInterval = setInterval(() => this.sweep(), 5 * 60 * 1000);
    // Don't let the periodic sweep keep the Node event loop alive. Otherwise
    // the `of` CLI prints its result and then hangs forever waiting on this
    // timer (the success path has no process.exit()). The long-lived MCP
    // server stays alive via its stdio transport, so unref is safe there too.
    this.sweepInterval.unref?.();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      // Evict oldest entry
      const first = this.store.keys().next().value;
      if (first !== undefined) this.store.delete(first);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate all cache entries whose key starts with the given prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Invalidate all cache entries.
   */
  invalidateAll(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /**
   * Remove all expired entries.
   */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  /**
   * Stop the periodic sweep and clear all entries.
   */
  destroy(): void {
    clearInterval(this.sweepInterval);
    this.store.clear();
  }
}
