# Plan: Question List Sharing in Collections

## Problem Statement

When collections are shared and downloaded, **question lists are not included**, breaking the relationship between concepts (`ElaborativeInterrogationConcept`) and their associated question lists.

### Current Behavior
1. **Upload**: Collection sharing includes flashcards, concepts, lists, and clozes, but NOT question lists
2. **Concepts preserve `questionListId`**: The ID is uploaded to Firestore as part of the concept data
3. **Download**: Concepts are imported with their original `questionListId`, which references a non-existent question list in the downloader's database
4. **Fallback**: During practice, if the referenced question list doesn't exist, the system falls back to the user's default question list
5. **Data Loss**: The original custom questions are lost; downloaded concepts use the downloader's default questions instead

### Why This Is a Problem
- **User Intent Lost**: If a collection author carefully crafted specific questions for their concepts, those questions won't be shared
- **Inconsistent Experience**: Downloaders get different questions than the author intended
- **Silent Failure**: No error or warning; the system just falls back to default questions
- **Broken References**: The `questionListId` field becomes meaningless after download

---

## Goals

1. **Include question lists in shared collections** so downloaders get the exact same questions as the author
2. **Handle duplicates intelligently** when downloading:
   - If an identical question list already exists locally, reuse it
   - If similar but different, create a new one
   - If identical but with a different name, give the user visibility
3. **Map `questionListId` references correctly** during download so concepts point to the right question lists
4. **Maintain backward compatibility** with existing shared collections
5. **Handle edge cases** gracefully (missing lists, orphaned references, etc.)

---

## Design Approach

### Overview
We'll implement a **content-based deduplication strategy** where question lists are matched by their actual questions, not just their names or IDs.

### Key Design Decisions

#### 1. Question List Identity
**Decision**: Two question lists are "identical" if they have the **exact same questions in the same order**.

**Rationale**:
- Names can differ ("Default Questions" vs "Basic Questions") but content matters more
- Order matters for user experience (first question is often the "main" question)
- The `isDefault` flag is local to each user's database, not part of the list's identity
- `minimumInterval` is a per-list setting that should be preserved from the shared collection

**Implementation**:
```typescript
function areQuestionListsIdentical(list1: QuestionList, list2: QuestionList): boolean {
  if (list1.questions.length !== list2.questions.length) return false;
  return list1.questions.every((q, i) => q === list2.questions[i]);
}
```

#### 2. Deduplication Strategy
**Decision**: During download, check if an identical question list already exists locally. If yes, reuse it. If no, create a new one.

**Rationale**:
- Prevents database bloat from duplicate lists
- Allows concepts from different collections to share question lists if they're identical
- Simple to implement and reason about
- No user interaction required for most cases

**Implementation Flow**:
```
For each question list in shared collection:
  1. Search local database for identical question list (same questions, same order)
  2. If found:
     - Reuse the existing list's ID
     - Map the old ID → existing ID in a lookup table
  3. If not found:
     - Create new question list with the shared content
     - Preserve the name and minimumInterval from shared data
     - Set isDefault = false (only user can set defaults)
     - Map the old ID → new ID in a lookup table

For each concept in shared collection:
  1. If concept has questionListId:
     - Look up the new ID in the mapping table
     - Set concept.questionListId to the new ID
  2. If concept has no questionListId:
     - Leave it undefined (will use default during practice)
```

#### 3. Naming Conflicts
**Decision**: Keep the original name from the shared collection, even if a local list with the same name exists.

**Rationale**:
- Names are not unique identifiers in the current schema
- Users can rename lists later if desired
- Prevents loss of author's intended naming
- Simple and predictable

**Edge Case**: If identical content exists locally with a different name, we still reuse the local list (content trumps name), but the shared name is discarded.

**Alternative Considered**: Append a suffix like " (from CollectionName)" to imported lists. Rejected because it pollutes the namespace and isn't necessary if we deduplicate by content.

#### 4. The `isDefault` Flag
**Decision**: Imported question lists are **never** set as default, regardless of their `isDefault` value in the shared collection.

**Rationale**:
- The default list is a **user preference**, not collection data
- Importing a collection shouldn't change the user's global settings
- Only one list can be default; importing shouldn't override the user's choice
- Users can manually set a list as default after import if desired

