import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SpotifyAuthService } from './spotify-auth.service';
import { from, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LastFMApiService {
  private apiUrl = 'https://ws.audioscrobbler.com/2.0/';
  private apiKey = '2e747aba54e15780b0fdc8af0978c0df'

  constructor(private http: HttpClient, private auth: SpotifyAuthService) {}

    getSimilairArtists(artist: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/?method=artist.getsimilar&artist=${artist}&api_key=${this.apiKey}&format=json`);
    }

    getSimilairTracks(track: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/?method=track.getsimilar&artist=Primate&track=thrive&api_key=${this.apiKey}&format=json`);
    }
}