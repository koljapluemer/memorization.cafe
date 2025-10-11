import { liveQuery, type Observable, type Table } from 'dexie';

import { parseCsv, toCsv, downloadCsv } from '../../dumb/csv-utils';

export interface VerbatimItemRecord {
  id: string;
  preExercise: string;
  toMemorize: string;
  postExercise: string;
  learningItemId: string;
  learningProgressId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerbatimDraft {
  preExercise: string;
  toMemorize: string;
  postExercise: string;
  learningItemId: string;
}

export type VerbatimRepository = {
  watchAll: () => Observable<VerbatimItemRecord[]>;
  get: (id: string) => Promise<VerbatimItemRecord | undefined>;
  create: (draft: VerbatimDraft) => Promise<string>;
  update: (id: string, draft: VerbatimDraft) => Promise<void>;
  updateProgressId: (id: string, progressId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  importFromCsv: (csvText: string, learningItemId?: string) => Promise<number>;
  downloadDemoCsv: () => void;
};

function sanitizeDraft(draft: VerbatimDraft): VerbatimDraft {
  return {
    preExercise: draft.preExercise.trim(),
    toMemorize: draft.toMemorize.trim(),
    postExercise: draft.postExercise.trim(),
    learningItemId: draft.learningItemId,
  };
}

function createRecordFromDraft(draft: VerbatimDraft): Omit<VerbatimItemRecord, 'id'> {
  const now = new Date();
  const sanitized = sanitizeDraft(draft);
  return {
    preExercise: sanitized.preExercise,
    toMemorize: sanitized.toMemorize,
    postExercise: sanitized.postExercise,
    learningItemId: sanitized.learningItemId,
    learningProgressId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function createVerbatimRepository(db: {
  verbatimItems: Table<VerbatimItemRecord, string>;
  learningItems: Table<{ id?: string; name: string; description: string; collectionId: string | null; createdAt: string; updatedAt: string }, string>;
}): VerbatimRepository {
  const { verbatimItems, learningItems } = db;

  return {
    watchAll(): Observable<VerbatimItemRecord[]> {
      return liveQuery(() => verbatimItems.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return verbatimItems.get(id);
    },
    async create(draft: VerbatimDraft) {
      const record = createRecordFromDraft(draft);
      const id = await verbatimItems.add(record as VerbatimItemRecord);
      return id;
    },
    async update(id: string, draft: VerbatimDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await verbatimItems.update(id, {
        preExercise: sanitized.preExercise,
        toMemorize: sanitized.toMemorize,
        postExercise: sanitized.postExercise,
        learningItemId: sanitized.learningItemId,
        updatedAt: nowIso,
      });
    },
    async updateProgressId(id: string, progressId: string) {
      await verbatimItems.update(id, {
        learningProgressId: progressId,
      });
    },
    remove(id: string) {
      return verbatimItems.delete(id);
    },
    async importFromCsv(csvText: string, learningItemId?: string): Promise<number> {
      const rows = parseCsv(csvText);
      if (rows.length === 0) return 0;

      const hasHeader =
        rows[0]?.[0]?.toLowerCase() === 'preexercise' ||
        rows[0]?.[0]?.toLowerCase() === 'pre-exercise';
      const dataRows = hasHeader ? rows.slice(1) : rows;

      let actualLearningItemId = learningItemId;
      if (!actualLearningItemId) {
        const now = new Date();
        const itemRecord = {
          name: 'Imported Verbatim Items',
          description: `Imported on ${now.toLocaleString()}`,
          collectionId: null,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        actualLearningItemId = (await learningItems.add(itemRecord)) as string;
      }

      let imported = 0;
      for (const row of dataRows) {
        if (row.length >= 3) {
          const draft: VerbatimDraft = {
            preExercise: (row[0] || '').trim(),
            toMemorize: (row[1] || '').trim(),
            postExercise: (row[2] || '').trim(),
            learningItemId: actualLearningItemId,
          };
          if (draft.toMemorize) {
            const record = createRecordFromDraft(draft);
            await verbatimItems.add(record as VerbatimItemRecord);
            imported++;
          }
        }
      }
      return imported;
    },
    downloadDemoCsv(): void {
      const demo = [
        ['preExercise', 'toMemorize', 'postExercise'],
        ['', 'To be, or not to be, that is the question', ''],
        ['From Shakespeare:', 'All the world\'s a stage', 'As You Like It'],
      ];
      downloadCsv('verbatim-items-demo.csv', toCsv(demo));
    },
  };
}
