import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AiPanelService {
  open = signal(false);
  toggle() { this.open.update(v => !v); }
  close()  { this.open.set(false); }
}
