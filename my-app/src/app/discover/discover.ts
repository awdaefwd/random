import { Component, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyService } from '../srv/spotify';
import { OpenAIService } from '../services/openai.service';
import { PROMPTS } from '../util/spotify.prompts';

interface ListeningVibe {
  headline: string;
  persona: string;
  moods: string[];
  description: string;
}

@Component({
  selector: 'app-discover',
  imports: [CommonModule],
  templateUrl: './discover.html',
  styleUrl: './discover.scss',
})
export class DiscoverComponent implements OnInit {
  topTracks: any[] = [];
  vibe: ListeningVibe | null = null;
  isLoadingTracks = false;
  isGenerating = false;
  loadError = '';
  vibeError = '';
  requiresLogin = false;

  constructor(
    private spotify: SpotifyApiService,
    private spotifyService: SpotifyService,
    private openAI: OpenAIService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.loadTopTracks();
  }

  loadTopTracks(): void {
    this.isLoadingTracks = true;
    this.loadError = '';
    this.requiresLogin = false;

    this.spotify.getTopTracksShort().subscribe({
      next: response => {
        this.topTracks = response.items || [];
        this.isLoadingTracks = false;
      },
      error: err => {
        console.error('Error fetching tracks for Discover', err);
        this.requiresLogin = err.status === 401;
        this.loadError = err.status === 401
          ? 'A Spotify-munkamenet lejárt. Jelentkezz be újra.'
          : 'Most nem sikerült betölteni a hallgatási adataidat.';
        this.isLoadingTracks = false;
      },
    });
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  async generateVibe(): Promise<void> {
    if (!this.topTracks.length || this.isGenerating) return;

    this.isGenerating = true;
    this.vibeError = '';
    this.vibe = null;

    try {
      const result = await this.openAI.responseJson(PROMPTS.LISTENING_VIBE(
        this.topTracks.map(track => ({
          name: track.name || 'Unknown track',
          artists: track.artists?.map((artist: any) => artist.name).join(', ') || 'Unknown artist',
          album: track.album?.name || 'Unknown album',
        })),
      ));

      if (!this.isListeningVibe(result)) {
        throw new Error('The AI response did not match the listening-vibe format');
      }
      this.vibe = result;
    } catch (err) {
      console.error('Listening vibe generation failed', err);
      this.vibeError = 'A zenei hangulatod elemzése most nem sikerült. Próbáld újra később.';
    } finally {
      this.isGenerating = false;
    }
  }

  private isListeningVibe(value: unknown): value is ListeningVibe {
    if (!value || typeof value !== 'object') return false;
    const vibe = value as Partial<ListeningVibe>;
    return typeof vibe.headline === 'string'
      && typeof vibe.persona === 'string'
      && typeof vibe.description === 'string'
      && Array.isArray(vibe.moods)
      && vibe.moods.every(mood => typeof mood === 'string');
  }
}
