import { Injectable, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Router }             from '@angular/router';
import { tap }                from 'rxjs/operators';
import { Observable }         from 'rxjs';
import { environment }        from '../../../environments/environment';

export interface Plan {
  name: string; download: number; upload: number; isp: string; city: string;
}
export interface User {
  userId: string; name: string; email: string; plan: Plan;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private TK = 'np_token';
  private UK = 'np_user';

  currentUser = signal<User | null>(this._load());

  constructor(private http: HttpClient, private router: Router) {}

  login(userId: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { userId, password })
      .pipe(tap(res => {
        if (res.success) {
          localStorage.setItem(this.TK, res.token);
          localStorage.setItem(this.UK, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }
      }));
  }

  logout(): void {
    localStorage.removeItem(this.TK);
    localStorage.removeItem(this.UK);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem(this.TK); }
  isLoggedIn(): boolean     { return !!this.getToken(); }

  patchUser(user: User): void {
    localStorage.setItem(this.UK, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private _load(): User | null {
    try { return JSON.parse(localStorage.getItem(this.UK) || 'null'); }
    catch { return null; }
  }
}
