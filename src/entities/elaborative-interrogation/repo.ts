import type { ElaborativeInterrogationContract } from './contract';

import { db, type ElaborativeInterrogationConcept } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';

function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export const elaborativeInterrogationRepo: ElaborativeInterrogationContract = {
  async getAll(): Promise<ElaborativeInterrogationConcept[]> {
    return await db.concepts.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<ElaborativeInterrogationConcept[]> {
    return await db.concepts.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<ElaborativeInterrogationConcept | undefined> {
    return await db.concepts.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<ElaborativeInterrogationConcept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allConcepts.length === 0) return null;

    const conceptIds = allConcepts.map((c: ElaborativeInterrogationConcept) => c.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(conceptIds);

    const dueConcepts = allConcepts.filter((concept: ElaborativeInterrogationConcept) => {
      const progress = progressRecords.find((p) => p.learningItemId === concept.id);
      if (!progress) return false;

      const lastAnswer = progress.answers?.[progress.answers.length - 1];
      if (!lastAnswer) return false;

      // Only return concepts that were NOT answered today
      return !isSameCalendarDay(new Date(lastAnswer.timestamp), now);
    });

    // Use weighted selection based on priority
    const weightedConcepts: WeightedItem<ElaborativeInterrogationConcept>[] = dueConcepts.map((concept: ElaborativeInterrogationConcept) => {
      const progress = progressRecords.find((p) => p.learningItemId === concept.id);
      const priority = progress?.priority ?? 5; // Default to 5 (medium priority)
      return {
        item: concept,
        weight: priority,
      };
    });

    return weightedRandomChoice(weightedConcepts);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<ElaborativeInterrogationConcept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newConcepts = allConcepts.filter((c: ElaborativeInterrogationConcept) => !existingProgressIds.includes(c.id!));

    // For new items without progress, default all to priority 5
    const weightedConcepts: WeightedItem<ElaborativeInterrogationConcept>[] = newConcepts.map((concept: ElaborativeInterrogationConcept) => ({
      item: concept,
      weight: 5, // Default priority for new items
    }));

    return weightedRandomChoice(weightedConcepts);
  },

  async create(data: Omit<ElaborativeInterrogationConcept, 'id'>): Promise<string> {
    const id = await db.concepts.add(data as ElaborativeInterrogationConcept);
    return id;
  },

  async update(id: string, data: Partial<ElaborativeInterrogationConcept>): Promise<void> {
    await db.concepts.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.concepts.delete(id);
    await learningProgressRepo.delete(id);
  },
};
