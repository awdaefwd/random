import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  private accessTokenKey = 'spotify_access_token';
  private refreshTokenKey = 'spotify_refresh_token';
  private expiryKey = 'spotify_token_expiry';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  setTokens(access: string, refresh: string, expiresIn: number) {
    const storage = this.storage;
    if (!storage) return;

    storage.setItem(this.accessTokenKey, access);
    storage.setItem(this.refreshTokenKey, refresh);
    storage.setItem(this.expiryKey, (Date.now() + expiresIn * 1000).toString());
  }

  clearTokens() {
    const storage = this.storage;
    if (!storage) return;

    storage.removeItem(this.accessTokenKey);
    storage.removeItem(this.refreshTokenKey);
    storage.removeItem(this.expiryKey);
  }

  getValidAccessToken(): Observable<string | null> {
  const token = this.getAccessToken();
  if (token) return of(token);

  return this.refreshAccessToken();
  }

  getAccessToken(): string | null {
    const storage = this.storage;
    if (!storage) return null;

    const expiry = storage.getItem(this.expiryKey);
    if (!expiry || Date.now() > +expiry) return null;

    return storage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    const storage = this.storage;
    if (!storage) return null;

    return storage.getItem(this.refreshTokenKey);
  }

  refreshAccessToken(): Observable<string | null> {
  const refreshToken = this.getRefreshToken();
  if (!refreshToken) return of(null);

  return this.http.post<any>(
    'http://127.0.0.1:8888/api/refresh-token',
    { refresh_token: refreshToken }
  ).pipe(
    map(response => {
      const { access_token, expires_in, refresh_token: updatedRefreshToken } = response;

      if (access_token) {
        this.setTokens(access_token, updatedRefreshToken || refreshToken, expires_in);
        return access_token;
      }

      return null;
    }),
    catchError(err => {
      if (err.status === 401) {
        this.clearTokens();
      }
      console.error('Failed to refresh Spotify token:', err.status, err.error?.error || err.message);
      return of(null);
    })
  );
}

  
}