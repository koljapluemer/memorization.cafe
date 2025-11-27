import type { ConceptContract } from './contract';
import type { Concept } from './Concept';
import { db } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';
import { hasMinimumIntervalPassed } from '@/dumb/duration-utils';

function isSameCalendarDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export const conceptRepo: ConceptContract = {
  async getAll(): Promise<Concept[]> {
    return await db.concepts.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<Concept[]> {
    return await db.concepts.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<Concept | undefined> {
    return await db.concepts.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<Concept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allConcepts.length === 0) return null;

    const conceptIds = allConcepts.map((c: Concept) => c.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(conceptIds);

    const dueConcepts = allConcepts.filter((concept: Concept) => {
      const progress = progressRecords.find((p) => p.learningItemId === concept.id);
      if (!progress) return false;

      const lastAnswer = progress.answers?.[progress.answers.length - 1];
      if (!lastAnswer) return false;

      // Only return concepts that were NOT answered today
      if (isSameCalendarDay(new Date(lastAnswer.timestamp), now)) return false;

      // Check if minimum interval has passed since last answer
      const lastReviewDate = new Date(lastAnswer.timestamp);
      return hasMinimumIntervalPassed(lastReviewDate, concept.minimumInterval, now);
    });

    // Use weighted selection based on priority from entity
    const weightedConcepts: WeightedItem<Concept>[] = dueConcepts.map((concept: Concept) => ({
      item: concept,
      weight: concept.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedConcepts);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Concept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newConcepts = allConcepts.filter((c: Concept) => !existingProgressIds.includes(c.id!));

    // Use entity priority for new items
    const weightedConcepts: WeightedItem<Concept>[] = newConcepts.map((concept: Concept) => ({
      item: concept,
      weight: concept.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedConcepts);
  },

  async create(data: Omit<Concept, 'id'>): Promise<string> {
    const id = await db.concepts.add(data as Concept);
    return id;
  },

  async update(id: string, data: Partial<Concept>): Promise<void> {
    await db.concepts.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.concepts.delete(id);
    await learningProgressRepo.delete(id);
  },
};
