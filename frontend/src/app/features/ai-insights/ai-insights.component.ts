import { Component, OnInit, signal, inject, ElementRef, ViewChild, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgComponentOutlet, CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LogService, SpeedLog } from '../../core/services/log.service';
import { AiPanelService } from './ai-panel.service';

interface Msg { role: 'user' | 'ai'; text: string; loading?: boolean; }

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
<div class="ai-panel-inner">
  <!-- Header -->
  <div class="ap-head">
    <div class="ap-head-l">
      <div class="ap-av">AI</div>
      <div>
        <div class="ap-title">Network Assistant</div>
        <div class="ap-sub">Powered by Claude AI</div>
      </div>
    </div>
    <button class="ap-close" (click)="ai.close()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- Quick chips -->
  <div class="ap-chips">
    @for (c of chips; track c.p) {
      <button class="ap-chip" (click)="quick(c.p)" [disabled]="loading()">{{ c.e }} {{ c.l }}</button>
    }
  </div>

  <!-- Messages -->
  <div class="ap-msgs" #msgBox>
    @for (m of msgs(); track $index) {
      @if (m.role === 'ai') {
        <div class="ap-msg ai">
          <div class="m-av red">AI</div>
          <div class="m-bubble ai-bub">
            @if (m.loading) { <div class="dots"><span></span><span></span><span></span></div> }
            @else { <span style="white-space:pre-wrap">{{ m.text }}</span> }
          </div>
        </div>
      } @else {
        <div class="ap-msg user">
          <div class="m-bubble user-bub">{{ m.text }}</div>
          <div class="m-av navy">{{ userInit() }}</div>
        </div>
      }
    }
  </div>

  <!-- Input -->
  <div class="ap-input">
    <input [(ngModel)]="inp" (keydown.enter)="send()" [disabled]="loading()"
      placeholder="Ask about your network performance…" class="ap-inp"/>
    <button class="ap-send" (click)="send()" [disabled]="loading() || !inp.trim()">
      @if (loading()) { <div class="spin-sm"></div> }
      @else { Send ↗ }
    </button>
  </div>
