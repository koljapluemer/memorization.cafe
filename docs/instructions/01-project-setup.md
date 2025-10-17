# Step 1: Project Setup and Dependencies

## Overview
Set up the base project structure, install dependencies, and configure the development environment.

## Prerequisites
- Node.js 18.0.0+
- npm or pnpm

## Tasks

### 1.1 Install Core Dependencies

```bash
npm install dexie dexie-cloud-addon ts-fsrs
npm install -D tailwindcss daisyui
npm install lucide-vue-next
```

### 1.2 Configure ESLint

Ensure ESLint is properly configured for Vue 3 + TypeScript:
- Use recommended Vue and TypeScript rules
- Configure to enforce clean code practices
- Ensure linter runs green (fix issues, don't disable rules)

### 1.3 Update Folder Structure

Reorganize the `src/` directory to follow Feature-Sliced Design:

```
src/
├── app/           # Global setup (router, providers, etc.)
├── dumb/          # Reusable UI components & utilities (no business logic)
├── entities/      # Domain entities (one folder per entity)
├── features/      # Feature components (can import dumb + entities only)
├── meta-features/ # Complex features (can import features + below)
└── pages/         # Page components (used by router)
```

### 1.4 Clean Up Old Files

Remove or move files that don't fit the new architecture:
- Delete old entity files from `src/entities/`
- Delete old page files
- Keep only what's needed for the new implementation

### 1.5 Configure Tailwind + DaisyUI

Ensure `tailwind.config.js` includes DaisyUI plugin:

```js
module.exports = {
  plugins: [require('daisyui')],
  // ... other config
}
```

## Validation

- [ ] All dependencies installed successfully
- [ ] ESLint runs without errors
- [ ] Folder structure matches Feature-Sliced Design pattern
- [ ] Tailwind + DaisyUI are working (test with a simple component)

## Next Step

Proceed to `02-database-setup.md` to configure Dexie and define the database schema.
