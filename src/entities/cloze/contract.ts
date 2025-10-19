import type { Cloze } from '@/app/database';

export interface ClozeContract {
  getAll(): Promise<Cloze[]>;
  getByCollectionId(collectionId: string): Promise<Cloze[]>;
  getById(id: string): Promise<Cloze | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<Cloze | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Cloze | null>;

  create(data: Omit<Cloze, 'id'>): Promise<string>;
  update(id: string, data: Partial<Cloze>): Promise<void>;
  delete(id: string): Promise<void>;
}
