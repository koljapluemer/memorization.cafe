import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

import type { FlashcardRecord } from '../entities/flashcard';
import type { VerbatimItemRecord } from '../entities/verbatim-item';

export class MemorizationDB extends Dexie {
  flashcards!: Table<FlashcardRecord, string>;
  verbatimItems!: Table<VerbatimItemRecord, string>;

  constructor() {
    super('memorizationCafe', { addons: [dexieCloud] });
    this.version(1).stores({
      flashcards: '@id, nextReview, createdAt',
      verbatimItems: '@id, nextReview, createdAt',
    });

    this.version(2).stores({
      flashcards: 'id, nextReview, createdAt',
      verbatimItems: 'id, nextReview, createdAt',
    });

    this.version(3).stores({
      flashcards: 'id, updatedAt, nextReview, createdAt',
      verbatimItems: 'id, updatedAt, nextReview, createdAt',
    });

    // Configure Dexie Cloud - this is app-level config, not user-level
    const databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL;
    if (databaseUrl && this.cloud.configure) {
      this.cloud.configure({
        databaseUrl,
        requireAuth: false, // Users can use app offline, login is optional
      });
    }
  }
}
