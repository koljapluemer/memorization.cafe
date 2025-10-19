const STORAGE_KEY = 'practice-filters';

export interface PracticeFilters {
  selectedCollectionIds: string[];
  selectedItemTypes: ('flashcard' | 'concept' | 'list')[];
}

export function loadFilters(): PracticeFilters {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        selectedCollectionIds: [],
        selectedItemTypes: ['flashcard', 'concept', 'list'],
      };
    }
    return JSON.parse(stored);
  } catch {
    return {
      selectedCollectionIds: [],
      selectedItemTypes: ['flashcard', 'concept', 'list'],
    };
  }
}

export function saveFilters(filters: PracticeFilters): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}
