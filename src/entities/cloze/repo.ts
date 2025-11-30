import { State } from 'ts-fsrs';

import type { ClozeContract } from './contract';
import type { Cloze } from './Cloze';

import { db } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress/repo';

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
      return dueDate <= now;
    });

    if (dueClozes.length === 0) return null;

    // Return a random item
    const randomIndex = Math.floor(Math.random() * dueClozes.length);
    return dueClozes[randomIndex] ?? null;
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Cloze | null> {
    const allClozes = await db.clozes
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newClozes = allClozes.filter((c: Cloze) => !existingProgressIds.includes(c.id!));

    if (newClozes.length === 0) return null;

    // Return a random item
    const randomIndex = Math.floor(Math.random() * newClozes.length);
    return newClozes[randomIndex] ?? null;
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
