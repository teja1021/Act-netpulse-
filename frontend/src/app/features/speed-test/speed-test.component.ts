import {
  Component, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, signal, computed, inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { SpeedTestService } from '../../core/services/speed-test.service';
import { LogService } from '../../core/services/log.service';

@Component({
  selector: 'app-speed-test',
  standalone: true,
  imports: [],
  template: `
<!-- Hero -->
<div class="hero-banner">
  <h1>Internet <span>Speed Test</span></h1>
  <p>Real-time download, upload &amp; latency measurement against your subscribed plan</p>
</div>

<div class="st-layout">

  <!-- LEFT CARD: Meter + metrics + steps -->
  <div class="card st-left">

    <div class="meter-title">DOWNLOAD SPEED</div>

    <!-- Canvas Speedometer -->
    <div class="canvas-wrap">
      <canvas #meterCvs width="320" height="195"></canvas>
      <div class="speed-center">
        <div class="speed-big">{{ smooth().toFixed(0) }}</div>
        <div class="speed-unit">Mbps</div>
      </div>
    </div>

    <!-- 3 Metric boxes -->
    <div class="metric-row">
      <div class="metric-box">
        <div class="mb-label">DOWNLOAD</div>
        <div class="mb-line dl-line"></div>
        <div class="mb-val dl-val">{{ st().download > 0 ? st().download : '' }}</div>
        <div class="mb-unit">Mbps</div>
      </div>
      <div class="metric-box">
        <div class="mb-label">UPLOAD</div>
        <div class="mb-line ul-line"></div>
        <div class="mb-val ul-val">{{ st().upload > 0 ? st().upload : '' }}</div>
        <div class="mb-unit">Mbps</div>
      </div>
      <div class="metric-box">
        <div class="mb-label">LATENCY</div>
        <div class="mb-line lat-line"></div>
        <div class="mb-val lat-val">{{ st().latency > 0 ? st().latency : '' }}</div>
        <div class="mb-unit">ms</div>
      </div>
    </div>

    <!-- Progress bar while testing -->
    @if (st().phase !== 'idle' && st().phase !== 'done') {
      <div class="prog-wrap">
        <div class="prog-bar"><div class="prog-fill" [style.width.%]="st().progress"></div></div>
      </div>
    }

    <!-- START button -->
    <button class="start-btn" (click)="startTest()" [disabled]="testing()">
      @if (testing()) {
        <div class="spin-white"></div> TESTING…
      } @else {
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        {{ st().phase === 'done' ? 'RUN AGAIN' : 'START SPEED TEST' }}
      }
    </button>

    <!-- Steps list (shown while testing or idle) -->
    @if (st().phase !== 'done') {
      <div class="steps-list">
        @for (step of steps; track step.n) {
          <div class="step-item" [class.step-active]="step.phase === st().phase" [class.step-done]="isStepDone(step.phase)">
            <div class="step-num">{{ isStepDone(step.phase) ? '✓' : step.n }}</div>
            <span>{{ step.label }}</span>
          </div>
        }
      </div>
    }

    <!-- Jitter info after test -->
    @if (st().phase === 'done' && st().jitter > 0) {
      <div class="jitter-row">
        <span class="jitter-label">Jitter</span>
        <span class="jitter-val">{{ st().jitter }} ms</span>
        <span class="jitter-sep">·</span>
        <span class="jitter-label">Server</span>
        <span class="jitter-val">{{ st().latency < 3 ? 'Localhost' : 'Remote' }}</span>
      </div>
    }
  </div>

  <!-- RIGHT COLUMN -->
  <div class="st-right">

    <!-- Plan Comparison Card -->
    <div class="card plan-card">
      <div class="pc-head">
        <span class="pc-ic">📋</span>
        <h3>Plan Comparison</h3>
      </div>

      <!-- Plan box with red border -->
      <div class="plan-box">
        <div class="pb-label">YOUR PLAN — {{ user()?.plan?.name?.toUpperCase() }}</div>
        <div class="pb-speed">
          <strong>{{ user()?.plan?.download }}</strong>
          <span class="pb-mbps">Mbps</span>
        </div>
        <!-- Download bar -->
        <div class="plan-bar-row">
          <span class="pbr-label">Download</span>
          <div class="pbr-track"><div class="pbr-fill dl-fill" [style.width.%]="dlPct()"></div></div>
          <span class="pbr-pct">{{ st().download > 0 ? dlPct() + '%' : '—%' }}</span>
        </div>
        <!-- Upload bar -->
        <div class="plan-bar-row">
          <span class="pbr-label">Upload</span>
          <div class="pbr-track"><div class="pbr-fill ul-fill" [style.width.%]="ulPct()"></div></div>
          <span class="pbr-pct">{{ st().upload > 0 ? ulPct() + '%' : '—%' }}</span>
        </div>
      </div>

      <!-- Circular indicators -->
      <div class="circle-row">
        <div class="circ-item">
          <div class="circ-svg-wrap">
            <svg viewBox="0 0 80 80" width="90" height="90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" stroke-width="6"/>
              <circle cx="40" cy="40" r="32" fill="none"
                stroke="#16a34a" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="201.06"
                [attr.stroke-dashoffset]="201.06 - 201.06 * dlPct() / 100"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div class="circ-pct">{{ dlPct() }}%</div>
          </div>
          <div class="circ-lbl">Download</div>
        </div>
        <div class="circ-item">
          <div class="circ-svg-wrap">
            <svg viewBox="0 0 80 80" width="90" height="90">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" stroke-width="6"/>
              <circle cx="40" cy="40" r="32" fill="none"
                stroke="#1e40af" stroke-width="6" stroke-linecap="round"
                stroke-dasharray="201.06"
                [attr.stroke-dashoffset]="201.06 - 201.06 * ulPct() / 100"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div class="circ-pct">{{ ulPct() }}%</div>
          </div>
          <div class="circ-lbl">Upload</div>
        </div>
      </div>
    </div>

    <!-- Performance Rating Card -->
    <div class="card perf-card">
      <div class="pc-head">
        <span class="pc-ic">🏅</span>
        <h3>Performance Rating</h3>
      </div>

      @if (st().phase === 'done') {
        <!-- After test: show result -->
        <div class="perf-result" [class]="'pr-' + cat().toLowerCase()">
          <div class="pr-emoji">{{ catEmoji() }}</div>
          <div>
            <div class="pr-grade">{{ cat() }}</div>
            <div class="pr-desc">{{ perfDesc() }}</div>
          </div>
          <div class="pr-pct">{{ dlPct() }}%</div>
        </div>
        <div class="perf-stats">
          <div class="ps-row"><span>↓ Download</span><strong class="dl-val">{{ st().download }} Mbps</strong></div>
          <div class="ps-row"><span>↑ Upload</span>  <strong class="ul-val">{{ st().upload }} Mbps</strong></div>
          <div class="ps-row"><span>⚡ Latency</span><strong class="lat-val">{{ st().latency }} ms</strong></div>
          <div class="ps-row"><span>📊 Plan %</span> <strong>{{ dlPct() }}%</strong></div>
        </div>
        @if (autoSaved()) {
          <div class="saved-notice">✓ Result saved to history automatically</div>
        }
      } @else {
        <!-- Before test: awaiting state -->
        <div class="perf-awaiting">
          <div class="pa-icon">⏳</div>
          <div class="pa-title">Awaiting Test</div>
          <div class="pa-desc">Run a test to see your network health score</div>
        </div>
        <div class="grade-legend">
          <div class="gl-row"><span class="gl-dot best"></span><span><strong>Best</strong> — ≥ 90% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot good"></span><span><strong>Good</strong> — 70–89% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot avg"></span><span><strong>Average</strong> — 50–69% of plan speed</span></div>
          <div class="gl-row"><span class="gl-dot poor"></span><span><strong>Poor</strong> — &lt; 50% of plan speed</span></div>
        </div>
      }
    </div>

    <!-- ISP Info Card -->
    <div class="card isp-card">
      <div class="isp-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M1.75 7.75a10.5 10.5 0 0 1 20.5 0"/>
          <path d="M5.25 11.25a7 7 0 0 1 13.5 0"/>
          <path d="M8.75 14.75a3.5 3.5 0 0 1 6.5 0"/>
          <circle cx="12" cy="18" r="1" fill="white"/>
        </svg>
      </div>
      <div>
        <div class="isp-name">{{ user()?.plan?.isp }} — {{ user()?.plan?.city }}</div>
        <div class="isp-sub">{{ user()?.plan?.name }} · UDP/TCP</div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .hero-banner { background:linear-gradient(135deg,var(--navy) 0%,var(--navy3) 60%,#2a1040 100%); padding:36px 48px 40px; }
    .hero-banner h1 { font-family:var(--font-d); font-size:2.3rem; font-weight:800; color:#fff; margin-bottom:8px; }
    .hero-banner h1 span { color:var(--red); }
    .hero-banner p { font-size:.88rem; color:rgba(255,255,255,.5); }

    .st-layout { display:grid; grid-template-columns:1fr 370px; gap:20px; padding:24px 32px; max-width:1400px; margin:0 auto; }

    /* LEFT */
    .st-left { padding:24px 24px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; }
    .meter-title { font-size:.7rem; font-weight:700; letter-spacing:.15em; color:var(--text2); }

    /* Canvas */
    .canvas-wrap { position:relative; width:320px; height:195px; }
    .canvas-wrap canvas { position:absolute; top:0; left:0; }
    .speed-center { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); text-align:center; pointer-events:none; }
    .speed-big  { font-family:var(--font-d); font-size:3rem; font-weight:800; color:var(--text); line-height:1; }
    .speed-unit { font-size:.78rem; font-weight:600; color:var(--text2); letter-spacing:.06em; }

    /* Metrics */
    .metric-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; width:100%; }
    .metric-box { padding:14px 10px; background:var(--bg); border-radius:var(--r-lg); border:1px solid var(--border); text-align:center; }
    .mb-label { font-size:.6rem; font-weight:700; letter-spacing:.1em; color:var(--text2); margin-bottom:7px; text-transform:uppercase; }
    .mb-line  { width:24px; height:3px; border-radius:2px; margin:0 auto 7px; }
    .dl-line  { background:var(--green); }
    .ul-line  { background:var(--red); }
    .lat-line { background:var(--orange); }
    .mb-val   { font-family:var(--font-d); font-size:1.4rem; font-weight:700; min-height:1.4rem; line-height:1; }
    .dl-val   { color:var(--green); }
    .ul-val   { color:var(--red); }
    .lat-val  { color:var(--orange); }
    .mb-unit  { font-size:.7rem; color:var(--text2); margin-top:2px; }

    /* Progress */
    .prog-wrap { width:100%; }
    .prog-bar  { height:4px; background:var(--bg); border-radius:2px; overflow:hidden; }
    .prog-fill { height:100%; background:linear-gradient(90deg,var(--red),#ff5555); border-radius:2px; transition:width .25s ease; }

    /* Start button */
    .start-btn {
      width:100%; padding:18px; background:var(--red); color:#fff;
      border:none; border-radius:var(--r-lg); font-size:1rem; font-weight:700;
      letter-spacing:.06em; cursor:pointer; transition:all .2s;
      display:flex; align-items:center; justify-content:center; gap:10px;
      box-shadow:0 4px 16px rgba(226,0,26,.35);
    }
    .start-btn:hover:not(:disabled) { background:var(--red-dark); transform:translateY(-1px); box-shadow:0 6px 24px rgba(226,0,26,.4); }
    .start-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .spin-white { width:18px; height:18px; border-radius:50%; border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Steps */
    .steps-list { display:flex; flex-direction:column; gap:8px; width:100%; }
    .step-item { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--bg); border-radius:var(--r-md); font-size:.84rem; color:var(--text2); border:1.5px solid var(--border); transition:all .25s; }
    .step-item.step-active { background:#fff5f5; border-color:rgba(226,0,26,.3); color:var(--text); }
    .step-item.step-done   { background:#f0fdf4; border-color:rgba(22,163,74,.2); color:var(--green); }
    .step-num { width:26px; height:26px; border-radius:50%; background:var(--border); color:var(--text2); display:flex; align-items:center; justify-content:center; font-size:.78rem; font-weight:700; flex-shrink:0; transition:all .25s; }
    .step-item.step-active .step-num { background:var(--red); color:#fff; }
    .step-item.step-done   .step-num { background:var(--green); color:#fff; }

    /* Jitter */
    .jitter-row { display:flex; align-items:center; gap:8px; font-size:.78rem; color:var(--text2); }
    .jitter-val { font-weight:600; color:var(--text); }
    .jitter-sep { color:var(--border); }

    /* RIGHT */
    .st-right { display:flex; flex-direction:column; gap:16px; }

    /* Plan card */
    .plan-card { padding:20px; }
    .pc-head   { display:flex; align-items:center; gap:8px; margin-bottom:16px; }
    .pc-head h3 { font-family:var(--font-d); font-size:1.1rem; font-weight:700; }
    .pc-ic { font-size:1.1rem; }

    .plan-box { border:1.5px solid var(--red); border-radius:var(--r-lg); padding:15px; margin-bottom:14px; }
    .pb-label { font-size:.6rem; font-weight:700; letter-spacing:.1em; color:var(--text2); margin-bottom:6px; text-transform:uppercase; }
    .pb-speed strong { font-family:var(--font-d); font-size:2.2rem; font-weight:800; color:var(--text); }
    .pb-mbps  { font-size:.9rem; color:var(--text2); margin-left:5px; }
    .pb-speed { margin-bottom:12px; }

    .plan-bar-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:.78rem; color:var(--text2); }
    .plan-bar-row:last-child { margin-bottom:0; }
    .pbr-label { width:60px; flex-shrink:0; }
    .pbr-track { flex:1; height:4px; background:var(--border); border-radius:2px; overflow:hidden; }
    .pbr-fill  { height:100%; border-radius:2px; transition:width .6s ease; }
    .dl-fill   { background:var(--green); }
    .ul-fill   { background:var(--red); }
    .pbr-pct   { font-size:.75rem; font-weight:600; color:var(--text2); min-width:34px; text-align:right; }

    /* Circles */
    .circle-row { display:flex; justify-content:space-around; }
    .circ-item  { display:flex; flex-direction:column; align-items:center; gap:5px; }
    .circ-svg-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
    .circ-pct   { position:absolute; font-family:var(--font-d); font-size:1.05rem; font-weight:700; color:var(--text); }
    .circ-lbl   { font-size:.73rem; color:var(--text2); }

    /* Perf card */
    .perf-card { padding:20px; }
    .perf-result { display:flex; align-items:center; gap:12px; padding:14px; border-radius:var(--r-lg); margin-bottom:14px; }
    .pr-best    { background:rgba(22,163,74,.08);  border:1px solid rgba(22,163,74,.2); }
    .pr-good    { background:rgba(30,64,175,.07);  border:1px solid rgba(30,64,175,.18); }
    .pr-average { background:rgba(217,119,6,.08);  border:1px solid rgba(217,119,6,.2); }
    .pr-poor    { background:rgba(226,0,26,.06);   border:1px solid rgba(226,0,26,.18); }
    .pr-emoji { font-size:1.8rem; flex-shrink:0; }
    .pr-grade { font-family:var(--font-d); font-size:1.3rem; font-weight:800; }
    .pr-best  .pr-grade  { color:var(--green); }
    .pr-good  .pr-grade  { color:var(--blue); }
    .pr-average .pr-grade { color:var(--orange); }
    .pr-poor  .pr-grade  { color:var(--red); }
    .pr-desc { font-size:.75rem; color:var(--text2); line-height:1.4; margin-top:2px; }
    .pr-pct  { margin-left:auto; font-family:var(--font-d); font-size:2rem; font-weight:800; color:var(--text); flex-shrink:0; }

    .perf-stats { display:flex; flex-direction:column; gap:6px; background:var(--bg); border-radius:var(--r-md); padding:11px 13px; margin-bottom:10px; }
    .ps-row { display:flex; justify-content:space-between; font-size:.82rem; color:var(--text2); }
    .ps-row strong { color:var(--text); }
    .dl-val  { color:var(--green) !important; }
    .ul-val  { color:var(--blue) !important; }
    .lat-val { color:var(--orange) !important; }

    .saved-notice { font-size:.75rem; color:var(--green); background:rgba(22,163,74,.08); border:1px solid rgba(22,163,74,.2); border-radius:var(--r-sm); padding:7px 12px; text-align:center; font-weight:600; }

    /* Awaiting */
    .perf-awaiting { display:flex; align-items:flex-start; gap:12px; padding:14px; background:#fffbeb; border-radius:var(--r-lg); border:1px solid rgba(217,119,6,.2); margin-bottom:14px; }
    .pa-icon  { font-size:1.8rem; flex-shrink:0; }
    .pa-title { font-family:var(--font-d); font-size:1.05rem; font-weight:700; color:var(--orange); }
    .pa-desc  { font-size:.78rem; color:var(--text2); margin-top:2px; }

    .grade-legend { display:flex; flex-direction:column; gap:8px; }
    .gl-row  { display:flex; align-items:center; gap:8px; font-size:.8rem; color:var(--text2); }
    .gl-dot  { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
    .gl-dot.best { background:var(--green); }
    .gl-dot.good { background:#fb923c; }
    .gl-dot.avg  { background:var(--orange); }
    .gl-dot.poor { background:var(--red); }

    /* ISP card */
    .isp-card { padding:16px 20px; display:flex; align-items:center; gap:14px; }
    .isp-icon { width:44px; height:44px; border-radius:var(--r-md); background:var(--navy); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .isp-name { font-weight:700; font-size:.9rem; color:var(--text); }
    .isp-sub  { font-size:.72rem; color:var(--text2); margin-top:2px; }

    @media(max-width:1100px) { .st-layout { grid-template-columns:1fr; } .canvas-wrap { width:290px; height:180px; } .speed-big { font-size:2.7rem; } }
  `]
})
export class SpeedTestComponent implements AfterViewInit, OnDestroy {
  @ViewChild('meterCvs') cvs!: ElementRef<HTMLCanvasElement>;
  private auth = inject(AuthService);
  private svc = inject(SpeedTestService);
  private log = inject(LogService);

