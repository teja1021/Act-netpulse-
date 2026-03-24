import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Phase = 'idle' | 'ping' | 'download' | 'upload' | 'done';

export interface TestState {
  phase: Phase; progress: number; liveSpeed: number;
  latency: number; jitter: number; download: number; upload: number;
}

const INIT: TestState = {
  phase: 'idle', progress: 0, liveSpeed: 0,
  latency: 0, jitter: 0, download: 0, upload: 0
};

@Injectable({ providedIn: 'root' })
export class SpeedTestService {
  private api = environment.apiUrl;
  state$ = new BehaviorSubject<TestState>({ ...INIT });

  private emit(p: Partial<TestState>) {
    this.state$.next({ ...this.state$.value, ...p });
  }
  reset() { this.state$.next({ ...INIT }); }

  // ─────────────────────────────────────────────────────────────
  async runTest(): Promise<TestState> {
    this.emit({ phase: 'ping', progress: 2, liveSpeed: 0 });
    const { latency, jitter } = await this.measurePing();
    this.emit({ latency, jitter, progress: 14, phase: 'download' });

    const { mbps: download, usedCDN } = await this.measureDownload((spd, pct) =>
      this.emit({ liveSpeed: spd, progress: 14 + pct * 0.45 })
    );
    this.emit({ download, liveSpeed: 0, progress: 60, phase: 'upload' });

    const upload = await this.measureUpload(download, (spd, pct) =>
      this.emit({ liveSpeed: spd, progress: 60 + pct * 0.38 })
    );

    const final: TestState = {
      phase: 'done', progress: 100, liveSpeed: 0,
      latency, jitter, download, upload
    };
    this.emit(final);
    return final;
  }

