import { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from './spotify-auth.service';

export const SpotifyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(SpotifyAuthService);

  if (!req.url.startsWith('https://api.spotify.com/')) {
    return next(req);
  }

  return auth.getValidAccessToken().pipe(
    switchMap(token => {
      if (!token) {
        return throwError(() => new HttpErrorResponse({
          error: 'Spotify authorization is required. Please sign in again.',
          status: 401,
          statusText: 'Unauthorized',
          url: req.url,
        }));
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(authReq);
    })
  );
};