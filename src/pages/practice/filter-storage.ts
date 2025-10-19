const STORAGE_KEY = 'practice-filters';

export interface PracticeFilters {
  excludedCollectionIds: string[];
  excludedItemTypes: ('flashcard' | 'concept' | 'list' | 'cloze')[];
}

export function loadFilters(): PracticeFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        excludedCollectionIds: [],
        excludedItemTypes: [],
      };
    }

    const parsed = JSON.parse(stored);

    // Check if this is the old format (has selectedCollectionIds/selectedItemTypes)
    if ('selectedCollectionIds' in parsed || 'selectedItemTypes' in parsed) {
      // Migration: old format tracked inclusions, we can't perfectly migrate this
      // so we'll just reset to default (nothing excluded = everything included)
      return {
        excludedCollectionIds: [],
        excludedItemTypes: [],
      };
    }

    return parsed as PracticeFilters;
  } catch {
    return {
      excludedCollectionIds: [],
      excludedItemTypes: [],
    };
  }
}

export function saveFilters(filters: PracticeFilters): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}
