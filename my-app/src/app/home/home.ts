import { Component, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyService } from '../srv/spotify';
import { SpotifyPlaybackService } from '../services/spotify-playback.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  topTracks: any[] = [];
  searchQuery = '';
  isLoading = false;
  loadError = '';
  requiresLogin = false;

  get filteredTopTracks(): any[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) return this.topTracks;

    return this.topTracks.filter(track =>
      `${track.name || ''} ${this.getArtists(track)} ${track.album?.name || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  constructor(
    private spotify: SpotifyApiService,
    private spotifyService: SpotifyService,
    private playback: SpotifyPlaybackService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.loadTopTracks();
  }

  loadTopTracks(): void {
    this.isLoading = true;
    this.loadError = '';
    this.requiresLogin = false;

    this.spotify.getTopTracksShort().subscribe({
      next: response => {
        this.topTracks = response.items || [];
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching top tracks', err);
        this.requiresLogin = err.status === 401;
        this.loadError = err.status === 401
          ? 'A Spotify-munkamenet lejárt. Jelentkezz be újra.'
          : 'Most nem sikerült betölteni a Top 10 számaidat.';
        this.isLoading = false;
      },
    });
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  getArtists(track: any): string {
    return track?.artists?.map((artist: any) => artist.name).join(', ') || 'Unknown artist';
  }

  trackUrl(track: any): string {
    return track?.external_urls?.spotify || 'https://open.spotify.com/';
  }

  playTrack(track: any, index: number): void {
    void this.playback.playTracks(this.filteredTopTracks, index);
  }
}
