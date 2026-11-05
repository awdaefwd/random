import { Routes } from '@angular/router';
import { Compo } from './compo/compo';
import { CallbackComponent } from './callback/callback';
import { TracklistComponent } from './tracklist/tracklist';
import { HomeComponent } from './home/home';
import { LibraryComponent } from './library/library';
import { DiscoverComponent } from './discover/discover';
import { AppShellComponent } from './app-shell/app-shell';

const routeConfig: Routes = [
  {
    path: '',
    component: Compo,
    title: 'Compo page',
    pathMatch: 'full',
  },
  { path: 'callback', component: CallbackComponent },
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'home', component: HomeComponent, title: 'Home' },
      { path: 'library', component: LibraryComponent, title: 'Your Library' },
      { path: 'discover', component: DiscoverComponent, title: 'Discover' },
      { path: 'tracklist/:id', component: TracklistComponent },
    ],
  },
];
export default routeConfig;
