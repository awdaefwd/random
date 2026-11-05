import { Component, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { OpenAIService } from '../services/openai.service';
import { ChangeDetectorRef } from '@angular/core';
import { PROMPTS } from '../util/spotify.prompts';
import { SpotifyService } from '../srv/spotify';
import { SpotifyPlaybackService } from '../services/spotify-playback.service';

@Component({
  selector: 'app-tracklist',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './tracklist.html',
  styleUrl: './tracklist.scss',
})
export class TracklistComponent implements OnInit {

  playListId = '';
  isCollapsed = false;
  trackList: any[] = [];
  selectedItem: any = null;
  showModal = false;
  analysisResult: any = null;
  isLoadingAnalysis = false;
  analysisError = '';
  searchQuery = '';
  isLoadingTracks = false;
  trackError = '';
  trackRequiresLogin = false;

  get filteredTracks(): any[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) return this.trackList;

    return this.trackList.filter(item =>
      `${item.name || ''} ${this.getArtists(item)} ${item.album?.name || ''}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  constructor(
    private spotify: SpotifyApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private openAI: OpenAIService,
    private router: Router,
    private spotifyService: SpotifyService,
    private playback: SpotifyPlaybackService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

  this.isLoadingTracks = true;
  this.route.params.pipe(
    switchMap(params => this.spotify.getPlaylistTracks(params['id'])),
  ).subscribe({
    next: response => {
      this.trackList = (response.items || [])
        .map((entry: any) => entry.item || entry.track)
        .filter((item: any) => item && !item.is_local);
      this.isLoadingTracks = false;
    },
    error: err => {
      console.error('Error fetching playlist tracks', err);
      this.trackRequiresLogin = err.status === 401;
      this.trackError = err.status === 401
        ? 'A Spotify-munkamenet lejárt. Térj vissza, és jelentkezz be újra.'
        : 'Most nem sikerült betölteni a számokat.';
      this.isLoadingTracks = false;
    },
  });
}

  async itemPressed(item: any) {
    this.selectedItem = item;
    this.showModal = true;
  this.analysisResult = null;
  this.analysisError = '';
  this.isLoadingAnalysis = true;
  const prompt = PROMPTS.SINGLE_TRACK_ANALYSIS(
    item.name || 'Unknown track',
    this.getArtists(item) || 'Unknown artist',
    item.album?.name || 'Unknown album',
  );
  try {
    const result = await this.openAI.responseJson(prompt);
    this.analysisResult = result;
  } catch (err) {
    console.error('Track analysis failed', err);
    this.analysisError = 'A szám elemzése most nem sikerült. Próbáld újra később.';
  } finally {
    this.isLoadingAnalysis = false;
    this.cdr.detectChanges();
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedItem = null;
    this.analysisError = '';
  }

  getArtists(item: any): string {
    return item?.artists?.map((a: any) => a.name).join(', ') || '';
  }

  formatDuration(durationMs: number | null | undefined): string {
    if (!Number.isFinite(durationMs) || !durationMs || durationMs < 0) return '--:--';
    const totalSeconds = Math.floor(durationMs / 1000);
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  }

  backToPlaylists(): void {
    void this.router.navigate(['/home']);
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  playTrack(item: any, index: number): void {
    void this.playback.playTracks(this.filteredTracks, index);
  }
}
