import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze, ClozeStrategy, Duration } from '@/app/database';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';
import { elaborativeInterrogationRepo } from '@/entities/elaborative-interrogation';
import { listRepo } from '@/entities/list';
import { clozeRepo } from '@/entities/cloze';

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Imports flashcards from CSV data
 */
export async function importFlashcardsFromCsv(
  data: Record<string, string>[],
  collectionId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Fetch existing flashcards in this collection
  const existingFlashcards = await simpleFlashcardRepo.getByCollectionId(collectionId);

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      const flashcard: Omit<SimpleFlashcard, 'id'> = {
        collectionId,
        front: row.front || '',
        back: row.back || '',
        practiceAsFlashcard: row.practiceAsFlashcard?.toLowerCase() === 'false' ? false : true,
        practiceAsPrompt: row.practiceAsPrompt?.toLowerCase() === 'true' ? true : false,
        practiceReverse: row.practiceReverse?.toLowerCase() === 'true' ? true : false,
        minimumInterval: row.minimumInterval && ['HOUR', 'DAY', 'TWO_DAYS', 'WEEK', 'MONTH'].includes(row.minimumInterval)
          ? (row.minimumInterval as Duration)
          : undefined,
        frontImage: row.frontImage || undefined,
        frontImageLabel: row.frontImageLabel || undefined,
        backImage: row.backImage || undefined,
        backImageLabel: row.backImageLabel || undefined,
      };

      // Check for duplicates (same front AND back, case-insensitive)
      const isDuplicate = existingFlashcards.some(
        existing =>
          existing.front.trim().toLowerCase() === flashcard.front.trim().toLowerCase() &&
          existing.back.trim().toLowerCase() === flashcard.back.trim().toLowerCase()
      );

      if (isDuplicate) {
        result.skipped++;
      } else {
        await simpleFlashcardRepo.create(flashcard);
        result.success++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Imports concepts from CSV data
 */
export async function importConceptsFromCsv(
  data: Record<string, string>[],
  collectionId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Fetch existing concepts in this collection
  const existingConcepts = await elaborativeInterrogationRepo.getByCollectionId(collectionId);

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      const concept: Omit<ElaborativeInterrogationConcept, 'id'> = {
        collectionId,
        name: row.name || '',
        description: row.description || undefined,
        minimumInterval: row.minimumInterval && ['HOUR', 'DAY', 'TWO_DAYS', 'WEEK', 'MONTH'].includes(row.minimumInterval)
          ? (row.minimumInterval as Duration)
          : 'WEEK', // Default for concepts
      };

      // Check for duplicates (same name, case-insensitive)
      const isDuplicate = existingConcepts.some(
        existing => existing.name.trim().toLowerCase() === concept.name.trim().toLowerCase()
      );

      if (isDuplicate) {
        result.skipped++;
      } else {
        await elaborativeInterrogationRepo.create(concept);
        result.success++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Imports lists from CSV data
 */
export async function importListsFromCsv(
  data: Record<string, string>[],
  collectionId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Fetch existing lists in this collection
  const existingLists = await listRepo.getByCollectionId(collectionId);

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      const items = row.items?.split('|').map(item => item.trim()).filter(item => item) || [];

      const list: Omit<List, 'id'> = {
        collectionId,
        name: row.name || '',
        items,
        isOrderedList: row.isOrderedList?.toLowerCase() === 'true' ? true : false,
        note: row.note || undefined,
        minimumInterval: row.minimumInterval && ['HOUR', 'DAY', 'TWO_DAYS', 'WEEK', 'MONTH'].includes(row.minimumInterval)
          ? (row.minimumInterval as Duration)
          : 'DAY', // Default for lists
      };

      // Check for duplicates (same name, case-insensitive)
      const isDuplicate = existingLists.some(
        existing => existing.name.trim().toLowerCase() === list.name.trim().toLowerCase()
      );

      if (isDuplicate) {
        result.skipped++;
      } else {
        await listRepo.create(list);
        result.success++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Imports clozes from CSV data
 */
export async function importClozesFromCsv(
  data: Record<string, string>[],
  collectionId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

  // Fetch existing clozes in this collection
  const existingClozes = await clozeRepo.getByCollectionId(collectionId);

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      let indices: number[] = [];
      try {
        indices = JSON.parse(row.indices || '[]');
        if (!Array.isArray(indices) || !indices.every(i => typeof i === 'number')) {
          throw new Error('indices must be an array of numbers');
        }
      } catch {
        throw new Error('Invalid indices format');
      }

      const cloze: Omit<Cloze, 'id'> = {
        collectionId,
        content: row.content || '',
        clozeStrategy: (row.clozeStrategy || 'atSpace') as ClozeStrategy,
        indices,
        preExercise: row.preExercise || undefined,
        postExercise: row.postExercise || undefined,
        minimumInterval: row.minimumInterval && ['HOUR', 'DAY', 'TWO_DAYS', 'WEEK', 'MONTH'].includes(row.minimumInterval)
          ? (row.minimumInterval as Duration)
          : undefined,
      };

      // Check for duplicates (same content AND same indices array)
      const isDuplicate = existingClozes.some(existing => {
        const sameContent = existing.content.trim().toLowerCase() === cloze.content.trim().toLowerCase();
        const sameIndices = existing.indices.length === cloze.indices.length &&
          existing.indices.every((val, idx) => val === cloze.indices[idx]);
        return sameContent && sameIndices;
      });

      if (isDuplicate) {
        result.skipped++;
      } else {
        await clozeRepo.create(cloze);
        result.success++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}
