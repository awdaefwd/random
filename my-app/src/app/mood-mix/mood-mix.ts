import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { OpenAIService } from '../services/openai.service';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyPlaybackService, SpotifyTrack } from '../services/spotify-playback.service';
import { SpotifyService } from '../srv/spotify';
import { PROMPTS } from '../util/spotify.prompts';

interface MoodPreset {
  id: string;
  title: string;
  description: string;
}

interface MixTrack extends SpotifyTrack {
  id: string;
  uri: string;
}

@Component({
  selector: 'app-mood-mix',
  imports: [CommonModule, FormsModule],
  templateUrl: './mood-mix.html',
  styleUrl: './mood-mix.scss',
})
export class MoodMixComponent implements OnInit {
  readonly moods: MoodPreset[] = [
    { id: 'focus', title: 'Focus', description: 'Steady sounds for getting in the zone' },
    { id: 'night-drive', title: 'Night drive', description: 'A cinematic soundtrack for the road' },
    { id: 'workout', title: 'Workout', description: 'High-energy tracks to keep you moving' },
    { id: 'chill', title: 'Chill', description: 'An easygoing, laid-back sequence' },
  ];

  playlists: any[] = [];
  selectedPlaylistId = '';
  selectedMood = this.moods[0].id;
  mixTracks: MixTrack[] = [];
  isLoadingPlaylists = false;
  isGenerating = false;
  error = '';
  requiresLogin = false;

  get selectedPlaylist(): any | undefined {
    return this.playlists.find(playlist => playlist.id === this.selectedPlaylistId);
  }

  get selectedMoodPreset(): MoodPreset {
    return this.moods.find(mood => mood.id === this.selectedMood) || this.moods[0];
  }

  constructor(
    private spotify: SpotifyApiService,
    private spotifyService: SpotifyService,
    private openAI: OpenAIService,
    readonly playback: SpotifyPlaybackService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.isLoadingPlaylists = true;
    this.error = '';
    this.requiresLogin = false;

    this.spotify.getUserPlaylists(50).subscribe({
      next: response => {
        this.playlists = response.items || [];
        this.selectedPlaylistId = this.playlists[0]?.id || '';
        this.isLoadingPlaylists = false;
      },
      error: error => {
        console.error('Could not load playlists for Mood Mix:', error);
        this.requiresLogin = error.status === 401;
        this.error = error.status === 401
          ? 'A Spotify-munkamenet lejárt. Jelentkezz be újra.'
          : 'Most nem sikerült betölteni a playlistjeidet.';
        this.isLoadingPlaylists = false;
      },
    });
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  onSelectionChange(): void {
    this.mixTracks = [];
    this.error = '';
  }

  async createMix(): Promise<void> {
    if (!this.selectedPlaylistId || this.isGenerating) return;

    this.isGenerating = true;
    this.error = '';
    this.requiresLogin = false;
    this.mixTracks = [];

    try {
      const response = await firstValueFrom(this.spotify.getPlaylistTracks(this.selectedPlaylistId, 100));
      const tracks = this.extractTracks(response);
      if (!tracks.length) {
        this.error = 'Ebben a playlistben nem találtam lejátszható számokat.';
        return;
      }

      const result = await this.openAI.responseJson(PROMPTS.MOOD_MIX(
        this.selectedMoodPreset.title,
        tracks.map(track => ({
          id: track.id,
          name: track.name || 'Unknown track',
          artists: track.artists?.map(artist => artist.name).join(', ') || 'Unknown artist',
          album: track.album?.name || 'Unknown album',
        })),
      ));

      const trackIds = this.getOrderedTrackIds(result, tracks);
      this.mixTracks = trackIds
        .map(id => tracks.find(track => track.id === id))
        .filter((track): track is MixTrack => !!track);

      if (!this.mixTracks.length) {
        throw new Error('The AI response did not contain valid playlist track IDs.');
      }
    } catch (error) {
      console.error('Could not create Mood Mix:', error);
      this.requiresLogin = error instanceof HttpErrorResponse && error.status === 401;
      this.error = this.requiresLogin
        ? 'A Spotify-munkamenet lejárt. Jelentkezz be újra.'
        : 'Most nem sikerült összeállítani a mixet. Próbáld újra.';
    } finally {
      this.isGenerating = false;
    }
  }

  playMix(): void {
    if (this.mixTracks.length) void this.playback.playTracks(this.mixTracks, 0);
  }

  getArtists(track: SpotifyTrack): string {
    return track.artists?.map(artist => artist.name).join(', ') || 'Unknown artist';
  }

  getPlaylistTrackCount(playlist: any): number | null {
    const count = playlist.tracks?.total ?? playlist.items?.total ?? playlist.track_count;
    return Number.isFinite(count) ? count : null;
  }

  private extractTracks(response: any): MixTrack[] {
    return (response?.items || [])
      .map((entry: any) => entry.item || entry.track)
      .filter((track: any): track is MixTrack =>
        !!track && !track.is_local && typeof track.id === 'string' && typeof track.uri === 'string',
      );
  }

  private getOrderedTrackIds(result: unknown, tracks: MixTrack[]): string[] {
    let value = result;
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        return [];
      }
    }
    if (!value || typeof value !== 'object' || !('trackIds' in value)) return [];

    const validIds = new Set(tracks.map(track => track.id));
    const trackIds = (value as { trackIds?: unknown }).trackIds;
    if (!Array.isArray(trackIds)) return [];

    return [...new Set(trackIds.filter((id): id is string =>
      typeof id === 'string' && validIds.has(id),
    ))].slice(0, 15);
  }
}
