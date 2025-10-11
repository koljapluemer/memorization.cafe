import { liveQuery, type Observable, type Table } from 'dexie';

import { parseCsv, toCsv, downloadCsv } from '../../dumb/csv-utils';

export interface FlashcardRecord {
  id: string;
  front: string;
  back: string;
  learningItemId: string;
  learningProgressId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardDraft {
  front: string;
  back: string;
  learningItemId: string;
}

export type FlashcardRepository = {
  watchAll: () => Observable<FlashcardRecord[]>;
  get: (id: string) => Promise<FlashcardRecord | undefined>;
  create: (draft: FlashcardDraft) => Promise<string>;
  update: (id: string, draft: FlashcardDraft) => Promise<void>;
  updateProgressId: (id: string, progressId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importFromCsv: (csvText: string, learningItemId?: string) => Promise<number>;
  downloadDemoCsv: () => void;
};

function createRecordFromDraft(draft: FlashcardDraft): Omit<FlashcardRecord, 'id'> {
  const now = new Date();
  return {
    front: draft.front.trim(),
    back: draft.back.trim(),
    learningItemId: draft.learningItemId,
    learningProgressId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function sanitizeDraft(draft: FlashcardDraft): FlashcardDraft {
  return {
    front: draft.front.trim(),
    back: draft.back.trim(),
    learningItemId: draft.learningItemId,
  };
}

export function createFlashcardRepository(db: {
  flashcards: Table<FlashcardRecord, string>;
  learningItems: Table<{ id?: string; name: string; description: string; collectionId: string | null; createdAt: string; updatedAt: string }, string>;
}): FlashcardRepository {
  const { flashcards, learningItems } = db;

  return {
    watchAll(): Observable<FlashcardRecord[]> {
      return liveQuery(() => flashcards.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return flashcards.get(id);
    },
    async create(draft: FlashcardDraft) {
      const record = createRecordFromDraft(draft);
      const id = await flashcards.add(record as FlashcardRecord);
      return id;
    },
    async update(id: string, draft: FlashcardDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await flashcards.update(id, {
        front: sanitized.front,
        back: sanitized.back,
        learningItemId: sanitized.learningItemId,
        updatedAt: nowIso,
      });
    },
    async updateProgressId(id: string, progressId: string) {
      await flashcards.update(id, {
        learningProgressId: progressId,
      });
    },
    remove(id: string) {
      return flashcards.delete(id);
    },
    async importFromCsv(csvText: string, learningItemId?: string): Promise<number> {
      const rows = parseCsv(csvText);
      if (rows.length === 0) return 0;

      const hasHeader = rows[0]?.[0]?.toLowerCase() === 'front';
      const dataRows = hasHeader ? rows.slice(1) : rows;

      let actualLearningItemId = learningItemId;
      if (!actualLearningItemId) {
        const now = new Date();
        const itemRecord = {
          name: 'Imported Flashcards',
          description: `Imported on ${now.toLocaleString()}`,
          collectionId: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        actualLearningItemId = (await learningItems.add(itemRecord)) as string;
      }

      let imported = 0;
      for (const row of dataRows) {
        if (row.length >= 2 && row[0] && row[1]) {
          const draft: FlashcardDraft = {
            front: row[0].trim(),
            back: row[1].trim(),
            learningItemId: actualLearningItemId,
          };
          if (draft.front && draft.back) {
            const record = createRecordFromDraft(draft);
            await flashcards.add(record as FlashcardRecord);
            imported++;
          }
        }
      }
      return imported;
    },
    downloadDemoCsv(): void {
      const demo = [
        ['front', 'back'],
        ['What is the capital of France?', 'Paris'],
        ['Define "algorithm"', 'A step-by-step procedure for solving a problem'],
      ];
      downloadCsv('flashcards-demo.csv', toCsv(demo));
    },
  };
}
