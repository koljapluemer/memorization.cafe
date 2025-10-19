import type { List } from '@/app/database';

export interface ListContract {
  getAll(): Promise<List[]>;
  getByCollectionId(collectionId: string): Promise<List[]>;
  getById(id: string): Promise<List | undefined>;

  // For practice page
  getRandomDue(collectionIds: string[], now: Date): Promise<List | null>;
  getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<List | null>;

  create(data: Omit<List, 'id'>): Promise<string>;
  update(id: string, data: Partial<List>): Promise<void>;
  delete(id: string): Promise<void>;
}
