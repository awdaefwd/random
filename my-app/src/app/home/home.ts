import { Component, HostListener, OnInit } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyAuthService } from '../services/spotify-auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit{
  
  playlists: any[] = [];
  isCollapsed = false;

  constructor(private spotify: SpotifyApiService, private auth: SpotifyAuthService, private route: ActivatedRoute,private router: Router) {}
  
  ngOnInit(): void {
     // now safe to call API
    this.spotify.getUserProfile().subscribe({
      next:(res) => console.log(res),
      error: (err) => console.error(err)
    });

    this.spotify.getUserPlaylists().subscribe({
      next: (res) => {
        this.playlists = res.items;
      },
      error: (err) => console.error('Error fetching playlists', err)
    });
  }

  onPlaylistPress(playListId: string){
    this.router.navigate(['/tracklist', playListId]); 
  }
  

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const glow = document.querySelector('.cursor-glow') as HTMLElement;
    if (glow) {
      glow.style.transform =
        `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    }
  }

}
