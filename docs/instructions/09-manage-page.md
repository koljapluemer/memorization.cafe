# Step 9: Manage Page Implementation

## Overview
Create the Manage page with a tabbed interface for collections, allowing CRUD operations on learning items.

## Architecture Rules
- Location: `src/pages/manage/`
- Can import entities, features, and dumb components
- Page-specific components can live in the page folder

## Tasks

### 9.1 Create Collection Edit Modal

Create `src/pages/manage/CollectionEditModal.vue`:

```vue
<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">{{ isNew ? 'New Collection' : 'Edit Collection' }}</h3>

      <div class="space-y-4">
        <div class="form-control w-full">
          <label for="collection-name" class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            id="collection-name"
            v-model="localName"
            type="text"
            placeholder="Collection name"
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control w-full">
          <label for="collection-description" class="label">
            <span class="label-text">Description (optional)</span>
          </label>
          <textarea
            id="collection-description"
            v-model="localDescription"
            placeholder="Collection description"
            class="textarea textarea-bordered w-full"
          />
        </div>
      </div>

      <div class="modal-action">
        <button @click="handleSave" class="btn btn-primary">Save</button>
        <button @click="close" class="btn">Cancel</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Collection } from '@/entities/collection';

const props = defineProps<{
  collection?: Collection;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: { name: string; description?: string }];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localName = ref('');
const localDescription = ref('');

function open() {
  localName.value = props.collection?.name || '';
  localDescription.value = props.collection?.description || '';
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function handleSave() {
  if (!localName.value.trim()) return;

  emit('save', {
    name: localName.value,
    description: localDescription.value || undefined,
  });
  close();
}

defineExpose({ open });
</script>
```

### 9.2 Create Learning Item Edit Modal

Create `src/pages/manage/LearningItemEditModal.vue`:

```vue
<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>

      <SimpleFlashcardEdit
        v-if="itemType === 'flashcard'"
        :flashcard="item"
        @update="handleUpdate"
      />

      <ElaborativeInterrogationEdit
        v-else-if="itemType === 'concept'"
        :concept="item"
        @update="handleUpdate"
      />

      <div class="modal-action">
        <button @click="handleSave" class="btn btn-primary">Save</button>
        <button @click="close" class="btn">Cancel</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SimpleFlashcardEdit } from '@/entities/simple-flashcard';
import { ElaborativeInterrogationEdit } from '@/entities/elaborative-interrogation';

const props = defineProps<{
  itemType: 'flashcard' | 'concept';
  item?: any;
  isNew?: boolean;
}>();

const emit = defineEmits<{
  save: [data: any];
}>();

const modalRef = ref<HTMLDialogElement | null>(null);
const localData = ref<any>({});

const title = computed(() => {
  if (props.isNew) {
    return props.itemType === 'flashcard' ? 'New Flashcard' : 'New Concept';
  }
  return props.itemType === 'flashcard' ? 'Edit Flashcard' : 'Edit Concept';
});

function open() {
  localData.value = {};
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

function handleUpdate(data: any) {
  localData.value = data;
}

function handleSave() {
  emit('save', localData.value);
  close();
}

defineExpose({ open });
</script>
```

### 9.3 Create Preview Modal

Create `src/pages/manage/PreviewModal.vue`:

```vue
<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Preview</h3>

      <SimpleFlashcardPreview
        v-if="itemType === 'flashcard'"
        :flashcard="item"
      />

      <ElaborativeInterrogationPreview
        v-else-if="itemType === 'concept'"
        :concept="item"
      />

      <div class="modal-action">
        <button @click="close" class="btn">Close</button>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { SimpleFlashcardPreview } from '@/entities/simple-flashcard';
import { ElaborativeInterrogationPreview } from '@/entities/elaborative-interrogation';

defineProps<{
  itemType: 'flashcard' | 'concept';
  item: any;
}>();

const modalRef = ref<HTMLDialogElement | null>(null);

function open() {
  modalRef.value?.showModal();
}

function close() {
  modalRef.value?.close();
}

defineExpose({ open });
</script>
```

### 9.4 Create Manage Page

Create `src/pages/manage/ManagePage.vue`:

