# Step 2: Database and Schema Setup

## Overview
Configure Dexie with Dexie Cloud and define the database schema for all entities.

## Tasks

### 2.1 Create Database Instance

Create `src/app/database.ts`:

```typescript
import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

export interface Collection {
  id?: string;
  name: string;
  description?: string;
  realmId?: string; // For future sharing functionality
}

export interface SimpleFlashcard {
  id?: string;
  collectionId: string;
  front: string;
  back: string;
  realmId?: string;
}

export interface ElaborativeInterrogationConcept {
  id?: string;
  collectionId: string;
  name: string;
  description?: string;
  realmId?: string;
}

export interface LearningProgress {
  id?: string;
  learningItemId: string; // References flashcard or concept
  itemType: 'flashcard' | 'concept';
  owner?: string; // Current user ID (keeps progress private)
  realmId?: string; // User's private realm

  // For flashcards (ts-fsrs Card data)
  cardData?: {
    due: Date;
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
    last_review?: Date;
  };

  // For elaborative interrogation
  answers?: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
}

export class MemorizationDatabase extends Dexie {
  collections!: Dexie.Table<Collection, string>;
  flashcards!: Dexie.Table<SimpleFlashcard, string>;
  concepts!: Dexie.Table<ElaborativeInterrogationConcept, string>;
  learningProgress!: Dexie.Table<LearningProgress, string>;

  constructor() {
    super('MemorizationDB', { addons: [dexieCloud] });

    this.version(1).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId',
      concepts: '@id, collectionId, name',
      learningProgress: '@id, learningItemId, itemType, owner',
    });
  }
}

export const db = new MemorizationDatabase();
```

### 2.2 Configure Dexie Cloud (Optional)

For now, leave cloud sync optional. Add configuration when needed:

```typescript
// In database.ts, after db initialization:
// db.cloud.configure({
//   databaseUrl: 'YOUR_DATABASE_URL',
//   requireAuth: false, // Allow offline usage
// });
```

### 2.3 Create Database Provider

Create `src/app/providers.ts`:

```typescript
import { db } from './database';

// Make database available to the app
export function initializeDatabase() {
  return db;
}

// Helper to get current user ID (for future use)
export function getCurrentUserId(): string | undefined {
  return db.cloud.currentUserId;
}
```

### 2.4 Update App Entry Point

Ensure database is initialized in `src/main.ts`:

```typescript
import { initializeDatabase } from './app/providers';

const db = initializeDatabase();

// ... rest of app setup
```

## Database Schema Notes

- All entities use `@id` for auto-generated IDs by Dexie
- `realmId` is included for future sharing features (not implemented now)
- `LearningProgress` uses `owner` field to keep progress private per user
- Progress is keyed by `learningItemId` to join with flashcards/concepts

## Validation

- [ ] Database file created with proper TypeScript interfaces
- [ ] All tables defined in schema
- [ ] Database initializes without errors
- [ ] Can create/read test records in browser DevTools

## Next Step

Proceed to `03-collection-entity.md` to implement the Collection entity.
