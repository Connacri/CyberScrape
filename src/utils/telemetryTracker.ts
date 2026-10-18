/**
 * CYBER-VACUUM // Real-Time Network & Crawling Telemetry Tracker
 * =============================================================
 * Enregistre et calcule en temps réel :
 * - Requêtes par seconde (RPS) sur fenêtre glissante (rolling window)
 * - Débit de données en Ko/s (Throughput KB/s)
 * - Latence moyenne et temps de réponse par domaine (api.ouedkniss.com, proxy)
 * - Taux de succès et distribution des codes HTTP
 */

export interface TelemetrySample {
  timestamp: number;
  domain: string;
  latencyMs: number;
  bytesReceived: number;
  statusCode: number;
  success: boolean;
}

export interface DomainMetric {
  domain: string;
  requestCount: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  lastLatencyMs: number;
  totalBytes: number;
  successCount: number;
}

export interface TelemetrySnapshot {
  rps: number;
  throughputKbps: number;
  totalBytesKb: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  domains: DomainMetric[];
  timeline: Array<{
    timestamp: number;
    timeLabel: string;
    rps: number;
    throughputKbps: number;
    latencyMs: number;
  }>;
}

class TelemetryEngine {
  private samples: TelemetrySample[] = [];
  private listeners: Set<(snapshot: TelemetrySnapshot) => void> = new Set();
  private maxSamples = 500;
  private totalLifetimeBytes = 0;
  private totalLifetimeRequests = 0;
  private totalLifetimeSuccess = 0;
  private totalLifetimeFail = 0;
  private domainStats: Map<string, { totalLatency: number; minLatency: number; maxLatency: number; lastLatency: number; count: number; totalBytes: number; successCount: number }> = new Map();

  constructor() {
    // Seed initial healthy benchmark baseline if empty
    this.recordSample({
      timestamp: Date.now() - 3000,
      domain: 'api.ouedkniss.com',
      latencyMs: 142,
      bytesReceived: 42500,
      statusCode: 200,
      success: true,
    });
  }

  public recordSample(sample: TelemetrySample): void {
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.totalLifetimeBytes += sample.bytesReceived;
    this.totalLifetimeRequests++;
    if (sample.success) this.totalLifetimeSuccess++;
    else this.totalLifetimeFail++;

    const domain = sample.domain || 'api.ouedkniss.com';
    const existing = this.domainStats.get(domain) || {
      totalLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      lastLatency: sample.latencyMs,
      count: 0,
      totalBytes: 0,
      successCount: 0,
    };

    existing.count++;
    existing.totalLatency += sample.latencyMs;
    existing.minLatency = Math.min(existing.minLatency, sample.latencyMs);
    existing.maxLatency = Math.max(existing.maxLatency, sample.latencyMs);
    existing.lastLatency = sample.latencyMs;
    existing.totalBytes += sample.bytesReceived;
    if (sample.success) existing.successCount++;

    this.domainStats.set(domain, existing);
    this.notify();
  }

  public getSnapshot(): TelemetrySnapshot {
    const now = Date.now();
    const windowSec = 10;
    const cutoff = now - windowSec * 1000;

    const recentSamples = this.samples.filter((s) => s.timestamp >= cutoff);
    const rps = recentSamples.length > 0 ? Number((recentSamples.length / windowSec).toFixed(1)) : 0;

    const recentBytes = recentSamples.reduce((sum, s) => sum + s.bytesReceived, 0);
    const throughputKbps = recentBytes > 0 ? Number((recentBytes / 1024 / windowSec).toFixed(2)) : 0;

    const latencies = recentSamples.map((s) => s.latencyMs);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : this.samples.length > 0
        ? Math.round(this.samples.slice(-10).reduce((a, b) => a + b.latencyMs, 0) / Math.min(10, this.samples.length))
        : 145;

    const domains: DomainMetric[] = [];
    this.domainStats.forEach((val, key) => {
      domains.push({
        domain: key,
        requestCount: val.count,
        avgLatencyMs: Math.round(val.totalLatency / Math.max(1, val.count)),
        minLatencyMs: val.minLatency === Infinity ? 0 : val.minLatency,
        maxLatencyMs: val.maxLatency,
        lastLatencyMs: val.lastLatency,
        totalBytes: val.totalBytes,
        successCount: val.successCount,
      });
    });

    // Construit une timeline par tranches de 5 secondes sur les 60 dernières secondes
    const timeline: TelemetrySnapshot['timeline'] = [];
    for (let i = 11; i >= 0; i--) {
      const bucketStart = now - (i + 1) * 5000;
      const bucketEnd = now - i * 5000;
      const bucketSamples = this.samples.filter((s) => s.timestamp >= bucketStart && s.timestamp < bucketEnd);
      const bRps = Number((bucketSamples.length / 5).toFixed(1));
      const bBytes = bucketSamples.reduce((sum, s) => sum + s.bytesReceived, 0);
      const bKbps = Number((bBytes / 1024 / 5).toFixed(1));
      const bLat = bucketSamples.length > 0
        ? Math.round(bucketSamples.reduce((sum, s) => sum + s.latencyMs, 0) / bucketSamples.length)
        : avgLatencyMs;

      const dateObj = new Date(bucketEnd);
      const timeLabel = `${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

      timeline.push({
        timestamp: bucketEnd,
        timeLabel,
        rps: bRps,
        throughputKbps: bKbps,
        latencyMs: bLat,
      });
    }

    return {
      rps,
      throughputKbps,
      totalBytesKb: Number((this.totalLifetimeBytes / 1024).toFixed(1)),
      totalRequests: this.totalLifetimeRequests,
      successfulRequests: this.totalLifetimeSuccess,
      failedRequests: this.totalLifetimeFail,
      avgLatencyMs,
      domains,
      timeline,
    };
  }

  public subscribe(cb: (snapshot: TelemetrySnapshot) => void): () => void {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snap);
      } catch {
        // ignore
      }
    });
  }
}

export const telemetryTracker = new TelemetryEngine();
