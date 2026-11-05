import { Component, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { SpotifyApiService } from '../services/spotify-endpoints.services';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { OpenAIService } from '../services/openai.service';
import { ChangeDetectorRef } from '@angular/core';
import { PROMPTS } from '../util/spotify.prompts';

@Component({
  selector: 'app-tracklist',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './tracklist.html',
  styleUrl: './tracklist.scss',
})
export class TracklistComponent implements OnInit {

  playListId = '';
  isCollapsed = false;
  trackList = new Array;
  selectedItem: any = null;
  showModal = false;
  analysisResult: any = null;
  isLoadingAnalysis = false;

  constructor(
    private spotify: SpotifyApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private openAI: OpenAIService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
  }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
  
  this.route.params.pipe(
    switchMap(params => {
      return this.spotify.getPlaylistTracks(params['id']);
    })
  ).subscribe(res => {
    this.trackList = res.items.map((x: any) => x.item);
  },
);

  this.spotify.getTopArtistsShort().subscribe(res => {
    console.log(res)
    this.spotify.getArtistAlbums(res.items[0].id).subscribe(res => console.log(res))
  } 
  )
  
  this.spotify.getTopTracksShort().subscribe(res => {
      console.log(res)
      })
}

  async itemPressed(item: any) {
    this.selectedItem = item;
    this.showModal = true;
    let artists = item.album.artists.map((x: any) => x.name).join(', ');
    const prompt = PROMPTS.SINGLE_TRACK_ANALYSIS(item.name, artists, item.album.name);
    try {
      const result = await this.openAI.responseJson(prompt);
      this.analysisResult = result;
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoadingAnalysis = false;
      this.cdr.detectChanges();
    }
  }

  closeModal() {
    this.showModal = false;
    this.selectedItem = null;
  }

  getArtists(item: any): string {
    return item?.artists?.map((a: any) => a.name).join(', ') || '';
  }
}
