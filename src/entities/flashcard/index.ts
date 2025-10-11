import { liveQuery, type Observable, type Table } from 'dexie';
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

import { parseCsv, toCsv, downloadCsv } from '../../dumb/csv-utils';

export interface FlashcardRecord {
  id: string;
  front: string;
  back: string;
  learningItemId: string;
  createdAt: string;
  updatedAt: string;
  nextReview: string | null;
  fsrsCard: Card;
  lastReviewedAt: string | null;
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
  remove: (id: string) => Promise<void>;
  getNextDue: (now: Date) => Promise<FlashcardRecord | undefined>;
  getNextNew: () => Promise<FlashcardRecord | undefined>;
  review: (id: string, grade: Grade, now: Date) => Promise<FlashcardRecord | undefined>;
  importFromCsv: (csvText: string, learningItemId?: string) => Promise<number>;
  downloadDemoCsv: () => void;
};

const scheduler = fsrs();

function createRecordFromDraft(draft: FlashcardDraft): Omit<FlashcardRecord, 'id'> {
  const now = new Date();
  const card = createEmptyCard(now);
  return {
    front: draft.front.trim(),
    back: draft.back.trim(),
    learningItemId: draft.learningItemId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    nextReview: card.due ? card.due.toISOString() : null,
    fsrsCard: card,
    lastReviewedAt: null,
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
    remove(id: string) {
      return flashcards.delete(id);
    },
    getNextDue(now: Date) {
      const iso = now.toISOString();
      return flashcards
        .where('nextReview')
        .belowOrEqual(iso)
        .sortBy('nextReview')
        .then((records) => records[0]);
    },
    async getNextNew() {
      return flashcards
        .filter((record) => record.fsrsCard.reps === 0)
        .first();
    },
    async review(id: string, grade: Grade, now: Date) {
      const record = await flashcards.get(id);
      if (!record) {
        return undefined;
      }

      const result = scheduler.next(record.fsrsCard, now, grade);
      const nextCard = result.card;
      const nextReview = nextCard.due ? nextCard.due.toISOString() : null;
      const lastReviewedAt = result.log.review.toISOString();

      await flashcards.update(id, {
        fsrsCard: nextCard,
        nextReview,
        lastReviewedAt,
        updatedAt: lastReviewedAt,
      });

      return {
        ...record,
        fsrsCard: nextCard,
        nextReview,
        lastReviewedAt,
        updatedAt: lastReviewedAt,
      } satisfies FlashcardRecord;
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

export { Rating };
export type { Grade };
