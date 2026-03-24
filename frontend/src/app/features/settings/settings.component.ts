import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="hero-banner">
  <h1>Plan <span>Settings</span></h1>
  <p>Configure your subscribed plan and test preferences</p>
</div>

<div class="st-content">

  <!-- My Subscribed Plan -->
  <div class="card sett-card">
    <div class="sc-head">
      <span>🔧</span>
      <h3>My Subscribed Plan</h3>
    </div>

    <form (ngSubmit)="save()" class="sett-form">
      <div class="form-grid">
        <div class="field">
          <label>ISP NAME</label>
          <input type="text" [(ngModel)]="fm.isp" name="isp" placeholder="ACT Fibernet" [disabled]="saving()"/>
        </div>
        <div class="field">
          <label>PLAN NAME</label>
          <input type="text" [(ngModel)]="fm.planName" name="planName" placeholder="ACT Storm" [disabled]="saving()"/>
        </div>
        <div class="field">
          <label>SUBSCRIBED DOWNLOAD (MBPS)</label>
          <input type="number" [(ngModel)]="fm.download" name="download" placeholder="300" min="1" max="10000" [disabled]="saving()"/>
        </div>
        <div class="field">
          <label>SUBSCRIBED UPLOAD (MBPS)</label>
          <input type="number" [(ngModel)]="fm.upload" name="upload" placeholder="300" min="1" max="10000" [disabled]="saving()"/>
        </div>
        <div class="field">
          <label>CONNECTION TYPE</label>
          <div class="sel-wrap">
            <select [(ngModel)]="fm.connType" name="connType" [disabled]="saving()">
              <option value="Fiber">Fiber</option>
              <option value="Cable">Cable</option>
              <option value="DSL">DSL</option>
              <option value="5G">5G</option>
              <option value="4G">4G</option>
              <option value="WiFi">WiFi</option>
            </select>
            <svg class="sel-arr" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="field">
          <label>CITY</label>
          <input type="text" [(ngModel)]="fm.city" name="city" placeholder="Bengaluru" [disabled]="saving()"/>
        </div>
      </div>

      @if (status() === 'saved') {
        <div class="status-ok">✓ Settings saved successfully!</div>
      }
      @if (status() === 'error') {
        <div class="status-err">✗ Failed to save. Please try again.</div>
      }

      <button type="submit" class="save-btn btn btn-red" [disabled]="saving()">
        @if (saving()) { <div class="spinner"></div> SAVING… }
        @else { SAVE SETTINGS }
      </button>
    </form>
  </div>

  <!-- Test Preferences -->
  <div class="card sett-card">
    <div class="sc-head">
      <span>⚙️</span>
      <h3>Test Preferences</h3>
    </div>
    <div class="pref-grid">
      <div class="pref-item">
        <div class="pref-label">Test Duration</div>
        <div class="pref-val">10 seconds (recommended)</div>
      </div>
      <div class="pref-item">
        <div class="pref-label">Parallel Streams</div>
        <div class="pref-val">4 streams for accuracy</div>
      </div>
      <div class="pref-item">
        <div class="pref-label">Download Source</div>
        <div class="pref-val">Cloudflare CDN (real internet)</div>
      </div>
      <div class="pref-item">
        <div class="pref-label">Ping Samples</div>
        <div class="pref-val">10 samples (trimmed average)</div>
      </div>
    </div>
  </div>

  <!-- Quick Plan Presets -->
  <div class="card sett-card">
    <div class="sc-head">
      <span>📋</span>
      <h3>ACT Fibernet Plan Presets</h3>
    </div>
    <div class="preset-grid">
      @for (p of presets; track p.name) {
        <div class="preset-card" (click)="applyPreset(p)">
          <div class="preset-name">{{ p.name }}</div>
          <div class="preset-speed">{{ p.download }} Mbps</div>
          <div class="preset-hint">Click to apply</div>
        </div>
      }
    </div>
  </div>