  st = toSignal(this.svc.state$, { initialValue: this.svc.state$.value });
  user = this.auth.currentUser;
  testing = signal(false);
  autoSaved = signal(false);
  smooth = signal(0);

  private _raf = 0;
  private _d = 0;

  steps = [
    { n: 1, label: 'Measuring latency & ping', phase: 'ping' },
    { n: 2, label: 'Testing download speed', phase: 'download' },
    { n: 3, label: 'Testing upload speed', phase: 'upload' },
    { n: 4, label: 'Analyzing results', phase: 'done' }
  ];

  dlPct = computed(() => Math.min(100, Math.round((this.st().download / (this.user()?.plan?.download ?? 1)) * 100)));
  ulPct = computed(() => Math.min(100, Math.round((this.st().upload / (this.user()?.plan?.upload ?? 1)) * 100)));

  cat = computed<'Best' | 'Good' | 'Average' | 'Poor'>(() => {
    const p = this.dlPct();
    return p >= 90 ? 'Best' : p >= 70 ? 'Good' : p >= 50 ? 'Average' : 'Poor';
  });

  catEmoji = computed(() => ({ Best: '🏆', Good: '✅', Average: '⚠️', Poor: '🔴' })[this.cat()]);

  perfDesc = computed(() => {
    const p = this.dlPct();
    if (p >= 90) return 'Excellent! Delivering near-plan speed.';
    if (p >= 70) return 'Good performance from your plan.';
    if (p >= 50) return 'Average — congestion may be present.';
    return 'Below average. Consider contacting your ISP.';
  });

