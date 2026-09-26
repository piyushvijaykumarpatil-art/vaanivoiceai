/**
 * Mutex lock implementation to serialize asynchronous operations (e.g. disk writes).
 */
export class Mutex {
  private mutex = Promise.resolve();

  lock(): Promise<() => void> {
    let unlock: () => void = () => {};
    const nextMutex = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const currentMutex = this.mutex;
    this.mutex = currentMutex.then(() => nextMutex);
    return currentMutex.then(() => unlock);
  }

  async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
    const unlock = await this.lock();
    try {
      return await callback();
    } finally {
      unlock();
    }
  }
}

export const dbMutex = new Mutex();