</div>
  `,
  styles: [`
    .hero-banner{background:linear-gradient(135deg,var(--navy) 0%,var(--navy3) 60%,#2a1040 100%);padding:36px 48px 80px}
    .hero-banner h1{font-family:var(--font-d);font-size:2.3rem;font-weight:800;color:#fff;margin-bottom:8px}
    .hero-banner h1 span{color:var(--red)}
    .hero-banner p{font-size:.88rem;color:rgba(255,255,255,.5)}

    .st-content{padding:24px 32px;max-width:860px;margin:-52px auto 0;position:relative;z-index:1;display:flex;flex-direction:column;gap:20px}

    .sett-card{padding:28px 32px}
    .sc-head{display:flex;align-items:center;gap:10px;margin-bottom:24px}
    .sc-head h3{font-family:var(--font-d);font-size:1.1rem;font-weight:700;color:var(--text)}

    .sett-form{display:flex;flex-direction:column;gap:20px}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}

    .sel-wrap{position:relative}
    .sel-wrap select{appearance:none;width:100%;padding:12px 40px 12px 14px;border:1.5px solid var(--border);border-radius:var(--r-md);font-family:var(--font);font-size:.9rem;color:var(--text);background:var(--white);outline:none;cursor:pointer;transition:border-color .18s}
    .sel-wrap select:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(226,0,26,.08)}
    .sel-arr{position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text2)}

    .status-ok{padding:10px 16px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--r-md);font-size:.85rem;color:#16a34a;font-weight:600}
    .status-err{padding:10px 16px;background:#fef2f2;border:1px solid #fca5a5;border-radius:var(--r-md);font-size:.85rem;color:var(--red);font-weight:600}

    .save-btn{align-self:flex-start;padding:14px 32px;font-size:.95rem;letter-spacing:.06em}

    .pref-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .pref-item{padding:16px;background:var(--bg);border-radius:var(--r-lg);border:1px solid var(--border)}
    .pref-label{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text2);margin-bottom:6px}
    .pref-val{font-size:.88rem;font-weight:600;color:var(--text)}

    .preset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .preset-card{padding:16px;background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r-lg);cursor:pointer;transition:all .15s}
    .preset-card:hover{border-color:var(--red);background:#fff5f5;transform:translateY(-1px)}
    .preset-name{font-family:var(--font-d);font-weight:700;font-size:.95rem;color:var(--text);margin-bottom:4px}
    .preset-speed{font-family:var(--font-d);font-size:1.4rem;font-weight:800;color:var(--red);line-height:1}
    .preset-hint{font-size:.68rem;color:var(--text3);margin-top:6px}

    @media(max-width:680px){.form-grid,.pref-grid,.preset-grid{grid-template-columns:1fr}}
  `]
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  private userSvc = inject(UserService);

  user = this.auth.currentUser;
  saving = signal(false);
  status = signal('');

  fm = { name: '', email: '', isp: '', planName: '', download: 0, upload: 0, city: '', connType: 'Fiber' };

  presets = [
    { name: 'ACT Basic Bonanza', download: 50, upload: 50 },
    { name: 'ACT Basic Bonanza Plus', download: 100, upload: 100 },
    { name: 'ACT Sprint Bonanza', download: 200, upload: 200 },
    { name: 'ACT Sprint Bonanza MESH WIFI POD', download: 200, upload: 200 },
    { name: 'Act Sprint Mesh Pod Bundled', download: 200, upload: 200 },
    { name: 'ACT Rapid', download: 400, upload: 400 },
    { name: 'ACT Ultra', download: 500, upload: 500 },
    { name: 'ACT Pro', download: 600, upload: 600 },
    { name: 'ACT Giga', download: 1000, upload: 1000 }
  ];

  ngOnInit() { this.reset(); }

  reset() {
    const u = this.user();
    if (!u) return;
    this.fm = {
      name: u.name, email: u.email ?? '', isp: u.plan.isp, planName: u.plan.name,
      download: u.plan.download, upload: u.plan.upload, city: u.plan.city ?? '', connType: 'Fiber'
    };
  }

  applyPreset(p: { name: string; download: number; upload: number }) {
    this.fm.planName = p.name; this.fm.download = p.download; this.fm.upload = p.upload;
  }

  save() {
    const uid = this.user()?.userId;
    if (!uid) return;
    this.saving.set(true); this.status.set('');
    this.userSvc.updateUser(uid, this.fm).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) { this.auth.patchUser(res.user); this.status.set('saved'); }
        else this.status.set('error');
        setTimeout(() => this.status.set(''), 4000);
      },
      error: () => { this.saving.set(false); this.status.set('error'); setTimeout(() => this.status.set(''), 4000); }
    });
  }
}