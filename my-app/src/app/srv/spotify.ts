import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {

  login() {
    // SSR protection
    if (typeof window === 'undefined') return;

    const client_id = '6ee84600c8844f2da211b99d7a3d3dfa';
    const redirect_uri = 'http://127.0.0.1:8888/callback';
    const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-top-read streaming user-modify-playback-state user-read-playback-state';

    const state = this.generateRandomString(16);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri,
      state
    });

    window.location.href =
      `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
}