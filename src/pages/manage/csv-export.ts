import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';

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
  const headers = ['front', 'back', 'practiceAsFlashcard', 'practiceAsPrompt'];
  const rows = flashcards.map(f => [
    escapeCsvField(f.front),
    escapeCsvField(f.back),
    escapeCsvField(f.practiceAsFlashcard ?? true),
    escapeCsvField(f.practiceAsPrompt ?? false),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * Exports concepts to CSV format
 */
export function exportConceptsToCsv(concepts: ElaborativeInterrogationConcept[]): string {
  const headers = ['name', 'description'];
  const rows = concepts.map(c => [
    escapeCsvField(c.name),
    escapeCsvField(c.description || ''),
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
  const headers = ['name', 'items', 'isOrderedList', 'note'];
  const rows = lists.map(l => [
    escapeCsvField(l.name),
    escapeCsvField(l.items.join('|')),
    escapeCsvField(l.isOrderedList),
    escapeCsvField(l.note || ''),
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
  const headers = ['content', 'clozeStrategy', 'indices', 'preExercise', 'postExercise'];
  const rows = clozes.map(c => [
    escapeCsvField(c.content),
    escapeCsvField(c.clozeStrategy),
    escapeCsvField(JSON.stringify(c.indices)),
    escapeCsvField(c.preExercise || ''),
    escapeCsvField(c.postExercise || ''),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}
