import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SpotifyAuthService } from './spotify-auth.service';

export interface SpotifyTrack {
  id?: string;
  uri?: string;
  name?: string;
  artists?: Array<{ name: string }>;
  album?: {
    name?: string;
    images?: Array<{ url: string }>;
  };
}

type SpotifyPlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
  };
};

interface SpotifyPlayerEvents {
  ready: { device_id: string };
  not_ready: { device_id: string };
  player_state_changed: SpotifyPlaybackState | null;
  authentication_error: { message: string };
  account_error: { message?: string };
  initialization_error: { message: string };
  playback_error: { message: string };
}

interface SpotifyWebPlayer {
  addListener<K extends keyof SpotifyPlayerEvents>(
    event: K,
    callback: (data: SpotifyPlayerEvents[K]) => void,
  ): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
}

interface SpotifyWebPlaybackSDK {
  Player: new (options: {
    name: string;
    volume: number;
    getOAuthToken: (callback: (token: string) => void) => void;
  }) => SpotifyWebPlayer;
}

declare global {
  interface Window {
    Spotify?: SpotifyWebPlaybackSDK;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

@Injectable({ providedIn: 'root' })
export class SpotifyPlaybackService {
  readonly status = signal<'idle' | 'connecting' | 'ready' | 'error'>('idle');
  readonly currentTrack = signal<SpotifyTrack | null>(null);
  readonly isPaused = signal(true);
  readonly error = signal('');
  readonly needsLogin = signal(false);
  readonly canSkip = signal(false);

  private player: SpotifyWebPlayer | null = null;
  private deviceId: string | null = null;
  private initialization: Promise<void> | null = null;
  private sdkLoad: Promise<void> | null = null;
  private queue: string[] = [];

  constructor(
    private http: HttpClient,
    private auth: SpotifyAuthService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.status() === 'ready') {
      return Promise.resolve();
    }
    if (this.initialization) return this.initialization;

    this.error.set('');
    this.needsLogin.set(false);
    this.status.set('connecting');
    this.initialization = this.connectPlayer()
      .catch(error => {
        console.error('Spotify player initialization failed:', error);
        this.player?.disconnect();
        this.player = null;
        this.deviceId = null;
        this.status.set('error');
        this.error.set(error instanceof Error ? error.message : 'Could not connect to Spotify.');
      })
      .finally(() => {
        this.initialization = null;
      });

    return this.initialization;
  }

  async playTracks(tracks: SpotifyTrack[], selectedIndex: number): Promise<void> {
    const uris = tracks.map(track => track.uri).filter((uri): uri is string => !!uri);
    const selectedTrack = tracks[selectedIndex];
    if (!selectedTrack?.uri || !uris.length) {
      this.error.set('This track cannot be played from Spotify.');
      return;
    }

    this.error.set('');
    await this.initialize();
    if (!this.deviceId) return;

    this.queue = uris;
    this.canSkip.set(uris.length > 1);
    this.currentTrack.set(selectedTrack);
    this.isPaused.set(false);

    const queueIndex = uris.indexOf(selectedTrack.uri);
    try {
      await firstValueFrom(this.http.put(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(this.deviceId)}`,
        { uris, offset: { position: queueIndex } },
      ));
    } catch (error) {
      this.isPaused.set(true);
      this.error.set(this.playbackErrorMessage(error));
      console.error('Spotify playback request failed:', error);
    }
  }

  async togglePlayback(): Promise<void> {
    if (!this.player || !this.currentTrack()) return;
    try {
      await this.player.togglePlay();
    } catch (error) {
      this.error.set(this.playbackErrorMessage(error));
      console.error('Spotify playback toggle failed:', error);
    }
  }

  async nextTrack(): Promise<void> {
    if (!this.player || !this.canSkip()) return;
    try {
      await this.player.nextTrack();
    } catch (error) {
      this.error.set(this.playbackErrorMessage(error));
      console.error('Could not skip to the next Spotify track:', error);
    }
  }

  async previousTrack(): Promise<void> {
    if (!this.player || !this.canSkip()) return;
    try {
      await this.player.previousTrack();
    } catch (error) {
      this.error.set(this.playbackErrorMessage(error));
      console.error('Could not return to the previous Spotify track:', error);
    }
  }

  private async connectPlayer(): Promise<void> {
    const token = await firstValueFrom(this.auth.getValidAccessToken());
    if (!token) {
      this.needsLogin.set(true);
      throw new Error('Sign in to Spotify to start playback.');
    }

    await this.loadSdk();
    const sdk = window.Spotify;
    if (!sdk) throw new Error('The Spotify player could not be loaded. Refresh and try again.');

    const player = new sdk.Player({
      name: 'SYNTH Web Player',
      volume: 0.7,
      getOAuthToken: callback => {
        this.auth.getValidAccessToken().subscribe({
          next: accessToken => {
            if (accessToken) callback(accessToken);
            else {
              this.needsLogin.set(true);
              this.error.set('Your Spotify session expired. Sign in again.');
            }
          },
          error: error => {
            console.error('Could not refresh the Spotify player token:', error);
            this.error.set('Could not refresh your Spotify session. Sign in again.');
          },
        });
      },
    });
    this.player = player;

    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    let readySettled = false;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    void ready.catch(() => {});
    const readyTimeout = window.setTimeout(() => {
      if (!readySettled) {
        readySettled = true;
        rejectReady(new Error('Spotify did not provide a playback device. Try again.'));
      }
    }, 20000);

    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id;
      this.status.set('ready');
      this.error.set('');
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        resolveReady();
      }
    });
    player.addListener('not_ready', () => {
      this.deviceId = null;
      this.status.set('error');
      this.error.set('The Spotify playback device disconnected. Refresh to reconnect.');
    });
    player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
      if (!state) return;
      this.currentTrack.set(state.track_window.current_track);
      this.isPaused.set(state.paused);
    });
    player.addListener('authentication_error', ({ message }: { message: string }) => {
      this.needsLogin.set(true);
      this.error.set(`Spotify authentication failed. Sign in again. ${message}`);
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        rejectReady(new Error(this.error()));
      }
    });
    player.addListener('account_error', () => {
      const message = 'Spotify Premium is required for in-app playback.';
      this.error.set(message);
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        rejectReady(new Error(message));
      }
    });
    player.addListener('initialization_error', ({ message }: { message: string }) => {
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        rejectReady(new Error(message || 'The Spotify player could not initialize.'));
      }
    });
    player.addListener('playback_error', ({ message }: { message: string }) => {
      this.error.set(message || 'Spotify could not play this track.');
    });

    let connected = false;
    try {
      connected = await player.connect();
    } catch (error) {
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        rejectReady(error instanceof Error ? error : new Error('Could not connect to Spotify.'));
      }
    }
    if (!connected) {
      if (!readySettled) {
        readySettled = true;
        window.clearTimeout(readyTimeout);
        rejectReady(new Error('Could not connect to the Spotify playback device.'));
      }
    }
    await ready;
  }

  private loadSdk(): Promise<void> {
    if (window.Spotify) return Promise.resolve();
    if (this.sdkLoad) return this.sdkLoad;

    this.sdkLoad = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        reject(new Error('The Spotify player script took too long to load.'));
      }, 15000);
      const previousCallback = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        previousCallback?.();
        window.clearTimeout(timeout);
        resolve();
      };

      let script = document.querySelector<HTMLScriptElement>(
        'script[src="https://sdk.scdn.co/spotify-player.js"]',
      );
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        script.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error('Could not load the Spotify player script.'));
        };
        document.head.appendChild(script);
      }
    }).catch(error => {
      this.sdkLoad = null;
      throw error;
    });

    return this.sdkLoad;
  }

  private playbackErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Your Spotify session expired. Sign in again.';
      if (error.status === 403) {
        this.needsLogin.set(true);
        return 'Spotify Premium and playback permission are required. Sign in again to grant access.';
      }
      if (error.status === 404) return 'Spotify could not find the playback device. Try again.';
    }
    return 'Spotify could not start playback. Make sure Spotify is available and try again.';
  }
}
