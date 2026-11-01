/**
 * NimbusPlay — Generic High-Performance Object Pool
 * Provides zero-allocation acquisition and reuse to prevent garbage collection frame drops.
 * Strictly typed with zero `any`.
 */

export class ObjectPool<T extends { alive: boolean }> {
  private pool: T[] = [];
  private factory: (index: number) => T;
  private resetFn: (item: T) => void;
  public activeCount = 0;

  constructor(size: number, factory: (index: number) => T, resetFn: (item: T) => void) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < size; i++) {
      const item = this.factory(i);
      item.alive = false;
      this.pool.push(item);
    }
  }

  public acquire(): T | null {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (!item.alive) {
        item.alive = true;
        this.resetFn(item);
        this.activeCount++;
        return item;
      }
    }
    return null;
  }

  public release(item: T): void {
    if (item.alive) {
      item.alive = false;
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  public forEachActive(callback: (item: T) => void): void {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (item.alive) {
        callback(item);
      }
    }
  }

  public getActiveItems(): T[] {
    const active: T[] = [];
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].alive) {
        active.push(this.pool[i]);
      }
    }
    return active;
  }

  public releaseAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].alive = false;
    }
    this.activeCount = 0;
  }
}
