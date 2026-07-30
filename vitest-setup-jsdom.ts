/**
 * Storage polyfill for jsdom environment in vitest 4.1.10
 * Detects when localStorage lacks standard Web Storage API methods and provides a working implementation.
 * Uses a Map-backed in-memory storage, no external jsdom dependency required.
 */

class StoragePolyfill implements Storage {
  private data = new Map<string, string>();
  private length = 0;

  key(index: number): string | null {
    if (index < 0 || index >= this.data.size) return null;
    return Array.from(this.data.keys())[index] || null;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (!this.data.has(key)) {
      this.length++;
    }
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    if (this.data.has(key)) {
      this.length--;
    }
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
    this.length = 0;
  }
}

// Apply polyfill only when localStorage lacks the clear() method (capability check, not URL)
if (typeof window !== 'undefined' && typeof globalThis.localStorage?.clear !== 'function') {
  const polyfill = new StoragePolyfill();
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}
