import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'home', renderMode: RenderMode.Client },
  { path: 'library', renderMode: RenderMode.Client },
  { path: 'discover', renderMode: RenderMode.Client },
  { path: 'mix', renderMode: RenderMode.Client },
  { path: 'tracklist/:id', renderMode: RenderMode.Client },
  { path: 'callback', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