  isStepDone(phase: string): boolean {
    const order = ['ping', 'download', 'upload', 'done'];
    return order.indexOf(this.st().phase) > order.indexOf(phase);
  }

  ngAfterViewInit() { this.draw(0); this.loop(); }
  ngOnDestroy() { cancelAnimationFrame(this._raf); }

  async startTest() {
    if (this.testing()) return;
    this.testing.set(true);
    this.autoSaved.set(false);
    this._d = 0;
    this.svc.reset();
    try {
      const result = await this.svc.runTest();
      // AUTO-SAVE immediately after test completes
      this.autoSave(result);
    } finally {
      this.testing.set(false);
    }
  }

  private autoSave(s: { download: number; upload: number; latency: number }) {
    const u = this.user();
    if (!u) return;
    this.log.save({
      userId: u.userId,
      download: s.download,
      upload: s.upload,
      latency: s.latency,
      planDownload: u.plan.download,
      planUpload: u.plan.upload
    }).subscribe({
      next: () => this.autoSaved.set(true),
      error: () => { } // silent fail
    });
  }

  private loop() {
    const frame = () => {
      const target = this.svc.state$.value.liveSpeed;
      this._d += (target - this._d) * 0.10;
      if (Math.abs(this._d - target) < 0.05) this._d = target;
      this.smooth.set(this._d);
      this.draw(this._d);
      this._raf = requestAnimationFrame(frame);
    };
    this._raf = requestAnimationFrame(frame);
  }

