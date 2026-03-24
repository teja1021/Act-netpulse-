import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AiPanelService } from '../../features/ai-insights/ai-panel.service';
import type { AiInsightsComponent } from '../../features/ai-insights/ai-insights.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgComponentOutlet],
  template: `
<div class="shell">

  <!-- NAVBAR -->
  <nav class="navbar">
    <div class="nav-inner">
      <a routerLink="/speed-test" class="logo">
        <img class="logo-img" src="/assets/images/act-logo.png" alt="ACT logo" />
        <span class="logo-net">Net</span><span class="logo-net">Pulse</span>
      </a>

      <div class="nav-links">
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" routerLinkActive="nav-active" class="nav-link">{{ item.label }}</a>
        }
      </div>

      <div class="nav-right">
        <div class="plan-pill">
          <span class="plan-dot"></span>
          {{ user()?.plan?.isp }} · {{ user()?.plan?.download }} Mbps
        </div>

        <!-- Profile avatar -->
        <div class="profile-wrap" (click)="toggleProfile()">
          <div class="profile-av">{{ initial() }}</div>
          @if (profileOpen()) {
            <div class="profile-dropdown" (click)="$event.stopPropagation()">
              <div class="pd-user">
                <div class="pd-av">{{ initial() }}</div>
                <div>
                  <div class="pd-name">{{ user()?.name }}</div>
                  <div class="pd-id">{{ user()?.userId }}</div>
                </div>
              </div>
              <div class="pd-divider"></div>
              <div class="pd-row"><span class="pd-lbl">Plan</span><span class="pd-val">{{ user()?.plan?.name }}</span></div>
              <div class="pd-row"><span class="pd-lbl">City</span><span class="pd-val">{{ user()?.plan?.city }}</span></div>
              <div class="pd-divider"></div>
              <button class="pd-logout" (click)="logout()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  </nav>

  <!-- PAGE CONTENT -->
  <div class="page-area" (click)="closeProfile()">
    <router-outlet />
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <span class="footer-brand">NetPulse</span>
    <span class="footer-sep">·</span>
    MEAN Stack Internet Speed Monitor
    <span class="footer-sep">·</span>
    Built for transparent network performance analytics
  </footer>

  <!-- AI FLOATING BUTTON -->
  <button class="ai-fab" (click)="aiSvc.toggle()" [class.fab-open]="aiSvc.open()" title="AI Network Assistant">
    @if (aiSvc.open()) {
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    } @else {
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span>AI</span>
    }
  </button>

  <!-- AI PANEL -->
  @if (aiSvc.open()) {
    <div class="ai-overlay" (click)="aiSvc.close()"></div>
    <div class="ai-panel">
      @if (aiComp) {
        <ng-container *ngComponentOutlet="aiComp" />
      }
    </div>
  }
</div>
  `,
  styles: [`
    .shell{display:flex;flex-direction:column;min-height:100vh;background:var(--bg)}

    .navbar{background:var(--navy);position:sticky;top:0;z-index:200;border-bottom:1px solid rgba(255,255,255,.06)}
    .nav-inner{max-width:1400px;margin:0 auto;padding:0 28px;height:58px;display:flex;align-items:center;position:relative}

    .logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-right:36px;flex-shrink:0;position:relative;z-index:1}
    .logo-img{height:30px;width:auto;display:block;object-fit:contain;flex-shrink:0}
    .logo-net  {font-family:var(--font-d);font-size:1.875rem;font-weight:700;color:#fff}
    .logo-pulse{font-family:var(--font-d);font-size:1.875rem;font-weight:700;color:var(--red);margin-left:0}

    .nav-links{display:flex;align-items:center;gap:4px;position:absolute;left:50%;transform:translateX(-50%)}
    .nav-link{padding:7px 18px;border-radius:6px;color:rgba(255,255,255,.6);font-size:.96rem;font-weight:600;text-decoration:none;transition:all .15s;white-space:nowrap}
    .nav-link:hover{color:#fff;background:rgba(255,255,255,.07)}
    .nav-link.nav-active{background:var(--red);color:#fff;box-shadow:0 2px 10px rgba(226,0,26,.35);font-weight:600}

    .nav-right{display:flex;align-items:center;gap:12px;margin-left:auto;position:relative;z-index:1}

    .plan-pill{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:5px 14px;font-size:.78rem;font-weight:500;color:rgba(255,255,255,.8)}
    .plan-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;flex-shrink:0}

    .profile-wrap{position:relative;cursor:pointer;flex-shrink:0}
    .profile-av{width:36px;height:36px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-weight:700;font-size:1.05rem;border:2.5px solid rgba(255,255,255,.2);transition:border-color .15s;user-select:none}
    .profile-wrap:hover .profile-av{border-color:rgba(255,255,255,.55)}

    .profile-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:220px;background:var(--white);border-radius:var(--r-lg);box-shadow:0 8px 32px rgba(0,0,0,.18);border:1px solid var(--border);z-index:300;overflow:hidden;animation:fup .15s ease}
    @keyframes fup{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .pd-user{display:flex;align-items:center;gap:10px;padding:14px 16px}
    .pd-av{width:36px;height:36px;border-radius:50%;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;flex-shrink:0}
    .pd-name{font-weight:700;font-size:.88rem;color:var(--text)}
    .pd-id{font-size:.7rem;color:var(--text2);font-family:monospace}
    .pd-divider{height:1px;background:var(--border)}
    .pd-row{display:flex;justify-content:space-between;padding:7px 16px;font-size:.78rem}
    .pd-lbl{color:var(--text2)} .pd-val{font-weight:600;color:var(--text)}
    .pd-logout{width:100%;display:flex;align-items:center;gap:8px;padding:10px 16px;background:none;border:none;color:#dc2626;font-size:.82rem;font-weight:600;cursor:pointer;font-family:var(--font);transition:background .15s}
    .pd-logout:hover{background:#fef2f2}

    .page-area{flex:1;overflow-y:auto}

    .footer{background:var(--navy);padding:12px 32px;text-align:center;font-size:.74rem;color:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
    .footer-brand{color:var(--red);font-weight:700}
    .footer-sep{color:rgba(255,255,255,.15)}

    .ai-fab{position:fixed;bottom:28px;right:28px;z-index:400;display:flex;align-items:center;gap:7px;padding:12px 20px;border-radius:28px;background:var(--red);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(226,0,26,.45);font-family:var(--font);font-size:.875rem;font-weight:700;transition:all .2s;letter-spacing:.03em}
    .ai-fab:hover{background:var(--red-dark);transform:translateY(-2px);box-shadow:0 6px 28px rgba(226,0,26,.5)}
    .ai-fab.fab-open{border-radius:50%;width:46px;height:46px;padding:0;justify-content:center}

    .ai-overlay{position:fixed;inset:0;background:rgba(0,0,0,.15);z-index:350}
    .ai-panel{position:fixed;bottom:86px;right:28px;z-index:360;width:460px;max-height:72vh;background:var(--white);border-radius:var(--r-xl);box-shadow:0 16px 60px rgba(0,0,0,.2);border:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;animation:ps .2s ease}
    @keyframes ps{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

    @media(max-width:900px){
      .plan-pill{display:none}
      .nav-inner{padding:0 14px}
      .nav-links{position:static;left:auto;transform:none;margin:0 auto}
      .logo{margin-right:16px}
      .ai-panel{right:10px;left:10px;width:auto}
      .ai-fab{bottom:20px;right:20px}
    }
  `]
})
export class LayoutComponent implements OnInit {
  constructor(
    public aiSvc: AiPanelService,
    private auth: AuthService,
    private router: Router
  ) { }

  user = this.auth.currentUser;
  initial = computed(() => (this.user()?.name ?? 'U').charAt(0).toUpperCase());
  profileOpen = signal(false);
  aiComp: any = null;

  navItems = [
    { path: '/speed-test', label: 'Speed Test' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/history', label: 'History' },
    { path: '/settings', label: 'Settings' }
  ];

  ngOnInit() {
    this.router.events.subscribe(() => this.profileOpen.set(false));
    import('../../features/ai-insights/ai-insights.component')
      .then(m => this.aiComp = m.AiInsightsComponent);
  }

  toggleProfile() { this.profileOpen.update(v => !v); }
  closeProfile() { this.profileOpen.set(false); }
  logout() { this.auth.logout(); this.profileOpen.set(false); }
}