</div>
  `,
  styles: [`
    .ai-panel-inner { display:flex; flex-direction:column; height:100%; max-height:70vh; }

    .ap-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
    .ap-head-l { display:flex; align-items:center; gap:10px; }
    .ap-av { width:32px; height:32px; border-radius:50%; background:var(--red); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.82rem; flex-shrink:0; }
    .ap-title { font-weight:700; font-size:.9rem; color:var(--text); }
    .ap-sub   { font-size:.68rem; color:var(--text2); }
    .ap-close { background:none; border:none; cursor:pointer; color:var(--text2); padding:4px; border-radius:4px; display:flex; transition:color .15s; }
    .ap-close:hover { color:var(--red); }

    .ap-chips { display:flex; flex-wrap:wrap; gap:6px; padding:10px 14px; border-bottom:1px solid var(--border); flex-shrink:0; }
    .ap-chip  { padding:4px 10px; border:1.5px solid var(--border); border-radius:16px; font-size:.72rem; color:var(--text2); background:var(--bg); cursor:pointer; transition:all .15s; font-family:var(--font); font-weight:500; }
    .ap-chip:hover:not(:disabled) { border-color:var(--red); color:var(--red); }
    .ap-chip:disabled { opacity:.5; cursor:not-allowed; }

    .ap-msgs { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:12px; min-height:200px; }

    .ap-msg { display:flex; align-items:flex-start; gap:8px; }
    .ap-msg.user { flex-direction:row-reverse; }
    .m-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.75rem; flex-shrink:0; }
    .m-av.red  { background:var(--red); color:#fff; }
    .m-av.navy { background:var(--navy); color:#fff; }
    .m-bubble { max-width:82%; padding:10px 13px; border-radius:10px; font-size:.82rem; line-height:1.6; }
    .ai-bub   { background:var(--bg); border:1px solid var(--border); color:var(--text); border-top-left-radius:2px; }
    .user-bub { background:var(--navy); color:#fff; border-top-right-radius:2px; }

    .dots { display:flex; gap:4px; align-items:center; }
    .dots span { width:6px; height:6px; border-radius:50%; background:var(--text3); animation:db .8s ease infinite; }
    .dots span:nth-child(2) { animation-delay:.15s; }
    .dots span:nth-child(3) { animation-delay:.3s; }
    @keyframes db { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }

    .ap-input { display:flex; gap:8px; padding:12px 14px; border-top:1px solid var(--border); flex-shrink:0; }
    .ap-inp   { flex:1; padding:9px 12px; border:1.5px solid var(--border); border-radius:var(--r-md); font-size:.83rem; color:var(--text); background:var(--white); outline:none; font-family:var(--font); transition:border-color .15s; }
    .ap-inp:focus { border-color:var(--red); }
    .ap-inp::placeholder { color:var(--text3); }
    .ap-send { padding:9px 16px; background:var(--red); color:#fff; border:none; border-radius:var(--r-md); font-size:.82rem; font-weight:700; cursor:pointer; transition:all .15s; white-space:nowrap; display:flex; align-items:center; gap:5px; }
    .ap-send:hover:not(:disabled) { background:var(--red-dark); }
    .ap-send:disabled { opacity:.5; cursor:not-allowed; }
    .spin-sm { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class AiInsightsComponent implements OnInit {
  @ViewChild('msgBox') msgBox!: ElementRef;
  private auth = inject(AuthService);
  private logSvc = inject(LogService);
  public ai = inject(AiPanelService);

  msgs = signal<Msg[]>([]);
  inp = '';
  loading = signal(false);
  private logs: SpeedLog[] = [];

  userInit = () => (this.auth.currentUser()?.name ?? 'U').charAt(0).toUpperCase();

  chips = [
    { e: '📊', l: "This week's avg", p: "What's my average download speed this week?" },
    { e: '🐢', l: 'Slowest period', p: 'When was my slowest internet period?' },
    { e: '📋', l: 'Plan comparison', p: 'How does my actual speed compare to my plan?' },
    { e: '⚡', l: 'Peak hours', p: 'What are my peak performance hours?' },
    { e: '💡', l: 'Plan advice', p: 'Should I upgrade my internet plan?' },
    { e: '🔍', l: 'Speed drops', p: 'Why might my speed be dropping at certain times?' },
  ];

  ngOnInit() {
    this.msgs.set([{ role: 'ai', text: "Hello! I'm your NetPulse AI assistant. I can analyze your internet speed history, compare your actual performance against your plan, and give you insights about your network. What would you like to know?" }]);
    const uid = this.auth.currentUser()?.userId;
    if (uid) this.logSvc.getAll(uid).subscribe(r => { if (r.success) this.logs = r.logs; });
  }

  quick(p: string) { this.inp = p; this.send(); }

  async send() {
    const text = this.inp.trim();
    if (!text || this.loading()) return;
    this.inp = '';
    this.msgs.update(m => [...m, { role: 'user', text }]);
    this.msgs.update(m => [...m, { role: 'ai', text: '', loading: true }]);
    this.loading.set(true);
    setTimeout(() => this.scroll(), 50);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `You are a helpful internet speed assistant for NetPulse. Be concise and practical. Keep responses under 150 words. Use bullet points when listing multiple items.\n\n${this.ctx()}`,
          messages: [{ role: 'user', content: text }]
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text ?? "Couldn't get a response. Try again.";
      this.msgs.update(m => [...m.slice(0, -1), { role: 'ai', text: reply }]);
    } catch {
      this.msgs.update(m => [...m.slice(0, -1), { role: 'ai', text: "Unable to connect to AI service. Please check your internet connection." }]);
    } finally {
      this.loading.set(false);
      setTimeout(() => this.scroll(), 80);
    }
  }

  private ctx(): string {
    const u = this.auth.currentUser();
    if (!u) return '';
    const p = `Plan: ${u.plan.name} (${u.plan.download}↓/${u.plan.upload}↑ Mbps, ${u.plan.isp}, ${u.plan.city})`;
    if (!this.logs.length) return p + '\nNo test history available.';
    const r = this.logs.slice(0, 10);
    const avgDl = (r.reduce((s, l) => s + l.download, 0) / r.length).toFixed(0);
    const avgUl = (r.reduce((s, l) => s + l.upload, 0) / r.length).toFixed(0);
    const avgLat = (r.reduce((s, l) => s + l.latency, 0) / r.length).toFixed(0);
    const cats = { Best: 0, Good: 0, Average: 0, Poor: 0 } as Record<string, number>;
    this.logs.forEach(l => cats[l.category]++);
    return `User: ${u.name} | ${p}
Recent avg: ${avgDl}↓ ${avgUl}↑ Mbps, ${avgLat}ms latency
Ratings: Best=${cats['Best']}, Good=${cats['Good']}, Average=${cats['Average']}, Poor=${cats['Poor']}
Total tests: ${this.logs.length} | Latest: ${r[0]?.download}↓ ${r[0]?.upload}↑ ${r[0]?.latency}ms (${r[0]?.category})`;
  }

  private scroll() {
    const el = this.msgBox?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}