#### 5. Backward Compatibility
**Decision**: Support downloading old shared collections that don't have question lists.

**Implementation**:
```typescript
// In SharedCollection type
items: {
  flashcards: SimpleFlashcard[];
  concepts: ElaborativeInterrogationConcept[];
  lists: List[];
  clozes: Cloze[];
  questionLists?: QuestionList[];  // Optional for backward compatibility
}
```

**Behavior**:
- If `questionLists` is undefined or empty, concepts will fall back to default (current behavior)
- If `questionLists` is present, map them as described above
- No migration needed for existing shared collections

---

## Implementation Plan

### Phase 1: Update Data Types

#### File: `src/features/collection-sharing/types.ts`

**Changes**:
```typescript
export interface SharedCollection {
  shareId: string;
  collectionName: string;
  collectionDescription?: string;
  authorName: string;
  createdAt: number;
  viewCount: number;
  downloadCount: number;
  items: {
    flashcards: SimpleFlashcard[];
    concepts: ElaborativeInterrogationConcept[];
    lists: List[];
    clozes: Cloze[];
    questionLists?: QuestionList[];  // NEW: Optional for backward compatibility
  };
}
```

**Why**: Extend the schema to include question lists while maintaining backward compatibility.

---

### Phase 2: Update Upload Logic

#### File: `src/features/collection-sharing/share-service.ts`

**Changes**:

1. **Import question list repository** (top of file):
```typescript
import { questionListRepo } from '@/entities/question-list';
```

2. **Fetch question lists referenced by concepts** (around line 52):
```typescript
// Existing code
const [flashcards, concepts, lists, clozes] = await Promise.all([
  simpleFlashcardRepo.getByCollectionId(collectionId),
  elaborativeInterrogationRepo.getByCollectionId(collectionId),
  listRepo.getByCollectionId(collectionId),
  clozeRepo.getByCollectionId(collectionId),
]);

// NEW: Collect unique question list IDs from concepts
const questionListIds = new Set<string>();
for (const concept of concepts) {
  if (concept.questionListId) {
    questionListIds.add(concept.questionListId);
  }
}

// NEW: Fetch all referenced question lists
const questionLists: QuestionList[] = [];
for (const id of questionListIds) {
  const list = await questionListRepo.getById(id);
  if (list) {
    questionLists.push(list);
  }
}
```

3. **Include question lists in shared collection** (around line 71):
```typescript
const sharedCollection: SharedCollection = {
  shareId,
  collectionName: collection.name,
  collectionDescription: collection.description,
  authorName: authorName.trim() || 'Anonymous',
  createdAt: Date.now(),
  viewCount: 0,
  downloadCount: 0,
  items: {
    flashcards,
    concepts,
    lists,
    clozes,
    questionLists,  // NEW: Include question lists
  },
};
```

**Why**: Ensures question lists referenced by concepts are included in the upload.

**Edge Cases Handled**:
- If a concept references a non-existent question list, it's silently skipped (graceful degradation)
- If multiple concepts reference the same list, it's only included once (Set deduplication)
- If no concepts have question lists, `questionLists` will be an empty array (not undefined)

---

### Phase 3: Update Download Logic

#### File: `src/pages/public/collection-downloader.ts`

**Changes**:

1. **Import question list repository** (top of file):
```typescript
import { questionListRepo } from '@/entities/question-list';
```

2. **Add helper function for question list deduplication** (before `downloadCollection`):
```typescript
/**
 * Checks if two question lists have identical content (same questions in same order)
 */
function areQuestionListsIdentical(list1: QuestionList, list2: QuestionList): boolean {
  if (list1.questions.length !== list2.questions.length) return false;
  return list1.questions.every((q, i) => q === list2.questions[i]);
}

/**
 * Finds a local question list with identical content to the given list
 */
async function findIdenticalQuestionList(
  questionList: QuestionList
): Promise<QuestionList | undefined> {
  const allLocalLists = await questionListRepo.getAll();
  return allLocalLists.find(local => areQuestionListsIdentical(questionList, local));
}
```

