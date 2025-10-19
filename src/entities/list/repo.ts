import * as ebisu from 'ebisu-js';

import type { ListContract } from './contract';

import { db, type List } from '@/app/database';
import { getRandomItem } from '@/dumb/array-utils';
import { learningProgressRepo } from '@/entities/learning-progress';

const RECALL_THRESHOLD = 0.9;

export const listRepo: ListContract = {
  async getAll(): Promise<List[]> {
    return await db.lists.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<List[]> {
    return await db.lists.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<List | undefined> {
    return await db.lists.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<List | null> {
    const allLists = await db.lists
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allLists.length === 0) return null;

    const listIds = allLists.map((l: List) => l.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(listIds);

    const dueLists = allLists.filter((list: List) => {
      const progress = progressRecords.find((p) => p.learningItemId === list.id);
      if (!progress?.listData) return false;

      const { model, lastReviewTimestamp } = progress.listData;
      const elapsedHours = (now.getTime() - new Date(lastReviewTimestamp).getTime()) / (1000 * 60 * 60);
      const recallProbability = ebisu.predictRecall(model, elapsedHours, true);

      return recallProbability < RECALL_THRESHOLD;
    });

    return getRandomItem(dueLists);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<List | null> {
    const allLists = await db.lists
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newLists = allLists.filter((l: List) => !existingProgressIds.includes(l.id!));
    return getRandomItem(newLists);
  },

  async create(data: Omit<List, 'id'>): Promise<string> {
    const id = await db.lists.add(data as List);
    return id;
  },

  async update(id: string, data: Partial<List>): Promise<void> {
    await db.lists.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.lists.delete(id);
    await learningProgressRepo.delete(id);
  },
};
