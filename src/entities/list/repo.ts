import * as ebisu from 'ebisu-js';

import type { ListContract } from './contract';
import type { List } from './List';
import { db } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';
import { hasMinimumIntervalPassed } from '@/dumb/duration-utils';

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

      // Check if recall probability is below threshold
      if (recallProbability >= RECALL_THRESHOLD) return false;

      // Check if minimum interval has passed since last review
      const lastReviewDate = new Date(lastReviewTimestamp);
      return hasMinimumIntervalPassed(lastReviewDate, list.minimumInterval, now);
    });

    // Use weighted selection based on priority from entity
    const weightedLists: WeightedItem<List>[] = dueLists.map((list: List) => ({
      item: list,
      weight: list.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedLists);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<List | null> {
    const allLists = await db.lists
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newLists = allLists.filter((l: List) => !existingProgressIds.includes(l.id!));

    // Use entity priority for new items
    const weightedLists: WeightedItem<List>[] = newLists.map((list: List) => ({
      item: list,
      weight: list.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedLists);
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
