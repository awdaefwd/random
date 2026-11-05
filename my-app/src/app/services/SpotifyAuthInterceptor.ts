import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SpotifyAuthService } from './spotify-auth.service';

export const SpotifyAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(SpotifyAuthService);

if (req.url.includes('/api/refresh-token')) {
    return next(req);
  }

  return auth.getValidAccessToken().pipe(
    switchMap(token => {
      if (!token) {
        return next(req);
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