import type { SimpleFlashcard } from './SimpleFlashcard';

export interface SimpleFlashcardContract {
  getAll(): Promise<SimpleFlashcard[]>;
  getByCollectionId(collectionId: string): Promise<SimpleFlashcard[]>;
  getById(id: string): Promise<SimpleFlashcard | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<SimpleFlashcard | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<SimpleFlashcard | null>;

  create(data: Omit<SimpleFlashcard, 'id'>): Promise<string>;
  update(id: string, data: Partial<SimpleFlashcard>): Promise<void>;
  delete(id: string): Promise<void>;
}
