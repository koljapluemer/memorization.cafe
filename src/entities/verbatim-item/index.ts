import { liveQuery, type Observable, type Table } from 'dexie';
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

export interface VerbatimItemRecord {
  id: string;
  preExercise: string;
  toMemorize: string;
  postExercise: string;
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
};

const scheduler = fsrs();

function generateId(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;
  if (cryptoRef && 'randomUUID' in cryptoRef) {
    return cryptoRef.randomUUID();
  }
  return `verbatim-${Math.random().toString(36).slice(2)}`;
}

function sanitizeDraft(draft: VerbatimDraft): VerbatimDraft {
  return {
    preExercise: draft.preExercise.trim(),
    toMemorize: draft.toMemorize.trim(),
    postExercise: draft.postExercise.trim(),
  };
}

function createRecordFromDraft(draft: VerbatimDraft): VerbatimItemRecord {
  const now = new Date();
  const card = createEmptyCard(now);
  const sanitized = sanitizeDraft(draft);
  return {
    id: generateId(),
    ...sanitized,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    nextReview: card.due ? card.due.toISOString() : null,
    fsrsCard: card,
    lastReviewedAt: null,
  };
}

export function createVerbatimRepository(db: {
  verbatimItems: Table<VerbatimItemRecord, string>;
}): VerbatimRepository {
  const { verbatimItems } = db;

  return {
    watchAll(): Observable<VerbatimItemRecord[]> {
      return liveQuery(() => verbatimItems.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return verbatimItems.get(id);
    },
    async create(draft: VerbatimDraft) {
      const record = createRecordFromDraft(draft);
      await verbatimItems.add(record);
      return record.id;
    },
    async update(id: string, draft: VerbatimDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await verbatimItems.update(id, {
        ...sanitized,
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
  };
}

export { Rating };
export type { Grade };
