import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { SpotifyAuthService } from '../services/spotify-auth.service';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.html',
  styleUrl: './callback.scss'
})
export class CallbackComponent implements OnInit {

  authError: string | null = null;

  constructor(
    private auth: SpotifyAuthService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const fragmentParams = isPlatformBrowser(this.platformId)
        ? new URLSearchParams(window.location.hash.slice(1))
        : new URLSearchParams();
      const access_token = fragmentParams.get('access_token') || params['access_token'];
      const refresh_token = fragmentParams.get('refresh_token') || params['refresh_token'];
      const expires_in = fragmentParams.get('expires_in') || params['expires_in'];
      const { auth_error } = params;

      if (auth_error) {
        this.authError = auth_error === 'access_denied'
          ? 'A Spotify-belépést megszakítottad. Próbáld újra a bejelentkezést.'
          : 'A Spotify-belépés nem fejeződött be. Indítsd újra a bejelentkezést.';
        return;
      }

      const expiresIn = Number(expires_in);
      if (!access_token || !refresh_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
        this.authError = 'Nem érkeztek meg a Spotify-tokenek. Indítsd újra a bejelentkezést.';
        return;
      }

      this.auth.setTokens(access_token, refresh_token, expiresIn);
      if (isPlatformBrowser(this.platformId)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      void this.router.navigate(['/home']);
    });
  }

}