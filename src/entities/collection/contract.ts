import type { Collection } from './Collection';

export interface CollectionContract {
  getAll(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | undefined>;
  create(data: Omit<Collection, 'id'>): Promise<string>;
  update(id: string, data: Partial<Collection>): Promise<void>;
  delete(id: string): Promise<void>;
}
