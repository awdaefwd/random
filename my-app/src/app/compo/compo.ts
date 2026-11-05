import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../srv/spotify';

@Component({
  selector: 'app-compo',
  standalone: true,
  imports: [],
  templateUrl: './compo.html',
  styleUrl: './compo.scss',
})
export class Compo implements OnInit {

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    //this.loginFunc();
  }

  async loginFunc (){
    this.spotifyService.login();
    }

}