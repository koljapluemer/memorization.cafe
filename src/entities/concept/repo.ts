import type { ConceptContract } from './contract';
import type { Concept } from './Concept';
import { db } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress/repo';

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
      return !isSameCalendarDay(new Date(lastAnswer.timestamp), now);
    });

    if (dueConcepts.length === 0) return null;

    // Return a random item
    const randomIndex = Math.floor(Math.random() * dueConcepts.length);
    return dueConcepts[randomIndex] ?? null;
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<Concept | null> {
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    const newConcepts = allConcepts.filter((c: Concept) => !existingProgressIds.includes(c.id!));

    if (newConcepts.length === 0) return null;

    // Return a random item
    const randomIndex = Math.floor(Math.random() * newConcepts.length);
    return newConcepts[randomIndex] ?? null;
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
