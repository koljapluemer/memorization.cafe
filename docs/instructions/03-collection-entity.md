# Step 3: Collection Entity Implementation

## Overview
Implement the Collection entity with its contract and repository.

## Architecture Rules
- Entity folder: `src/entities/collection/`
- May NOT import other entity folders
- Only interacts with the database

## Tasks

### 3.1 Create Contract

Create `src/entities/collection/contract.ts`:

```typescript
import type { Collection } from '@/app/database';

export interface CollectionContract {
  getAll(): Promise<Collection[]>;
  getById(id: string): Promise<Collection | undefined>;
  create(data: Omit<Collection, 'id'>): Promise<string>;
  update(id: string, data: Partial<Collection>): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 3.2 Create Repository

Create `src/entities/collection/repo.ts`:

```typescript
import { db, type Collection } from '@/app/database';
import type { CollectionContract } from './contract';

export const collectionRepo: CollectionContract = {
  async getAll(): Promise<Collection[]> {
    return await db.collections.toArray();
  },

  async getById(id: string): Promise<Collection | undefined> {
    return await db.collections.get(id);
  },

  async create(data: Omit<Collection, 'id'>): Promise<string> {
    const id = await db.collections.add(data as Collection);
    return id;
  },

  async update(id: string, data: Partial<Collection>): Promise<void> {
    await db.collections.update(id, data);
  },

  async delete(id: string): Promise<void> {
    await db.collections.delete(id);
  },
};
```

### 3.3 Create Index Export

Create `src/entities/collection/index.ts`:

```typescript
export { collectionRepo } from './repo';
export type { CollectionContract } from './contract';
export type { Collection } from '@/app/database';
```

## File Structure

```
src/entities/collection/
├── contract.ts  # Interface definition
├── repo.ts      # Dexie implementation
└── index.ts     # Public exports
```

## Notes

- Collections are simple: just id, name, and optional description
- No business logic needed at this layer
- Repository provides basic CRUD operations
- Future: `realmId` will enable sharing, but not implemented now

## Validation

- [ ] Contract defines all required methods
- [ ] Repository implements contract correctly
- [ ] Can create, read, update, delete collections via repo
- [ ] No imports from other entity folders
- [ ] ESLint passes

## Next Step

Proceed to `04-learning-progress-entity.md` to implement the LearningProgress entity.
