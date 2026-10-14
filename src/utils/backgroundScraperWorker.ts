/**
 * Background Web Worker Engine
 * Keeps the scraping process running at ultra-high speed and smooth 60fps
 * even when the tab is minimized, reduced to background, or screen is locked.
 */

export interface BackgroundWorkerMessage {
  type: 'TICK' | 'STATUS';
  timestamp: number;
}

export class BackgroundScraperEngine {
  private worker: Worker | null = null;
  private onTickCallback: (() => void) | null = null;
  private isRunning: boolean = false;
  private fallbackInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;

    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.action === 'start') {
            const intervalMs = e.data.intervalMs || 350;
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              self.postMessage({ type: 'TICK', timestamp: Date.now() });
            }, intervalMs);
          } else if (e.data.action === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          } else if (e.data.action === 'setInterval') {
            const intervalMs = e.data.intervalMs || 350;
            if (timer) {
              clearInterval(timer);
              timer = setInterval(() => {
                self.postMessage({ type: 'TICK', timestamp: Date.now() });
              }, intervalMs);
            }
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent<BackgroundWorkerMessage>) => {
        if (e.data.type === 'TICK' && this.onTickCallback && this.isRunning) {
          this.onTickCallback();
        }
      };
    } catch (err) {
      console.warn('[BackgroundWorker] Fallback to main thread timer:', err);
    }
  }

  public start(onTick: () => void, intervalMs: number = 350) {
    this.onTickCallback = onTick;
    this.isRunning = true;

    if (this.worker) {
      this.worker.postMessage({ action: 'start', intervalMs });
    } else {
      if (this.fallbackInterval) clearInterval(this.fallbackInterval);
      this.fallbackInterval = setInterval(() => {
        if (this.onTickCallback && this.isRunning) {
          this.onTickCallback();
        }
      }, intervalMs);
    }
  }

  public updateInterval(intervalMs: number) {
    if (this.worker && this.isRunning) {
      this.worker.postMessage({ action: 'setInterval', intervalMs });
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const backgroundScraper = new BackgroundScraperEngine();
