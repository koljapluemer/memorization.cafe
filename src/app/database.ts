import Dexie, { type Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';

import type { FlashcardRecord } from '../entities/flashcard';
import type { VerbatimItemRecord } from '../entities/verbatim-item';
import type { CollectionRecord } from '../entities/collection';
import type { LearningItemRecord } from '../entities/learning-item';

export class MemorizationDB extends Dexie {
  flashcards!: Table<FlashcardRecord, string>;
  verbatimItems!: Table<VerbatimItemRecord, string>;
  collections!: Table<CollectionRecord, string>;
  learningItems!: Table<LearningItemRecord, string>;

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

    this.version(4).stores({
      flashcards: '@id, updatedAt, nextReview, createdAt',
      verbatimItems: '@id, updatedAt, nextReview, createdAt',
    });

    this.version(5).stores({
      flashcards: '@id, updatedAt, nextReview, createdAt, learningItemId',
      verbatimItems: '@id, updatedAt, nextReview, createdAt, learningItemId',
      collections: '@id, updatedAt, createdAt',
      learningItems: '@id, updatedAt, createdAt, collectionId',
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
