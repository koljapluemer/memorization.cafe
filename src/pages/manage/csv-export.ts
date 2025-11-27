import type { SimpleFlashcard } from '@/entities/simple-flashcard/SimpleFlashcard';
import type { Concept } from '@/entities/concept/Concept';
import type { List } from '@/entities/list/List';
import type { Cloze } from '@/entities/cloze/Cloze';

/**
 * Escapes a field for CSV format
 */
function escapeCsvField(value: string | number | boolean | undefined | null): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Exports flashcards to CSV format
 */
export function exportFlashcardsToCsv(flashcards: SimpleFlashcard[]): string {
  const headers = ['front', 'back', 'practiceAsFlashcard', 'practiceAsPrompt', 'practiceReverse', 'minimumInterval'];
  const rows = flashcards.map(f => [
    escapeCsvField(f.front),
    escapeCsvField(f.back),
    escapeCsvField(f.practiceAsFlashcard ?? true),
    escapeCsvField(f.practiceAsPrompt ?? false),
    escapeCsvField(f.practiceReverse ?? false),
    escapeCsvField(f.minimumInterval || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * Exports concepts to CSV format
 */
export function exportConceptsToCsv(concepts: Concept[]): string {
  const headers = ['name', 'description', 'minimumInterval'];
  const rows = concepts.map(c => [
    escapeCsvField(c.name),
    escapeCsvField(c.description || ''),
    escapeCsvField(c.minimumInterval || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * Exports lists to CSV format
 */
export function exportListsToCsv(lists: List[]): string {
  const headers = ['name', 'items', 'isOrderedList', 'note', 'minimumInterval'];
  const rows = lists.map(l => [
    escapeCsvField(l.name),
    escapeCsvField(l.items.join('|')),
    escapeCsvField(l.isOrderedList),
    escapeCsvField(l.note || ''),
    escapeCsvField(l.minimumInterval || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * Exports clozes to CSV format
 */
export function exportClozesToCsv(clozes: Cloze[]): string {
  const headers = ['content', 'clozeStrategy', 'indices', 'preExercise', 'postExercise', 'minimumInterval'];
  const rows = clozes.map(c => [
    escapeCsvField(c.content),
    escapeCsvField(c.clozeStrategy),
    escapeCsvField(JSON.stringify(c.indices)),
    escapeCsvField(c.preExercise || ''),
    escapeCsvField(c.postExercise || ''),
    escapeCsvField(c.minimumInterval || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}
