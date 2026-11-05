import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SpotifyAuthService } from './spotify-auth.service';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpotifyApiService {
  private apiUrl = 'https://api.spotify.com/v1';

  constructor(private http: HttpClient, private auth: SpotifyAuthService) {}

  getUserPlaylists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/playlists`);
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  getUserTopArtists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/top/artists`);
  }

  getUserTopTracks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me/top/tracks`);
  }

  getArtist(artistId: string
  ): Observable<any>{
    return this.http.get(`${this.apiUrl}/artists/${artistId}`);
  }

  getArtistAlbums(artistId: string
  ): Observable<any>{
    return this.http.get(`${this.apiUrl}/artists/${artistId}/albums?limit=10`);
  }

  getPlaylistTracks(playlistId: string): Observable<any> {
  // Wrap the async token in an Observable
    return this.http.get(`${this.apiUrl}/playlists/${playlistId}/items`);
  }

  getTopArtistsShort(): Observable<any>{
    return this.http.get(`${this.apiUrl}/me/top/artists?time_range=short_term`)
  }

  getTopTracksShort(): Observable<any>{
    return this.http.get(`${this.apiUrl}/me/top/tracks?time_range=short_term`)
  }

  getAudioFeatures(trackIds: string[]): Observable<any> {
    const ids = trackIds.join(',');
    return this.http.get(`${this.apiUrl}/audio-features?ids=${ids}`);
  } 
}