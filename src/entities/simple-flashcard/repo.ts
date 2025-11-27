import type { SimpleFlashcardContract } from './contract';
import type { SimpleFlashcard } from './SimpleFlashcard';
import { db } from '@/app/database';
import { learningProgressRepo } from '@/entities/learning-progress/repo';
import { weightedRandomChoice, type WeightedItem } from '@/dumb/weighted-random';
import { hasMinimumIntervalPassed } from '@/dumb/duration-utils';

export const simpleFlashcardRepo: SimpleFlashcardContract = {
  async getAll(): Promise<SimpleFlashcard[]> {
    return await db.flashcards.toArray();
  },

  async getByCollectionId(collectionId: string): Promise<SimpleFlashcard[]> {
    return await db.flashcards.where('collectionId').equals(collectionId).toArray();
  },

  async getById(id: string): Promise<SimpleFlashcard | undefined> {
    return await db.flashcards.get(id);
  },

  async getRandomDue(collectionIds: string[], now: Date): Promise<SimpleFlashcard | null> {
    const allFlashcards = await db.flashcards
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    if (allFlashcards.length === 0) return null;

    // Filter out disabled flashcards
    const enabledFlashcards = allFlashcards.filter((f: SimpleFlashcard) => !f.isDisabled);

    const flashcardIds = enabledFlashcards.map((f: SimpleFlashcard) => f.id!);
    const progressRecords = await learningProgressRepo.getAllProgressForItems(flashcardIds);

    const dueFlashcards = enabledFlashcards.filter((flashcard: SimpleFlashcard) => {
      const progress = progressRecords.find((p: { learningItemId: string }) => p.learningItemId === flashcard.id);
      if (!progress?.cardData) return false;

      // Check if card is due according to FSRS
      if (progress.cardData.due > now) return false;

      // Check if minimum interval has passed since last review
      const lastReviewDate = progress.cardData.last_review ? new Date(progress.cardData.last_review) : null;
      return hasMinimumIntervalPassed(lastReviewDate, flashcard.minimumInterval, now);
    });

    // Use weighted selection based on priority from entity
    const weightedFlashcards: WeightedItem<SimpleFlashcard>[] = dueFlashcards.map((flashcard: SimpleFlashcard) => ({
      item: flashcard,
      weight: flashcard.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedFlashcards);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<SimpleFlashcard | null> {
    const allFlashcards = await db.flashcards
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    // Filter out disabled flashcards and those with existing progress
    const newFlashcards = allFlashcards.filter((f: SimpleFlashcard) => !f.isDisabled && !existingProgressIds.includes(f.id!));

    // Use entity priority for new items
    const weightedFlashcards: WeightedItem<SimpleFlashcard>[] = newFlashcards.map((flashcard: SimpleFlashcard) => ({
      item: flashcard,
      weight: flashcard.priority ?? 5, // Default to 5 (medium priority)
    }));

    return weightedRandomChoice(weightedFlashcards);
  },

  async create(data: Omit<SimpleFlashcard, 'id'>): Promise<string> {
    const id = await db.flashcards.add(data as SimpleFlashcard);
    return id;
  },

  async update(id: string, data: Partial<SimpleFlashcard>): Promise<void> {
    await db.flashcards.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.flashcards.delete(id);
    await learningProgressRepo.delete(id);
  },
};
