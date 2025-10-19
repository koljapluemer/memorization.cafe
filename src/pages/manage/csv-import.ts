import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze, ClozeStrategy } from '@/app/database';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';
import { elaborativeInterrogationRepo } from '@/entities/elaborative-interrogation';
import { listRepo } from '@/entities/list';
import { clozeRepo } from '@/entities/cloze';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Imports flashcards from CSV data
 */
export async function importFlashcardsFromCsv(
  data: Record<string, string>[],
  collectionId: string
): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      const flashcard: Omit<SimpleFlashcard, 'id'> = {
        collectionId,
        front: row.front || '',
        back: row.back || '',
        practiceAsFlashcard: row.practiceAsFlashcard?.toLowerCase() === 'false' ? false : true,
        practiceAsPrompt: row.practiceAsPrompt?.toLowerCase() === 'true' ? true : false,
      };

      await simpleFlashcardRepo.create(flashcard);
      result.success++;
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
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < data.length; i++) {
    const row = data[i]!;
    try {
      const concept: Omit<ElaborativeInterrogationConcept, 'id'> = {
        collectionId,
        name: row.name || '',
        description: row.description || undefined,
      };

      await elaborativeInterrogationRepo.create(concept);
      result.success++;
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
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

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
      };

      await listRepo.create(list);
      result.success++;
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
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

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
      };

      await clozeRepo.create(cloze);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}
