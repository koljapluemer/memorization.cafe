import type { CollectionContract } from './contract';
import type { Collection } from './Collection';
import { db } from '@/app/database';

export const collectionRepo: CollectionContract = {
  async getAll(): Promise<Collection[]> {
    return await db.collections.toArray();
  },

  async getById(id: string): Promise<Collection | undefined> {
    return await db.collections.get(id);
  },

  async create(data: Omit<Collection, 'id'>): Promise<string> {
    const id = await db.collections.add(data as Collection);
    return id;
  },

  async update(id: string, data: Partial<Collection>): Promise<void> {
    await db.collections.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.collections.delete(id);
  },
};