```vue
<template>
  <div>
    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-bordered mb-6">
      <a
        v-for="collection in collections"
        :key="collection.id"
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeCollectionId === collection.id }"
        @click="activeCollectionId = collection.id!"
      >
        {{ collection.name }}
      </a>

      <button @click="openCollectionModal(null, true)" class="tab">
        <Plus :size="16" /> New
      </button>
    </div>

    <!-- Active Collection Content -->
    <div v-if="activeCollection">
      <!-- Collection Actions (Collapsible) -->
      <details class="collapse collapse-arrow bg-base-200 mb-4">
        <summary class="collapse-title font-medium">Collection Actions</summary>
        <div class="collapse-content space-y-2">
          <button @click="openCollectionModal(activeCollection, false)" class="btn btn-sm">
            <Edit :size="16" /> Edit Collection
          </button>
          <button @click="handleDeleteCollection" class="btn btn-sm btn-error">
            <Trash2 :size="16" /> Delete Collection
          </button>
        </div>
      </details>

      <!-- Add Learning Items -->
      <div class="flex gap-2 mb-4">
        <button @click="openItemModal('flashcard', null, true)" class="btn btn-sm">
          + Flashcard
        </button>
        <button @click="openItemModal('concept', null, true)" class="btn btn-sm">
          + Elaborative Interrogation Concept
        </button>
      </div>

      <!-- Learning Items Table -->
      <div class="overflow-x-auto">
        <table class="table w-full">
          <tbody>
            <tr v-for="item in allLearningItems" :key="item.id">
              <td>
                <SimpleFlashcardRow v-if="item.type === 'flashcard'" :flashcard="item.data" />
                <ElaborativeInterrogationRow v-else-if="item.type === 'concept'" :concept="item.data" />
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button @click="openItemModal(item.type, item.data, false)" class="btn btn-ghost btn-sm">
                    <Edit :size="16} />
                  </button>
                  <button @click="handleDeleteItem(item.type, item.data.id)" class="btn btn-ghost btn-sm">
                    <Trash2 :size="16" />
                  </button>
                  <button @click="openPreviewModal(item.type, item.data)" class="btn btn-ghost btn-sm">
                    <Eye :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <CollectionEditModal
      ref="collectionModalRef"
      :collection="editingCollection"
      :is-new="isNewCollection"
      @save="handleSaveCollection"
    />

    <LearningItemEditModal
      ref="itemModalRef"
      :item-type="editingItemType"
      :item="editingItem"
      :is-new="isNewItem"
      @save="handleSaveItem"
    />

    <PreviewModal
      ref="previewModalRef"
      :item-type="previewItemType"
      :item="previewItem"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Edit, Trash2, Eye } from 'lucide-vue-next';
import { collectionRepo, type Collection } from '@/entities/collection';
import { simpleFlashcardRepo, SimpleFlashcardRow } from '@/entities/simple-flashcard';
import { elaborativeInterrogationRepo, ElaborativeInterrogationRow } from '@/entities/elaborative-interrogation';
import CollectionEditModal from './CollectionEditModal.vue';
import LearningItemEditModal from './LearningItemEditModal.vue';
import PreviewModal from './PreviewModal.vue';

const collections = ref<Collection[]>([]);
const activeCollectionId = ref<string | null>(null);

const flashcards = ref<any[]>([]);
const concepts = ref<any[]>([]);

const collectionModalRef = ref<InstanceType<typeof CollectionEditModal> | null>(null);
const itemModalRef = ref<InstanceType<typeof LearningItemEditModal> | null>(null);
const previewModalRef = ref<InstanceType<typeof PreviewModal> | null>(null);

const editingCollection = ref<Collection | undefined>(undefined);
const isNewCollection = ref(false);

const editingItemType = ref<'flashcard' | 'concept'>('flashcard');
const editingItem = ref<any>(undefined);
const isNewItem = ref(false);

const previewItemType = ref<'flashcard' | 'concept'>('flashcard');
const previewItem = ref<any>(null);

const activeCollection = computed(() =>
  collections.value.find(c => c.id === activeCollectionId.value)
);

const allLearningItems = computed(() => {
  if (!activeCollectionId.value) return [];

  const items = [
    ...flashcards.value
      .filter(f => f.collectionId === activeCollectionId.value)
      .map(f => ({ type: 'flashcard' as const, data: f, id: f.id })),
    ...concepts.value
      .filter(c => c.collectionId === activeCollectionId.value)
      .map(c => ({ type: 'concept' as const, data: c, id: c.id })),
  ];

  return items;
});

onMounted(async () => {
  await loadCollections();
  await loadLearningItems();
});

async function loadCollections() {
  collections.value = await collectionRepo.getAll();
  if (collections.value.length > 0 && !activeCollectionId.value) {
    activeCollectionId.value = collections.value[0].id!;
  }
}

async function loadLearningItems() {
  flashcards.value = await simpleFlashcardRepo.getAll();
  concepts.value = await elaborativeInterrogationRepo.getAll();
}

function openCollectionModal(collection: Collection | null, isNew: boolean) {
  editingCollection.value = collection || undefined;
  isNewCollection.value = isNew;
  collectionModalRef.value?.open();
}

async function handleSaveCollection(data: { name: string; description?: string }) {
  if (isNewCollection.value) {
    const id = await collectionRepo.create(data);
    activeCollectionId.value = id;
  } else if (editingCollection.value?.id) {
    await collectionRepo.update(editingCollection.value.id, data);
  }
  await loadCollections();
}

async function handleDeleteCollection() {
  if (!activeCollection.value?.id) return;

  const confirmed = confirm(
    `Delete collection "${activeCollection.value.name}"? This will also delete all learning items in this collection.`
  );

  if (!confirmed) return;

  // Delete all learning items first
  const itemsToDelete = allLearningItems.value;
  for (const item of itemsToDelete) {
    if (item.type === 'flashcard') {
      await simpleFlashcardRepo.delete(item.data.id);
    } else {
      await elaborativeInterrogationRepo.delete(item.data.id);
    }
  }

  // Delete collection
  await collectionRepo.delete(activeCollection.value.id);

  // Reset active collection
  await loadCollections();
  await loadLearningItems();
}

function openItemModal(type: 'flashcard' | 'concept', item: any, isNew: boolean) {
  editingItemType.value = type;
  editingItem.value = item;
  isNewItem.value = isNew;
  itemModalRef.value?.open();
}

async function handleSaveItem(data: any) {
  if (!activeCollectionId.value) return;

  const itemData = {
    ...data,
    collectionId: activeCollectionId.value,
  };

  if (isNewItem.value) {
    if (editingItemType.value === 'flashcard') {
      await simpleFlashcardRepo.create(itemData);
    } else {
      await elaborativeInterrogationRepo.create(itemData);
    }
  } else {
    const id = editingItem.value?.id;
    if (editingItemType.value === 'flashcard') {
      await simpleFlashcardRepo.update(id, data);
    } else {
      await elaborativeInterrogationRepo.update(id, data);
    }
  }

  await loadLearningItems();
}

async function handleDeleteItem(type: 'flashcard' | 'concept', id: string) {
  const confirmed = confirm('Delete this learning item?');
  if (!confirmed) return;

  if (type === 'flashcard') {
    await simpleFlashcardRepo.delete(id);
  } else {
    await elaborativeInterrogationRepo.delete(id);
  }

  await loadLearningItems();
}

function openPreviewModal(type: 'flashcard' | 'concept', item: any) {
  previewItemType.value = type;
  previewItem.value = item;
  previewModalRef.value?.open();
}
</script>
```

## File Structure

```
src/pages/manage/
├── ManagePage.vue
├── CollectionEditModal.vue
├── LearningItemEditModal.vue
└── PreviewModal.vue
```

## Features

1. **Tabbed Collections**: Each tab represents a collection
2. **Collection Management**: Edit and delete in collapsible section
3. **Add Learning Items**: Buttons to add flashcards or concepts
4. **Learning Items Table**: Shows all items in active collection with Row components
5. **Item Actions**: Edit, Delete, Preview buttons for each item
6. **Cascade Delete**: Warns user before deleting collection and all its items

## Validation

- [ ] Collections appear as tabs
- [ ] Can create new collections
- [ ] Can edit collection name/description
- [ ] Can delete collection (with warning and cascade delete)
- [ ] Can add new flashcards and concepts
- [ ] Can edit existing items
- [ ] Can delete items
- [ ] Preview modal shows Preview component for items
- [ ] All modals work correctly
- [ ] ESLint passes

## Next Step

Proceed to `10-settings-page.md` to create the Settings page placeholder.