  private draw(spd: number) {
    const cv = this.cvs?.nativeElement;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W = cv.width, H = cv.height, cx = W / 2, cy = H - 20, R = 128;
    ctx.clearRect(0, 0, W, H);

    const max = this.user()?.plan?.download ?? 300;
    const frac = Math.min(1, spd / max);
    const sA = Math.PI, nA = sA + frac * Math.PI;

    // Background arc
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 20; ctx.lineCap = 'round'; ctx.stroke();

    // Colored zone arcs
    const zones = [
      { from: 0, to: .5, color: '#fecaca' },
      { from: .5, to: .7, color: '#fde68a' },
      { from: .7, to: .9, color: '#bbf7d0' },
      { from: .9, to: 1.0, color: '#86efac' }
    ];
    zones.forEach(z => {
      ctx.beginPath();
      ctx.arc(cx, cy, R, sA + z.from * Math.PI, sA + z.to * Math.PI);
      ctx.strokeStyle = z.color; ctx.lineWidth = 16; ctx.lineCap = 'butt'; ctx.stroke();
    });

    // Zone boundary dots
    [{ at: .5, c: '#f59e0b' }, { at: .7, c: '#22c55e' }, { at: .9, c: '#16a34a' }].forEach(d => {
      const a = sA + d.at * Math.PI;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, 2 * Math.PI);
      ctx.fillStyle = d.c; ctx.fill();
    });

