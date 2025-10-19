import type { SimpleFlashcardContract } from './contract';

import { db, type SimpleFlashcard } from '@/app/database';
import { getRandomItem } from '@/dumb/array-utils';
import { learningProgressRepo } from '@/entities/learning-progress';

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
      return progress.cardData.due <= now;
    });

    return getRandomItem(dueFlashcards);
  },

  async getRandomNew(collectionIds: string[], existingProgressIds: string[]): Promise<SimpleFlashcard | null> {
    const allFlashcards = await db.flashcards
      .where('collectionId')
      .anyOf(collectionIds)
      .toArray();

    // Filter out disabled flashcards and those with existing progress
    const newFlashcards = allFlashcards.filter((f: SimpleFlashcard) => !f.isDisabled && !existingProgressIds.includes(f.id!));
    return getRandomItem(newFlashcards);
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
