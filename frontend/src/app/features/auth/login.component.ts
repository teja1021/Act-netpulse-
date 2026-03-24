import { Component, signal } from '@angular/core';
import { FormsModule }       from '@angular/forms';
import { Router }            from '@angular/router';
import { AuthService }       from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="login-page">
  <!-- Background -->
  <div class="login-bg">
    <div class="bg-orb bg-orb1"></div>
    <div class="bg-orb bg-orb2"></div>
  </div>

  <div class="login-wrap">
    <!-- Left panel -->
    <div class="login-left">
      <div class="brand">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <span class="brand-net">Net</span><span class="brand-pulse">Pulse</span>
      </div>
      <div class="tagline">
        <h1>Internet <span>Speed Test</span></h1>
        <p>Real-time download, upload &amp; latency measurement against your subscribed plan</p>
      </div>
      <ul class="feat-list">
        <li><span class="feat-dot red"></span>CDN-based real internet measurement</li>
        <li><span class="feat-dot green"></span>Plan vs actual comparison</li>
        <li><span class="feat-dot blue"></span>Historical analytics dashboard</li>
        <li><span class="feat-dot orange"></span>AI-powered network insights</li>
      </ul>
    </div>

    <!-- Right: form card -->
    <div class="login-right">
      <div class="login-card">
        <div class="lc-head">
          <h2>Welcome back</h2>
          <p>Sign in to your NetPulse account</p>
        </div>

        <div class="demo-hint">
          💡 Demo: <strong>ACT123</strong> / <strong>1234</strong>
        </div>

        <form (ngSubmit)="login()" class="lc-form">
          <div class="field">
            <label>Account ID</label>
            <div class="inp-wrap">
              <svg class="inp-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input type="text" [(ngModel)]="userId" name="userId"
                placeholder="e.g. ACT123" [disabled]="loading()"/>
            </div>
          </div>

          <div class="field">
            <label>Password</label>
            <div class="inp-wrap">
              <svg class="inp-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="password"
                name="password" placeholder="Password" [disabled]="loading()"/>
              <button type="button" class="eye-btn" (click)="showPwd.set(!showPwd())">
                @if (showPwd()) {
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                } @else {
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                }
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="err-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ error() }}
            </div>
          }

          <button type="submit" class="btn btn-red submit-btn" [disabled]="loading()">
            @if (loading()) { <div class="spinner"></div> Signing in… }
            @else { Sign In }
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .login-page { min-height:100vh; background:var(--navy); display:flex; align-items:center; justify-content:center; padding:20px; position:relative; overflow:hidden; }

    .login-bg { position:absolute; inset:0; pointer-events:none; }
    .bg-orb { position:absolute; border-radius:50%; filter:blur(80px); }
    .bg-orb1 { width:500px; height:500px; background:radial-gradient(circle,rgba(226,0,26,.12),transparent 70%); top:-150px; left:-100px; }
    .bg-orb2 { width:400px; height:400px; background:radial-gradient(circle,rgba(100,50,200,.08),transparent 70%); bottom:-100px; right:0; }

    .login-wrap { display:flex; width:960px; max-width:100%; background:var(--white); border-radius:var(--r-xl); overflow:hidden; box-shadow:0 24px 80px rgba(0,0,0,.5); position:relative; z-index:1; animation:fadeUp .4s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    .login-left { flex:1; padding:52px 48px; background:linear-gradient(145deg,var(--navy) 0%,var(--navy3) 100%); display:flex; flex-direction:column; }
    .brand { display:flex; align-items:center; gap:10px; margin-bottom:52px; }
    .brand-icon { width:38px; height:38px; border-radius:8px; background:var(--red); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 10px rgba(226,0,26,.4); }
    .brand-net   { font-family:var(--font-d); font-size:1.5rem; font-weight:700; color:#fff; }
    .brand-pulse { font-family:var(--font-d); font-size:1.5rem; font-weight:700; color:var(--red); margin-left:5px; }

    .tagline { margin-bottom:40px; }
    .tagline h1 { font-family:var(--font-d); font-size:2.4rem; font-weight:800; color:#fff; line-height:1.15; margin-bottom:12px; }
    .tagline h1 span { color:var(--red); }
    .tagline p { font-size:.88rem; color:rgba(255,255,255,.5); line-height:1.7; }

    .feat-list { list-style:none; display:flex; flex-direction:column; gap:13px; margin-top:auto; }
    .feat-list li { display:flex; align-items:center; gap:10px; font-size:.84rem; color:rgba(255,255,255,.65); }
    .feat-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .feat-dot.red    { background:var(--red); }
    .feat-dot.green  { background:#22c55e; }
    .feat-dot.blue   { background:#60a5fa; }
    .feat-dot.orange { background:#fb923c; }

    .login-right { width:400px; flex-shrink:0; padding:52px 44px; display:flex; align-items:center; background:var(--white); }
    .login-card  { width:100%; }
    .lc-head     { margin-bottom:22px; }
    .lc-head h2  { font-family:var(--font-d); font-size:1.7rem; font-weight:700; color:var(--text); margin-bottom:4px; }
    .lc-head p   { font-size:.84rem; color:var(--text2); }

    .demo-hint { display:flex; align-items:center; gap:7px; padding:10px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:var(--r-md); font-size:.8rem; color:#1e40af; margin-bottom:22px; }
    .demo-hint strong { color:var(--text); }

    .lc-form { display:flex; flex-direction:column; gap:17px; }
    .inp-wrap { position:relative; display:flex; align-items:center; }
    .inp-ic   { position:absolute; left:12px; color:var(--text3); pointer-events:none; }
    .inp-wrap input { width:100%; padding-left:40px !important; }
    .eye-btn  { position:absolute; right:10px; background:none; border:none; cursor:pointer; color:var(--text3); display:flex; transition:color .15s; }
    .eye-btn:hover { color:var(--text); }
    .err-box  { display:flex; align-items:center; gap:7px; padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; border-radius:var(--r-md); font-size:.82rem; color:#dc2626; }
    .submit-btn { width:100%; padding:13px; font-size:.95rem; margin-top:4px; }

    @media(max-width:760px) { .login-left{display:none} .login-right{width:100%;padding:36px 28px} }
  `]
})
export class LoginComponent {
  userId = ''; password = '';
  loading = signal(false); error = signal(''); showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.error.set('');
    if (!this.userId.trim() || !this.password.trim()) { this.error.set('Please enter your credentials.'); return; }
    this.loading.set(true);
    this.auth.login(this.userId.trim(), this.password).subscribe({
      next: res => { this.loading.set(false); if (res.success) this.router.navigate(['/speed-test']); else this.error.set(res.message || 'Login failed.'); },
      error: err => { this.loading.set(false); this.error.set(err?.error?.message || 'Invalid credentials.'); }
    });
  }
}
