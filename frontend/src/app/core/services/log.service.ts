import { Injectable }    from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable }    from 'rxjs';
import { environment }   from '../../../environments/environment';

export interface SpeedLog {
  _id?:           string;
  userId:         string;
  download:       number;
  upload:         number;
  latency:        number;
  category:       'Best' | 'Good' | 'Average' | 'Poor';
  planPercentage: number;
  planDownload:   number;
  planUpload:     number;
  createdAt?:     string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  save(payload: Partial<SpeedLog>): Observable<any> {
    return this.http.post(`${this.api}/logs`, payload);
  }

  getAll(userId: string, category?: string): Observable<any> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get(`${this.api}/logs/${userId}`, { params });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.api}/logs/${id}`);
  }
}
