import { liveQuery, type Observable, type Table } from 'dexie';
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type Grade,
} from 'ts-fsrs';

export interface FlashcardRecord {
  id: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
  nextReview: string | null;
  fsrsCard: Card;
  lastReviewedAt: string | null;
}

export interface FlashcardDraft {
  front: string;
  back: string;
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
};

const scheduler = fsrs();

function generateId(): string {
  const cryptoRef = globalThis.crypto as Crypto | undefined;
  if (cryptoRef && 'randomUUID' in cryptoRef) {
    return cryptoRef.randomUUID();
  }
  return `flashcard-${Math.random().toString(36).slice(2)}`;
}

function createRecordFromDraft(draft: FlashcardDraft): FlashcardRecord {
  const now = new Date();
  const card = createEmptyCard(now);
  return {
    id: generateId(),
    front: draft.front.trim(),
    back: draft.back.trim(),
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
  };
}

export function createFlashcardRepository(db: {
  flashcards: Table<FlashcardRecord, string>;
}): FlashcardRepository {
  const { flashcards } = db;

  return {
    watchAll(): Observable<FlashcardRecord[]> {
      return liveQuery(() => flashcards.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return flashcards.get(id);
    },
    async create(draft: FlashcardDraft) {
      const record = createRecordFromDraft(draft);
      await flashcards.add(record);
      return record.id;
    },
    async update(id: string, draft: FlashcardDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await flashcards.update(id, {
        front: sanitized.front,
        back: sanitized.back,
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
  };
}

export { Rating };
export type { Grade };
