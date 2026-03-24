import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<any>           { return this.http.get(`${this.api}/user/${id}`); }
  updateUser(id: string, data: any): Observable<any> { return this.http.put(`${this.api}/user/${id}`, data); }
}
