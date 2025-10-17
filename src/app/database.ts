import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { Card } from 'ts-fsrs';

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
  cardData?: Card;

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
