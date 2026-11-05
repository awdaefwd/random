# MyApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Local API backend

The API backend keeps OpenAI and Spotify credentials out of the browser. Copy
`spotify-backend/.env.example` to `spotify-backend/.env` and set your credentials
there. The `.env` file is ignored by Git and must not be committed.

Start the backend from `spotify-backend` with `node server.js`, then start the
Angular app from this directory with `ng serve`.

## App pages

- **Home** shows your 10 most-played tracks from Spotify's short-term range (roughly the last four weeks).
- **Library** lists and searches your Spotify playlists.
- **Discover** creates a playful AI listening-vibe card from the names of your recent top tracks.
- **Playback** uses Spotify's Web Playback SDK and requires Spotify Premium. After granting the new playback permissions, sign in again so Spotify can issue an updated token.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
