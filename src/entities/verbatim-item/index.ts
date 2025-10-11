import { liveQuery, type Observable, type Table } from 'dexie';
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

import { parseCsv, toCsv, downloadCsv } from '../../dumb/csv-utils';

export interface VerbatimItemRecord {
  id: string;
  preExercise: string;
  toMemorize: string;
  postExercise: string;
  learningItemId: string;
  createdAt: string;
  updatedAt: string;
  nextReview: string | null;
  fsrsCard: Card;
  lastReviewedAt: string | null;
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
  remove: (id: string) => Promise<void>;
  getNextDue: (now: Date) => Promise<VerbatimItemRecord | undefined>;
  getNextNew: () => Promise<VerbatimItemRecord | undefined>;
  review: (id: string, grade: Grade, now: Date) => Promise<VerbatimItemRecord | undefined>;
  importFromCsv: (csvText: string, learningItemId?: string) => Promise<number>;
  downloadDemoCsv: () => void;
};

const scheduler = fsrs();

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
  const card = createEmptyCard(now);
  const sanitized = sanitizeDraft(draft);
  return {
    preExercise: sanitized.preExercise,
    toMemorize: sanitized.toMemorize,
    postExercise: sanitized.postExercise,
    learningItemId: sanitized.learningItemId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    nextReview: card.due ? card.due.toISOString() : null,
    fsrsCard: card,
    lastReviewedAt: null,
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
    remove(id: string) {
      return verbatimItems.delete(id);
    },
    getNextDue(now: Date) {
      const iso = now.toISOString();
      return verbatimItems
        .where('nextReview')
        .belowOrEqual(iso)
        .sortBy('nextReview')
        .then((records) => records[0]);
    },
    getNextNew() {
      return verbatimItems.filter((record) => record.fsrsCard.reps === 0).first();
    },
    async review(id: string, grade: Grade, now: Date) {
      const record = await verbatimItems.get(id);
      if (!record) {
        return undefined;
      }

      const result = scheduler.next(record.fsrsCard, now, grade);
      const nextCard = result.card;
      const nextReview = nextCard.due ? nextCard.due.toISOString() : null;
      const lastReviewedAt = result.log.review.toISOString();

      await verbatimItems.update(id, {
        fsrsCard: nextCard,
        nextReview,
        updatedAt: lastReviewedAt,
        lastReviewedAt,
      });

      return {
        ...record,
        fsrsCard: nextCard,
        nextReview,
        updatedAt: lastReviewedAt,
        lastReviewedAt,
      } satisfies VerbatimItemRecord;
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

export { Rating };
export type { Grade };
