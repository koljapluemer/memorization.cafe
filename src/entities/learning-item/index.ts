import { liveQuery, type Observable, type Table, type Dexie } from 'dexie';

export interface LearningItemRecord {
  id: string;
  name: string;
  description: string;
  collectionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningItemDraft {
  name: string;
  description: string;
  collectionId?: string | null;
}

export type LearningItemRepository = {
  watchAll: () => Observable<LearningItemRecord[]>;
  get: (id: string) => Promise<LearningItemRecord | undefined>;
  create: (draft: LearningItemDraft) => Promise<string>;
  update: (id: string, draft: LearningItemDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getByCollection: (collectionId: string) => Promise<LearningItemRecord[]>;
  getOrphans: () => Promise<LearningItemRecord[]>;
  attachToCollection: (itemIds: string[], collectionId: string) => Promise<void>;
  detachFromCollection: (itemIds: string[]) => Promise<void>;
};

function createRecordFromDraft(draft: LearningItemDraft): Omit<LearningItemRecord, 'id'> {
  const now = new Date();
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    collectionId: draft.collectionId ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function sanitizeDraft(draft: LearningItemDraft): LearningItemDraft {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    collectionId: draft.collectionId ?? null,
  };
}

export function createLearningItemRepository(db: Dexie & {
  learningItems: Table<LearningItemRecord, string>;
}): LearningItemRepository {
  const { learningItems } = db;

  return {
    watchAll(): Observable<LearningItemRecord[]> {
      return liveQuery(() => learningItems.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return learningItems.get(id);
    },
    async create(draft: LearningItemDraft) {
      const record = createRecordFromDraft(draft);
      const id = await learningItems.add(record as LearningItemRecord);
      return id;
    },
    async update(id: string, draft: LearningItemDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await learningItems.update(id, {
        name: sanitized.name,
        description: sanitized.description,
        collectionId: sanitized.collectionId,
        updatedAt: nowIso,
      });
    },
    remove(id: string) {
      return learningItems.delete(id);
    },
    async getByCollection(collectionId: string) {
      return learningItems
        .where('collectionId')
        .equals(collectionId)
        .sortBy('updatedAt')
        .then((items) => items.reverse());
    },
    async getOrphans() {
      return learningItems
        .where('collectionId')
        .equals('')
        .or('collectionId')
        .equals(null as unknown as string)
        .sortBy('updatedAt')
        .then((items) => items.reverse());
    },
    async attachToCollection(itemIds: string[], collectionId: string) {
      const nowIso = new Date().toISOString();
      await db.transaction('rw', learningItems, async () => {
        for (const itemId of itemIds) {
          await learningItems.update(itemId, {
            collectionId,
            updatedAt: nowIso,
          });
        }
      });
    },
    async detachFromCollection(itemIds: string[]) {
      const nowIso = new Date().toISOString();
      await db.transaction('rw', learningItems, async () => {
        for (const itemId of itemIds) {
          await learningItems.update(itemId, {
            collectionId: null,
            updatedAt: nowIso,
          });
        }
      });
    },
  };
}