3. **Import question lists and build ID mapping** (in `downloadCollection`, after creating collection):
```typescript
// NEW: Import question lists (if present) and build ID mapping
const questionListIdMap = new Map<string, string>();

if (sharedCollection.items.questionLists && sharedCollection.items.questionLists.length > 0) {
  for (const sharedList of sharedCollection.items.questionLists) {
    const { id: oldId, isDefault: _isDefault, ...listData } = sharedList;

    // Check if an identical list already exists locally
    const existingList = await findIdenticalQuestionList(sharedList);

    if (existingList && existingList.id) {
      // Reuse existing list
      questionListIdMap.set(oldId!, existingList.id);
    } else {
      // Create new list (never set as default)
      const newId = await questionListRepo.create({
        ...listData,
        isDefault: false,
      });
      questionListIdMap.set(oldId!, newId);
    }
  }
}
```

4. **Update concept import to remap question list IDs** (replace existing concept import):
```typescript
// Import concepts with remapped question list IDs
for (const concept of sharedCollection.items.concepts) {
  const { id, questionListId, ...conceptData } = concept;

  // Remap question list ID if present
  let newQuestionListId: string | undefined = undefined;
  if (questionListId && questionListIdMap.has(questionListId)) {
    newQuestionListId = questionListIdMap.get(questionListId);
  }

  importPromises.push(
    elaborativeInterrogationRepo.create({
      ...conceptData,
      collectionId,
      questionListId: newQuestionListId,
    })
  );
}
```

**Why**: Implements content-based deduplication and correct ID remapping.

**Edge Cases Handled**:
- **Backward compatibility**: If `questionLists` is undefined or empty, the code skips it gracefully
- **Missing question list**: If a concept references a question list that wasn't included in the upload, `newQuestionListId` remains undefined (falls back to default during practice)
- **Identical local list**: Reuses the existing list instead of creating duplicates
- **isDefault flag**: Always set to false for imported lists, preserving user's default choice
- **ID collisions**: New IDs are auto-generated by Dexie, no collisions possible

---

### Phase 4: Add Unit Tests (Optional but Recommended)

Create test cases for the new deduplication logic:

#### File: `src/pages/public/collection-downloader.test.ts` (new file)

**Test Cases**:
1. ✅ Identical question lists are deduplicated
2. ✅ Different question lists are created separately
3. ✅ Question lists with same questions but different order are treated as different
4. ✅ Concept `questionListId` is remapped correctly
5. ✅ Concepts without `questionListId` remain undefined
6. ✅ Backward compatibility: downloading old collections without `questionLists` works
7. ✅ Imported lists are never set as default
8. ✅ Names are preserved from shared collection

---

### Phase 5: CSV Import/Export (Future Enhancement)

Currently, CSV import/export does **not** include `questionListId`. This could be addressed in a future update:

#### File: `src/pages/manage/csv-export.ts`

**Enhancement**: Add `questionListId` to concept CSV headers
```typescript
const headers = ['name', 'description', 'minimumInterval', 'questionListId'];
```

#### File: `src/pages/manage/csv-import.ts`

**Enhancement**: Parse `questionListId` from CSV and validate it exists
```typescript
const concept: Omit<ElaborativeInterrogationConcept, 'id'> = {
  collectionId,
  name: row.name || '',
  description: row.description || undefined,
  minimumInterval: parseMinimumInterval(row.minimumInterval),
  questionListId: row.questionListId || undefined,  // NEW
};
```

**Note**: This is out of scope for the current fix but worth documenting for future work.

---

## Edge Cases & Error Handling

### 1. Orphaned Question List References
**Scenario**: A concept in the shared collection references a question list that wasn't included in the upload (e.g., due to a bug or manual edit).

**Current Handling**: The question list won't be in the shared collection, so during download, the concept's `questionListId` won't be remapped and will remain pointing to a non-existent list.

**Behavior**: During practice, the fallback logic will use the default question list (existing behavior, safe).

**Improvement** (optional): Log a warning during upload if a concept references a non-existent question list.

---

### 2. Empty Question Lists
**Scenario**: A question list with zero questions.

**Current Handling**: The schema allows `questions: []`, so it can be uploaded and downloaded.

