import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { SpotifyAuthService } from '../services/spotify-auth.service';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.html',
  styleUrl: './callback.scss'
})
export class CallbackComponent implements OnInit {

  playlists: any[] = [];
  isCollapsed = false;

  constructor(private auth: SpotifyAuthService, private route: ActivatedRoute,private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
    const access_token = params['access_token'];
    const refresh_token = params['refresh_token'];
    const expires_in = params['expires_in'];

    console.log(access_token)

    if (access_token && refresh_token) {
      console.log(access_token)
      console.log(refresh_token)
      this.auth.setTokens(access_token, refresh_token, Number(expires_in));
    }

    this.router.navigate(['/home']);
  })
  }

}