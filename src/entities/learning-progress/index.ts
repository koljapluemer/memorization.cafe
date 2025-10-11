import { liveQuery, type Observable, type Table } from 'dexie';
import {
  createEmptyCard,
  fsrs,
  type Card,
  type Grade,
} from 'ts-fsrs';

export interface LearningProgress extends Card {
  id: string;
  userId: string;
}

export type LearningProgressRepository = {
  get: (id: string) => Promise<LearningProgress | undefined>;
  getByUser: (userId: string) => Promise<LearningProgress[]>;
  watchByUser: (userId: string) => Observable<LearningProgress[]>;
  create: (userId: string) => Promise<string>;
  review: (id: string, grade: Grade, now: Date) => Promise<LearningProgress | undefined>;
  reset: (id: string) => Promise<void>;
};

const scheduler = fsrs();

export function createLearningProgressRepository(db: {
  learningProgress: Table<LearningProgress, string>;
}): LearningProgressRepository {
  const { learningProgress } = db;

  return {
    get(id: string) {
      return learningProgress.get(id);
    },

    getByUser(userId: string) {
      return learningProgress.where('userId').equals(userId).toArray();
    },

    watchByUser(userId: string): Observable<LearningProgress[]> {
      return liveQuery(() =>
        learningProgress.where('userId').equals(userId).toArray()
      );
    },

    async create(userId: string) {
      const now = new Date();
      const card = createEmptyCard(now);
      const record: Omit<LearningProgress, 'id'> = {
        ...card,
        userId,
      };
      const id = await learningProgress.add(record as LearningProgress);
      return id;
    },

    async review(id: string, grade: Grade, now: Date) {
      const record = await learningProgress.get(id);
      if (!record) {
        return undefined;
      }

      const result = scheduler.next(record, now, grade);
      const nextCard = result.card;

      await learningProgress.update(id, {
        ...nextCard,
      });

      return {
        ...record,
        ...nextCard,
      } as LearningProgress;
    },

    async reset(id: string) {
      const now = new Date();
      const card = createEmptyCard(now);
      await learningProgress.update(id, {
        ...card,
      });
    },
  };
}
