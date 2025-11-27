import type { Cloze } from '@/entities/cloze/Cloze';
import type { Concept } from '@/entities/concept/Concept';
import type { LearningProgress } from '@/entities/learning-progress/LearningProgress';
import type { List } from '@/entities/list/List';
import type { QuestionList } from '@/entities/question-list/QuestionList';
import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Collection } from '@/entities/collection/Collection';
import Dexie from 'dexie';
import dexieCloud from 'dexie-cloud-addon';



export class MemorizationDatabase extends Dexie {
  collections!: Dexie.Table<Collection, string>;
  flashcards!: Dexie.Table<SimpleFlashcard, string>;
  concepts!: Dexie.Table<Concept, string>;
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

    this.version(8).stores({
      collections: '@id, name',
      flashcards: '@id, collectionId, isDisabled, priority',
      concepts: '@id, collectionId, name, priority',
      lists: '@id, collectionId, name, priority',
      clozes: '@id, collectionId, priority',
      learningProgress: '@id, learningItemId, itemType, owner, introductionTimestamp',
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
