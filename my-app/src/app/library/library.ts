import { Component, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyService } from '../srv/spotify';

@Component({
  selector: 'app-library',
  imports: [CommonModule, FormsModule],
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export class LibraryComponent implements OnInit {
  playlists: any[] = [];
  searchQuery = '';
  isLoading = false;
  loadError = '';
  requiresLogin = false;

  get filteredPlaylists(): any[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) return this.playlists;

    return this.playlists.filter(playlist =>
      `${playlist.name || ''} ${playlist.description || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  constructor(
    private spotify: SpotifyApiService,
    private router: Router,
    private spotifyService: SpotifyService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.isLoading = true;
    this.loadError = '';
    this.requiresLogin = false;

    this.spotify.getUserPlaylists().subscribe({
      next: response => {
        this.playlists = response.items || [];
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching playlists', err);
        this.requiresLogin = err.status === 401;
        this.loadError = err.status === 401
          ? 'A Spotify-munkamenet lejárt. Jelentkezz be újra.'
          : 'Most nem sikerült betölteni a lejátszási listákat.';
        this.isLoading = false;
      },
    });
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  openPlaylist(playlistId: string): void {
    void this.router.navigate(['/tracklist', playlistId]);
  }
}
