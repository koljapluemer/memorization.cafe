import type { App, InjectionKey } from 'vue';
import { inject } from 'vue';

import { MemorizationDB } from './database';
import {
  createFlashcardRepository,
  type FlashcardRepository,
} from '../entities/flashcard';
import {
  createVerbatimRepository,
  type VerbatimRepository,
} from '../entities/verbatim-item';
import {
  createCollectionRepository,
  type CollectionRepository,
} from '../entities/collection';
import {
  createLearningItemRepository,
  type LearningItemRepository,
} from '../entities/learning-item';

const flashcardRepositoryKey: InjectionKey<FlashcardRepository> = Symbol('flashcardRepository');
const verbatimRepositoryKey: InjectionKey<VerbatimRepository> = Symbol('verbatimRepository');
const collectionRepositoryKey: InjectionKey<CollectionRepository> = Symbol('collectionRepository');
const learningItemRepositoryKey: InjectionKey<LearningItemRepository> = Symbol('learningItemRepository');
const databaseKey: InjectionKey<MemorizationDB> = Symbol('database');

const db = new MemorizationDB();

const flashcardRepository = createFlashcardRepository(db);
const verbatimRepository = createVerbatimRepository(db);
const collectionRepository = createCollectionRepository(db);
const learningItemRepository = createLearningItemRepository(db);

export function registerAppProviders(app: App) {
  app.provide(flashcardRepositoryKey, flashcardRepository);
  app.provide(verbatimRepositoryKey, verbatimRepository);
  app.provide(collectionRepositoryKey, collectionRepository);
  app.provide(learningItemRepositoryKey, learningItemRepository);
  app.provide(databaseKey, db);
}

export function useFlashcardRepository(): FlashcardRepository {
  const repository = inject(flashcardRepositoryKey);
  if (!repository) {
    throw new Error('FlashcardRepository not provided');
  }
  return repository;
}

export function useVerbatimRepository(): VerbatimRepository {
  const repository = inject(verbatimRepositoryKey);
  if (!repository) {
    throw new Error('VerbatimRepository not provided');
  }
  return repository;
}

export function useCollectionRepository(): CollectionRepository {
  const repository = inject(collectionRepositoryKey);
  if (!repository) {
    throw new Error('CollectionRepository not provided');
  }
  return repository;
}

export function useLearningItemRepository(): LearningItemRepository {
  const repository = inject(learningItemRepositoryKey);
  if (!repository) {
    throw new Error('LearningItemRepository not provided');
  }
  return repository;
}

export function useDatabase(): MemorizationDB {
  const database = inject(databaseKey);
  if (!database) {
    throw new Error('Database not provided');
  }
  return database;
}
