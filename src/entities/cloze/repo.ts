import { State } from 'ts-fsrs';

import type { ClozeContract } from './contract';

import { db, type Cloze } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';
import { hasMinimumIntervalPassed } from '@/dumb/duration-utils';

export const clozeRepo: ClozeContract = {
  async getAll(): Promise<Cloze[]> {
    return await db.clozes.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<Cloze[]> {
    return await db.clozes.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<Cloze | undefined> {
    return await db.clozes.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<Cloze | null> {
    const allClozes = await db.clozes
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allClozes.length === 0) return null;

    const clozeIds = allClozes.map((c: Cloze) => c.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(clozeIds);

    const dueClozes = allClozes.filter((cloze: Cloze) => {
      const progress = progressRecords.find((p) => p.learningItemId === cloze.id);
      if (!progress?.cardData) return false;

      const card = progress.cardData;

      // Check if the card is in Learning or Review state and is due
      if (card.state === State.New) return false;

      const dueDate = new Date(card.due);
      if (dueDate > now) return false;

      // Check if minimum interval has passed since last review
      const lastReviewDate = card.last_review ? new Date(card.last_review) : null;
      return hasMinimumIntervalPassed(lastReviewDate, cloze.minimumInterval, now);
    });

    // Use weighted selection based on priority
    const weightedClozes: WeightedItem<Cloze>[] = dueClozes.map((cloze: Cloze) => {
      const progress = progressRecords.find((p) => p.learningItemId === cloze.id);
      const priority = progress?.priority ?? 5; // Default to 5 (medium priority)
      return {
        item: cloze,
        weight: priority,
      };
    });

    return weightedRandomChoice(weightedClozes);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Cloze | null> {
    const allClozes = await db.clozes
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newClozes = allClozes.filter((c: Cloze) => !existingProgressIds.includes(c.id!));

    // For new items without progress, default all to priority 5
    const weightedClozes: WeightedItem<Cloze>[] = newClozes.map((cloze: Cloze) => ({
      item: cloze,
      weight: 5, // Default priority for new items
    }));

    return weightedRandomChoice(weightedClozes);
  },

  async create(data: Omit<Cloze, 'id'>): Promise<string> {
    const id = await db.clozes.add(data as Cloze);
    return id;
  },

  async update(id: string, data: Partial<Cloze>): Promise<void> {
    await db.clozes.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.clozes.delete(id);
    await learningProgressRepo.delete(id);
  },
};
