import { Routes } from '@angular/router';
import { Compo } from './compo/compo';
import { CallbackComponent } from './callback/callback';
import { TracklistComponent } from './tracklist/tracklist';
import { HomeComponent } from './home/home';

const routeConfig: Routes = [
  {
    path: '',
    component: Compo,
    title: 'Compo page',
  },
  { path: 'callback', component: CallbackComponent },
  { path: 'home', component: HomeComponent },
  { path: 'tracklist/:id', component: TracklistComponent },
];
export default routeConfig;