    // End dots
    ctx.beginPath(); ctx.arc(cx + Math.cos(sA) * R, cy + Math.sin(sA) * R, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#e2001a'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx + Math.cos(2 * Math.PI) * R, cy + Math.sin(2 * Math.PI) * R, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#16a34a'; ctx.fill();

    // Ticks + labels
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI, maj = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
      ctx.lineTo(cx + Math.cos(a) * (R - (maj ? 36 : 28)), cy + Math.sin(a) * (R - (maj ? 36 : 28)));
      ctx.strokeStyle = maj ? '#9ca3af' : '#d1d5db'; ctx.lineWidth = maj ? 2 : 1; ctx.stroke();
      if (maj) {
        ctx.fillStyle = '#6b7280'; ctx.font = '500 10px Inter,sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(Math.round(i / 10 * max)), cx + Math.cos(a) * (R - 50), cy + Math.sin(a) * (R - 50));
      }
    }

    // Needle
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(nA - .04) * 11, cy + Math.sin(nA - .04) * 11);
    ctx.lineTo(cx + Math.cos(nA) * (R - 24), cy + Math.sin(nA) * (R - 24));
    ctx.lineTo(cx + Math.cos(nA + .04) * 11, cy + Math.sin(nA + .04) * 11);
    ctx.closePath(); ctx.fillStyle = '#111827'; ctx.fill(); ctx.restore();

    // Hub
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, 2 * Math.PI); ctx.fillStyle = '#1f2937'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
  }
}
