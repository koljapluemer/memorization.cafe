const STORAGE_KEY = 'manage-open-tabs';

export function loadOpenTabs(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveOpenTabs(tabIds: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabIds));
}