**Behavior**: During practice (ConceptPractice.vue:123), if `questionList.questions.length === 0`, no question will be selected, and `selectedQuestion` will be empty.

**Decision**: Allow empty question lists (edge case, unlikely in practice). The UI should handle this gracefully.

---

### 3. Extremely Large Question Lists
**Scenario**: A question list with 1000+ questions.

**Current Handling**: No pagination or limits in the current code.

**Behavior**: All questions will be uploaded/downloaded. Firestore has a 1MB document size limit, which should be sufficient for reasonable question lists.

**Decision**: No special handling needed. If this becomes a problem, we can add validation.

---

### 4. Question List Name Collisions
**Scenario**: Local database has "Default Questions" and the shared collection also has "Default Questions" (but different content).

**Handling**: The deduplication logic compares content, not names. If content differs, both lists will exist with the same name.

**User Impact**: Minimal. Users can rename lists if desired. The UI shows all lists in a dropdown, so users can distinguish by the questions themselves.

**Alternative**: Append a suffix like " (imported)" to the shared list's name. Rejected for simplicity.

---

### 5. Circular or Complex References
**Scenario**: Currently impossible. Concepts reference question lists, but question lists don't reference concepts or other entities.

**Handling**: N/A (no circular references in current schema).

---

### 6. Question List Deleted After Sharing
**Scenario**: Author shares a collection, then deletes a question list locally. The shared collection still has the question list.

**Handling**: No problem. The shared collection is a snapshot. Downloaders get the full question list.

**Behavior**: Works as expected (sharing is point-in-time snapshot).

---

### 7. Multiple Concepts Reference Same Question List
**Scenario**: 10 concepts all use "Advanced Questions" list.

**Handling**:
- During upload: Question list is included once (Set deduplication ensures this)
- During download: Question list is created/reused once, all 10 concepts are remapped to the same new ID

**Behavior**: Works correctly, maintains the one-to-many relationship.

---

### 8. Question List Matches Local List Exactly
**Scenario**: Downloader already has "Default Questions" with the exact same questions as the shared collection.

**Handling**: The deduplication logic finds the match and reuses the local list.

**Behavior**: No duplicate created, concepts are mapped to the existing local list.

**User Impact**: Seamless. User doesn't see duplicate lists.

---

## Testing Plan

### Manual Testing Checklist

#### Setup
1. Create Collection A with custom question list "Custom Questions A"
2. Create Collection B with custom question list "Custom Questions B"
3. Create Collection C that uses the default question list
4. Share all three collections

#### Test Cases

**Test 1: Basic Upload and Download**
- [ ] Share Collection A
- [ ] Download Collection A as a different user
- [ ] Verify concepts in downloaded collection have the correct questions
- [ ] Verify "Custom Questions A" appears in the question list manager

**Test 2: Deduplication - Identical Content**
- [ ] Create local question list "My Questions" with specific questions
- [ ] Share Collection A (which has a list with identical questions but named "Custom Questions A")
- [ ] Download Collection A
- [ ] Verify no duplicate question list is created
- [ ] Verify concepts use the existing "My Questions" list

**Test 3: No Deduplication - Different Content**
- [ ] Create local question list "My Questions" with different questions
- [ ] Share Collection A
- [ ] Download Collection A
- [ ] Verify both "My Questions" and "Custom Questions A" exist
- [ ] Verify concepts use "Custom Questions A"

**Test 4: Multiple Concepts, One Question List**
- [ ] Create 5 concepts all using "Custom Questions A"
- [ ] Share the collection
- [ ] Download the collection
- [ ] Verify only one question list is created
- [ ] Verify all 5 concepts reference the same question list

**Test 5: Backward Compatibility**
- [ ] Use Firestore console to manually edit an existing shared collection and remove the `questionLists` field
- [ ] Download this collection
- [ ] Verify concepts are imported successfully
- [ ] Verify concepts use the default question list during practice

**Test 6: Mixed - Some Concepts with Lists, Some Without**
- [ ] Create Collection with:
  - Concept 1: uses "Custom Questions A"
  - Concept 2: no question list (uses default)
  - Concept 3: uses "Custom Questions B"
