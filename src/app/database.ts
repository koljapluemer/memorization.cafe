import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import type { Card } from 'ts-fsrs';
import type { Model as EbisuModel } from 'ebisu-js';

export interface Collection {
  id?: string;
  name: string;
  description?: string;
}

export type Duration = "HOUR" | "DAY" | "TWO_DAYS" | "WEEK" | "MONTH" 

export interface SimpleFlashcard {
  id?: string;
  collectionId: string;
  front: string;
  back: string;
  practiceAsFlashcard: boolean;
  practiceAsPrompt: boolean;
  practiceReverse?: boolean;
  isDisabled?: boolean;
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
  frontImage?: string;
  frontImageLabel?: string;
  backImage?: string;
  backImageLabel?: string;
}

export interface ElaborativeInterrogationConcept {
  id?: string;
  collectionId: string;
  name: string;
  description?: string;
  questionListId?: string; // References QuestionList.id
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}

export interface List {
  id?: string;
  collectionId: string;
  name: string;
  items: string[];
  isOrderedList: boolean;
  note?: string;
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}

export interface QuestionList {
  id?: string;
  name: string;
  questions: string[];
  isDefault: boolean;
  minimumInterval?: Duration;
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
  minimumInterval?: Duration;
  priority?: number; // 1-10, defaults to 5. Affects selection weighting linearly.
}

export interface LearningProgress {
  id?: string;
  learningItemId: string; // References flashcard, concept, list, or cloze
  itemType: 'flashcard' | 'concept' | 'list' | 'cloze';
  owner?: string; // Current user ID (keeps progress private)

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

  // Helper note for remembering the item
  helperNote?: string;
}

export class MemorizationDatabase extends Dexie {
  collections!: Dexie.Table<Collection, string>;
  flashcards!: Dexie.Table<SimpleFlashcard, string>;
  concepts!: Dexie.Table<ElaborativeInterrogationConcept, string>;
  lists!: Dexie.Table<List, string>;
  clozes!: Dexie.Table<Cloze, string>;
  learningProgress!: Dexie.Table<LearningProgress, string>;
  questionLists!: Dexie.Table<QuestionList, string>;

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

    this.version(4).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId',
      concepts: '@id, collectionId, name',
      lists: '@id, collectionId, name',
      clozes: '@id, collectionId',
      learningProgress: '@id, learningItemId, itemType, owner',
      questionLists: '@id, name, isDefault',
    });

    this.version(5).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId, isDisabled',
      concepts: '@id, collectionId, name',
      lists: '@id, collectionId, name',
      clozes: '@id, collectionId',
      learningProgress: '@id, learningItemId, itemType, owner',
      questionLists: '@id, name, isDefault',
    });

    this.version(6).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId, isDisabled',
      concepts: '@id, collectionId, name',
      lists: '@id, collectionId, name',
      clozes: '@id, collectionId',
      learningProgress: '@id, learningItemId, itemType, owner, priority',
      questionLists: '@id, name, isDefault',
    });

    this.version(7).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId, isDisabled, priority',
      concepts: '@id, collectionId, name, priority',
      lists: '@id, collectionId, name, priority',
      clozes: '@id, collectionId, priority',
      learningProgress: '@id, learningItemId, itemType, owner',
      questionLists: '@id, name, isDefault',
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
