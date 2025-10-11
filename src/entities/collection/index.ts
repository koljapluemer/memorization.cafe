import { liveQuery, type Observable, type Table } from 'dexie';

export interface CollectionRecord {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDraft {
  title: string;
  description: string;
}

export type CollectionRepository = {
  watchAll: () => Observable<CollectionRecord[]>;
  get: (id: string) => Promise<CollectionRecord | undefined>;
  create: (draft: CollectionDraft) => Promise<string>;
  update: (id: string, draft: CollectionDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function createRecordFromDraft(draft: CollectionDraft): Omit<CollectionRecord, 'id'> {
  const now = new Date();
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function sanitizeDraft(draft: CollectionDraft): CollectionDraft {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
  };
}

export function createCollectionRepository(db: {
  collections: Table<CollectionRecord, string>;
}): CollectionRepository {
  const { collections } = db;

  return {
    watchAll(): Observable<CollectionRecord[]> {
      return liveQuery(() => collections.orderBy('updatedAt').reverse().toArray());
    },
    get(id: string) {
      return collections.get(id);
    },
    async create(draft: CollectionDraft) {
      const record = createRecordFromDraft(draft);
      const id = await collections.add(record as CollectionRecord);
      return id;
    },
    async update(id: string, draft: CollectionDraft) {
      const sanitized = sanitizeDraft(draft);
      const nowIso = new Date().toISOString();
      await collections.update(id, {
        title: sanitized.title,
        description: sanitized.description,
        updatedAt: nowIso,
      });
    },
    remove(id: string) {
      return collections.delete(id);
    },
  };
}