- [ ] Share and download
- [ ] Verify Concept 1 uses "Custom Questions A"
- [ ] Verify Concept 2 uses default
- [ ] Verify Concept 3 uses "Custom Questions B"

**Test 7: Default Flag Not Transferred**
- [ ] Create question list "My Default" and set it as default
- [ ] Create collection using "My Default"
- [ ] Share and download
- [ ] Verify downloader's default question list is NOT changed to "My Default"
- [ ] Verify "My Default" was imported but not set as default

**Test 8: Practice with Imported Questions**
- [ ] Download collection with custom questions
- [ ] Start practice on a concept
- [ ] Verify the question shown is from the custom question list, not default

---

## Migration Strategy

**Good News**: No migration required!

**Rationale**:
- The `questionLists` field in `SharedCollection` is optional
- Existing shared collections without `questionLists` will continue to work (backward compatible)
- New shared collections will include `questionLists`
- No breaking changes to the database schema or Firestore documents

**Deployment**:
1. Deploy the updated code
2. New shares will include question lists
3. Old shares will continue to work as before
4. No user action required

---

## Alternative Approaches Considered

### Alternative 1: Always Create New Question Lists (No Deduplication)
**Approach**: Every downloaded collection creates brand new question lists, even if identical ones exist.

**Pros**:
- Simpler implementation (no comparison logic)
- Guaranteed isolation between collections

**Cons**:
- Database bloat: downloading 10 collections with default questions creates 10 duplicate lists
- Clutters the question list manager UI
- User has to manually deduplicate if desired

**Verdict**: ❌ Rejected. The cons outweigh the simplicity gain.

---

### Alternative 2: Match by Name (Not Content)
**Approach**: If a question list with the same name exists, reuse it.

**Pros**:
- Simple comparison (string equality)
- Fast lookup

**Cons**:
- Dangerous: two lists with the same name may have different content
- Could silently use wrong questions for concepts
- Names are not unique in the current schema

**Verdict**: ❌ Rejected. Content matching is more robust.

---

### Alternative 3: Prompt User on Conflicts
**Approach**: During download, if similar question lists exist, ask the user to choose: reuse or create new.

**Pros**:
- Gives user full control
- Handles edge cases explicitly

**Cons**:
- Requires UI changes and user interaction
- Interrupts the download flow
- Overwhelming if a collection references many question lists
- Most users won't care about this level of detail

**Verdict**: ❌ Rejected. Auto-deduplication is better UX.

---

### Alternative 4: Include All Question Lists, Not Just Referenced Ones
**Approach**: When sharing a collection, include ALL question lists in the user's database.

**Pros**:
- Ensures completeness
- Shares the user's full question library

**Cons**:
- Bloats the shared collection with irrelevant data
- Question lists are global, not collection-specific
- Violates principle of least surprise (user expects to share one collection)
- Privacy concern: user might have private question lists

**Verdict**: ❌ Rejected. Only include question lists actually used by concepts in the collection.

---

### Alternative 5: Make Question Lists Collection-Scoped
**Approach**: Change the schema so question lists belong to a collection (like flashcards do).

**Pros**:
- Cleaner data model (no cross-collection references)
- Simpler sharing logic (question lists are part of the collection)

**Cons**:
- **Breaking change**: requires database migration
- Loses the ability to share question lists across collections
- Violates current design where question lists are global resources
- Massive refactor required

**Verdict**: ❌ Rejected. Too invasive for the problem at hand.

---

## Summary

This plan provides a **minimal, backward-compatible solution** to include question lists in collection sharing while intelligently deduplicating based on content. The implementation is straightforward, handles edge cases gracefully, and requires changes to only 2 core files.

**Key Benefits**:
✅ Preserves author's intent (questions are shared)
✅ No duplicate question lists (content-based deduplication)
✅ Backward compatible (old collections still work)
✅ No user interaction required (automatic mapping)
✅ Graceful fallback (missing lists → default)
✅ Minimal code changes (2 files)

**Next Steps**:
1. Review this plan
2. Implement Phase 1-3 (types, upload, download)
3. Manual testing using the test plan
4. (Optional) Add unit tests (Phase 4)
5. (Optional) Extend CSV import/export (Phase 5)
