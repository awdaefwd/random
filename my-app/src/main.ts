import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import {provideRouter} from '@angular/router';
import routeConfig from './app/app.routes';
import { provideProtractorTestingSupport } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { SpotifyAuthInterceptor } from './app/services/SpotifyAuthInterceptor';
import { provideZoneChangeDetection } from '@angular/core';
import 'zone.js';

bootstrapApplication(App, 
   {
  providers: [provideZoneChangeDetection(),provideProtractorTestingSupport(), provideRouter(routeConfig), provideHttpClient(withInterceptors([SpotifyAuthInterceptor]))],
  }).catch((err) => console.error(err));