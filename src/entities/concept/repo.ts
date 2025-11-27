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

  async getRandomFromLongestUnseen(collectionIds: string[], now: Date, limit: number = 10): Promise<Concept | null> {
    // 1. Get all concepts from active collections
    const allConcepts = await db.concepts
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allConcepts.length === 0) return null;

    // 2. Get progress for all concepts
    const conceptIds = allConcepts.map((c: Concept) => c.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(conceptIds);

    // 3. Build array with last seen timestamps
    const conceptsWithTimestamp = allConcepts.map((concept: Concept) => {
      const progress = progressRecords.find(p => p.learningItemId === concept.id);

      // No progress = never seen (treat as oldest possible)
      if (!progress || !progress.answers || progress.answers.length === 0) {
        return {
          concept,
          lastSeenTime: 0  // Epoch = longest ago
        };
      }

      const lastAnswer = progress.answers[progress.answers.length - 1];
      if (!lastAnswer) {
        // No last answer, treat as never seen
        return {
          concept,
          lastSeenTime: 0
        };
      }

      const lastSeenDate = new Date(lastAnswer.timestamp);

      // Filter out concepts seen today (daily limit)
      if (isSameCalendarDay(lastSeenDate, now)) {
        return null;  // Seen today, exclude
      }

      return {
        concept,
        lastSeenTime: lastSeenDate.getTime()
      };
    }).filter(item => item !== null) as Array<{ concept: Concept; lastSeenTime: number }>;

    if (conceptsWithTimestamp.length === 0) return null;

    // 4. Sort by lastSeenTime ascending (oldest first)
    conceptsWithTimestamp.sort((a, b) => a.lastSeenTime - b.lastSeenTime);

    // 5. Take top N (default 10) longest unseen
    const topUnseen = conceptsWithTimestamp.slice(0, Math.min(limit, conceptsWithTimestamp.length));

    // 6. Pick randomly from top N
    const randomIndex = Math.floor(Math.random() * topUnseen.length);
    return topUnseen[randomIndex]?.concept ?? null;
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
