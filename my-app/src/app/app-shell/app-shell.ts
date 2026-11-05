import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SpotifyService } from '../srv/spotify';
import { SpotifyPlaybackService } from '../services/spotify-playback.service';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent implements OnInit {
  pointerX = 0;
  pointerY = 0;
  cursorVisible = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    readonly playback: SpotifyPlaybackService,
    private spotifyService: SpotifyService,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) void this.playback.initialize();
  }

  reconnectSpotify(): void {
    this.spotifyService.login();
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }

    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.cursorVisible = true;
  }

  @HostListener('document:pointerleave')
  onPointerLeave(): void {
    this.cursorVisible = false;
  }
}
