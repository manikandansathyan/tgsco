import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {

private readonly baseUrl = 'https://tgsco.onrender.com/api/v1';

  constructor(private http: HttpClient) {}

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          sessionStorage.setItem('accessToken', response.accessToken);
          sessionStorage.setItem('refreshToken', response.refreshToken);
        }),
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Refresh token not found. Please log in again.');
    }

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem('accessToken', response.accessToken);
          sessionStorage.setItem('refreshToken', response.refreshToken);
        }),
      );
  }

  logout(): Observable<unknown> {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
      this.clearAuth();
      return new Observable((subscriber) => {
        subscriber.next(null);
        subscriber.complete();
      });
    }

    return this.http
      .post(`${this.baseUrl}/auth/logout`, { refreshToken })
      .pipe(finalize(() => this.clearAuth()));
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private clearAuth(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }
}

