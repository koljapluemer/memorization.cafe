import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

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

export interface List {
  id?: string;
  collectionId: string;
  name: string;
  items: string[];
  isOrderedList: boolean;
  note?: string;
  realmId?: string;
}

export type ClozeStrategy = 'atSpace' | 'atEveryCharacter' | 'split';

export interface Cloze {
  id?: string;
  collectionId: string;
  preExercise?: string;
  postExercise?: string;
  content: string;
  clozeStrategy: ClozeStrategy;
  indices: number[];
  realmId?: string;
}

export interface LearningProgress {
  id?: string;
  learningItemId: string; // References flashcard, concept, list, or cloze
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  owner?: string; // Current user ID (keeps progress private)
  realmId?: string; // User's private realm

  // For flashcards (ts-fsrs Card data)
  cardData?: Card;

  // For elaborative interrogation
  answers?: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;

  // For lists (ebisu.js Model data)
  listData?: {
    model: EbisuModel;
    lastReviewTimestamp: Date;
  };
}

export class MemorizationDatabase extends Dexie {
  collections!: Dexie.Table<Collection, string>;
  flashcards!: Dexie.Table<SimpleFlashcard, string>;
  concepts!: Dexie.Table<ElaborativeInterrogationConcept, string>;
  lists!: Dexie.Table<List, string>;
  clozes!: Dexie.Table<Cloze, string>;
  learningProgress!: Dexie.Table<LearningProgress, string>;

  constructor() {
    super('MemorizationDB', { addons: [dexieCloud] });

    this.version(1).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId',
      concepts: '@id, collectionId, name',
      learningProgress: '@id, learningItemId, itemType, owner',
    });

    this.version(2).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId',
      concepts: '@id, collectionId, name',
      lists: '@id, collectionId, name',
      learningProgress: '@id, learningItemId, itemType, owner',
    });

    this.version(3).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId',
      concepts: '@id, collectionId, name',
      lists: '@id, collectionId, name',
      clozes: '@id, collectionId',
      learningProgress: '@id, learningItemId, itemType, owner',
    });

    // Configure Dexie Cloud
    const cloudUrl = import.meta.env.VITE_DEXIE_CLOUD_URL;
    if (cloudUrl) {
      this.cloud.configure({
        databaseUrl: cloudUrl,
        requireAuth: false, // Allow local-only usage
        customLoginGui: true, // Use our custom UI instead of default popup
      });
    }
  }
}

export const db = new MemorizationDatabase();
