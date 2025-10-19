# memorization.cafe

A spaced repetition learning application built with Vue 3, TypeScript, and Vite.

## Features

- Multiple learning item types: flashcards, elaborative interrogation concepts, and lists
- Intelligent spaced repetition using ts-fsrs (flashcards) and ebisu.js (lists)
- Markdown support for content
- Offline-capable PWA with Dexie.js for local storage
- Optional cloud sync via Dexie Cloud

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

**Important**: The build process includes a postinstall script that patches the `ebisu-js` library to fix TypeScript compilation issues. This runs automatically on `npm install`.

## Deployment (Netlify, Vercel, etc.)

**Build Command**: `npm run build`
**Publish Directory**: `dist`

The postinstall script runs automatically during `npm install`, so the standard build command works for all deployment platforms.