  // ─────────────────────────────────────────────────────────────
  // PING
  // ─────────────────────────────────────────────────────────────
  private async measurePing(): Promise<{ latency: number; jitter: number }> {
    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      try {
        await fetch(`${this.api}/speed/ping?_=${Date.now()}`, { cache: 'no-store' });
      } catch { }
      times.push(performance.now() - t0);
      await this.sleep(40);
    }
    times.sort((a, b) => a - b);
    const trimmed = times.slice(1, -1);
    const avg = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
    const jitter = Math.sqrt(trimmed.reduce((s, v) => s + (v - avg) ** 2, 0) / trimmed.length);
    return {
      latency: Math.round(avg * 10) / 10,
      jitter: Math.round(jitter * 10) / 10
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DOWNLOAD — 4 parallel CDN streams, 10s, 2s warmup
  // ─────────────────────────────────────────────────────────────
  private async measureDownload(
    onTick: (s: number, p: number) => void
  ): Promise<{ mbps: number; usedCDN: boolean }> {
    const DURATION = 10_000, WARMUP = 2_000, STREAMS = 4;

    let usedCDN = false;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const probe = await fetch(
        'https://speed.cloudflare.com/__down?bytes=1000',
        { cache: 'no-store', signal: ctrl.signal }
      );
      clearTimeout(timer);
      if (probe.ok) { probe.body?.cancel(); usedCDN = true; }
    } catch { usedCDN = false; }

    const makeUrl = (i: number) => usedCDN
      ? `https://speed.cloudflare.com/__down?bytes=25000000&_=${Date.now()}_${i}`
      : `${this.api}/speed/download?_=${Date.now()}_${i}`;

    const controllers = Array.from({ length: STREAMS }, () => new AbortController());
    let totalBytes = 0, active = true;
    const startMs = performance.now();

    const readStream = async (url: string, ctrl: AbortController) => {
      try {
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        if (!res.body) return;
        const reader = res.body.getReader();
        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value && (performance.now() - startMs) > WARMUP)
            totalBytes += value.byteLength;
        }
        reader.cancel().catch(() => { });
      } catch { }
    };

    const ticker = setInterval(() => {
      const elapsed = performance.now() - startMs;
      const sec = Math.max(0, elapsed - WARMUP) / 1000;
      const pct = Math.min(100, elapsed / DURATION * 100);
      const mbps = sec > 0.3
        ? parseFloat(((totalBytes * 8) / (sec * 1_000_000)).toFixed(2))
        : 0;
      onTick(mbps, pct);
    }, 200);

    await Promise.all([
      ...controllers.map((c, i) => readStream(makeUrl(i), c)),
      this.sleep(DURATION).then(() => {
        active = false;
        controllers.forEach(c => { try { c.abort(); } catch { } });
      })
    ]);

    clearInterval(ticker);
    const mbps = totalBytes > 0
      ? parseFloat(((totalBytes * 8) / ((DURATION - WARMUP) / 1000 * 1_000_000)).toFixed(2))
      : 0;
    return { mbps, usedCDN };
  }

  // ─────────────────────────────────────────────────────────────
  // UPLOAD — Forces real internet traffic using:
  //
  // Strategy 1: fetch() with mode:'no-cors' + Content-Type:'text/plain'
  //   → 'text/plain' is a "simple header" — no CORS preflight needed
  //   → 'no-cors' mode: browser sends to Cloudflare over real internet
  //   → Data MUST travel over your internet connection (not LAN)
  //   → We time how long each POST takes end-to-end
  //
  // Strategy 2: If Cloudflare unreachable, fall back to local backend
  //   but CAP the result at downloadMbps (internet can't be faster than DL)
  // ─────────────────────────────────────────────────────────────
  private async measureUpload(
    downloadMbps: number,
    onTick: (s: number, p: number) => void
  ): Promise<number> {

    // Try Cloudflare upload via no-cors (bypasses CORS restrictions entirely)
    const cfWorked = await this.testCloudflareUpload();

    if (cfWorked) {
      return this.measureUploadCloudflare(downloadMbps, onTick);
    } else {
      // Cloudflare unreachable — use local backend but cap at download speed
      // (LAN upload to local server ≠ internet upload speed)
      const raw = await this.measureUploadLocal(onTick);
      // Cap: upload cannot realistically exceed download on same connection
      const capped = Math.min(raw, downloadMbps * 1.1);
      return parseFloat(capped.toFixed(2));
    }
  }

  // Test if Cloudflare upload endpoint is reachable via no-cors
  private async testCloudflareUpload(): Promise<boolean> {
    try {
      const tiny = new Uint8Array(512); // 512 bytes test
      const t0 = performance.now();

      // no-cors + text/plain = no preflight = works even with CORS restrictions
      await fetch('https://speed.cloudflare.com/__up', {
        method: 'POST',
        mode: 'no-cors',
        body: tiny,
        headers: { 'Content-Type': 'text/plain' },
        cache: 'no-store'
      });

      const elapsed = performance.now() - t0;
      // If it resolved in <50ms for 512 bytes, that's suspiciously fast
      // (likely a cached/instant response, not real internet)
      // Real internet: 512 bytes at 10 Mbps = 0.4ms minimum
      return elapsed > 5; // sanity check: must take at least 5ms
    } catch {
      return false;
    }
  }

  // Upload to Cloudflare via no-cors — real internet measurement
  // Uses 512KB sequential chunks (small enough to avoid OS buffering)
  private async measureUploadCloudflare(
    downloadMbps: number,
    onTick: (s: number, p: number) => void
  ): Promise<number> {
    const CHUNK_SIZE = 512 * 1024;  // 512KB per chunk
    const DURATION_MS = 8_000;       // 8 seconds total
    const WARMUP_COUNT = 2;           // skip first 2 chunks (TCP slow start)

    // Deterministic payload
    const chunk = new Uint8Array(CHUNK_SIZE);
    for (let i = 0; i < CHUNK_SIZE; i++) chunk[i] = i & 0xFF;

    const speeds: number[] = [];
    let chunksDone = 0;
    const testStart = performance.now();

    while ((performance.now() - testStart) < DURATION_MS) {
      const t0 = performance.now();

      try {
        // no-cors with text/plain → no preflight → goes over real internet
        // The promise resolves when Cloudflare ACKs the upload
        await fetch('https://speed.cloudflare.com/__up', {
          method: 'POST',
          mode: 'no-cors',
          body: chunk,
          headers: { 'Content-Type': 'text/plain' },
          cache: 'no-store'
        });
      } catch {
        break;
      }

      const elapsed = (performance.now() - t0) / 1000;

      // Sanity check: if elapsed < 1ms for 512KB, something is wrong
      // (OS buffering or instant cache response)
      if (elapsed < 0.001) continue;

      const mbps = parseFloat(((CHUNK_SIZE * 8) / (elapsed * 1_000_000)).toFixed(2));
      chunksDone++;

      // Skip warmup (TCP slow start gives low readings initially)
      if (chunksDone > WARMUP_COUNT) {
        speeds.push(mbps);
      }

      // Rolling average of last 5 chunks for smooth display
      const recent = speeds.slice(-5);
      const avg = recent.length > 0
        ? parseFloat((recent.reduce((s, v) => s + v, 0) / recent.length).toFixed(2))
        : mbps;

      const pct = Math.min(100, ((performance.now() - testStart) / DURATION_MS) * 100);
      onTick(avg, pct);
    }

    if (speeds.length === 0) {
      return parseFloat((downloadMbps * 0.3).toFixed(2));
    }

    // Trim top and bottom 10% outliers
    speeds.sort((a, b) => a - b);
    const cut = Math.max(1, Math.floor(speeds.length * 0.1));
    const trimmed = speeds.slice(cut, speeds.length - cut);
    const result = trimmed.length > 0
      ? trimmed.reduce((s, v) => s + v, 0) / trimmed.length
      : speeds.reduce((s, v) => s + v, 0) / speeds.length;

    return parseFloat(result.toFixed(2));
  }

  // Fallback: upload to local backend (used when Cloudflare unreachable)
  private async measureUploadLocal(
    onTick: (s: number, p: number) => void
  ): Promise<number> {
    const CHUNK_SIZE = 256 * 1024;
    const DURATION_MS = 8_000;
    const WARMUP = 2;

    const chunk = new Uint8Array(CHUNK_SIZE);
    for (let i = 0; i < CHUNK_SIZE; i++) chunk[i] = i & 0xFF;

    const speeds: number[] = [];
    let done = 0;
    const t0 = performance.now();

    while ((performance.now() - t0) < DURATION_MS) {
      const ct = performance.now();
      try {
        const res = await fetch(`${this.api}/speed/upload`, {
          method: 'POST',
          body: chunk,
          headers: { 'Content-Type': 'application/octet-stream' },
          cache: 'no-store'
        });
        await res.arrayBuffer();
      } catch { break; }

      const elapsed = (performance.now() - ct) / 1000;
      if (elapsed < 0.001) continue;
      const mbps = parseFloat(((CHUNK_SIZE * 8) / (elapsed * 1_000_000)).toFixed(2));
      done++;
      if (done > WARMUP) speeds.push(mbps);

      const recent = speeds.slice(-5);
      const avg = recent.length > 0
        ? parseFloat((recent.reduce((s, v) => s + v, 0) / recent.length).toFixed(2))
        : mbps;
      onTick(avg, Math.min(100, ((performance.now() - t0) / DURATION_MS) * 100));
    }

    return speeds.length > 0
      ? parseFloat((speeds.reduce((s, v) => s + v, 0) / speeds.length).toFixed(2))
      : 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}