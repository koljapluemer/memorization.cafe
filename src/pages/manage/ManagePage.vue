<template>
  <div>
    <!-- Tabs -->
    <div
      role="tablist"
      class="tabs tabs-bordered mb-6"
    >
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

      <button
        class="tab"
        @click="openCollectionModal(null, true)"
      >
        <Plus :size="16" /> New
      </button>
    </div>

    <!-- Active Collection Content -->
    <div v-if="activeCollection">
      <!-- Collection Actions (Collapsible) -->
      <details class="collapse collapse-arrow bg-base-200 mb-4">
        <summary class="collapse-title font-medium">
          Collection Actions
        </summary>
        <div class="collapse-content space-y-2">
          <button
            class="btn btn-sm"
            @click="openCollectionModal(activeCollection, false)"
          >
            <Edit :size="16" /> Edit Collection
          </button>
          <button
            class="btn btn-sm btn-error"
            @click="handleDeleteCollection"
          >
            <Trash2 :size="16" /> Delete Collection
          </button>
        </div>
      </details>

      <!-- Add Learning Items -->
      <div class="flex gap-2 mb-4">
        <button
          class="btn btn-sm"
          @click="openItemModal('flashcard', null, true)"
        >
          + Flashcard
        </button>
        <button
          class="btn btn-sm"
          @click="openItemModal('concept', null, true)"
        >
          + Elaborative Interrogation Concept
        </button>
        <button
          class="btn btn-sm"
          @click="openItemModal('list', null, true)"
        >
          + List
        </button>
        <button
          class="btn btn-sm"
          @click="openItemModal('cloze', null, true)"
        >
          + Cloze
        </button>
      </div>

      <!-- Learning Items Table -->
      <div class="overflow-x-auto">
        <table class="table w-full">
          <tbody>
            <tr
              v-for="item in allLearningItems"
              :key="item.id"
            >
              <td>
                <SimpleFlashcardRow
                  v-if="item.type === 'flashcard'"
                  :flashcard="item.data"
                />
                <ElaborativeInterrogationRow
                  v-else-if="item.type === 'concept'"
                  :concept="item.data"
                />
                <ListRow
                  v-else-if="item.type === 'list'"
                  :list="item.data"
                />
                <ClozeRow
                  v-else-if="item.type === 'cloze'"
                  :cloze="item.data"
                />
              </td>
              <td class="text-right">
                <div class="flex gap-2 justify-end">
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="openItemModal(item.type, item.data, false)"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="openMoveItemModal(item.type, item.data)"
                  >
                    <FolderInput :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="item.data.id && handleDeleteItem(item.type, item.data.id)"
                  >
                    <Trash2 :size="16" />
                  </button>
                  <button
                    class="btn btn-ghost btn-sm"
                    @click="openPreviewModal(item.type, item.data)"
                  >
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
      v-if="previewItem"
      ref="previewModalRef"
      :item-type="previewItemType"
      :item="previewItem"
    />

    <MoveItemModal
      ref="moveItemModalRef"
      :existing-collections="otherCollections"
      @move="handleMoveToCollection"
      @create-and-move="handleCreateAndMoveToCollection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Edit, Trash2, Eye, FolderInput } from 'lucide-vue-next';

import CollectionEditModal from './CollectionEditModal.vue';
import LearningItemEditModal from './LearningItemEditModal.vue';
import PreviewModal from './PreviewModal.vue';
import MoveItemModal from './MoveItemModal.vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo, ElaborativeInterrogationRow } from '@/entities/elaborative-interrogation';
import { simpleFlashcardRepo, SimpleFlashcardRow } from '@/entities/simple-flashcard';
import { listRepo, ListRow } from '@/entities/list';
import { clozeRepo, ClozeRow } from '@/entities/cloze';
import { useToast } from '@/app/toast';

const collections = ref<Collection[]>([]);
const activeCollectionId = ref<string | null>(null);

const flashcards = ref<SimpleFlashcard[]>([]);
const concepts = ref<ElaborativeInterrogationConcept[]>([]);
const lists = ref<List[]>([]);
const clozes = ref<Cloze[]>([]);

const collectionModalRef = ref<InstanceType<typeof CollectionEditModal> | null>(null);
const itemModalRef = ref<InstanceType<typeof LearningItemEditModal> | null>(null);
const previewModalRef = ref<InstanceType<typeof PreviewModal> | null>(null);
const moveItemModalRef = ref<InstanceType<typeof MoveItemModal> | null>(null);

const editingCollection = ref<Collection | undefined>(undefined);
const isNewCollection = ref(false);

const editingItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const editingItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | undefined>(undefined);
const isNewItem = ref(false);

const previewItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const previewItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);

const movingItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const movingItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);

const { show: showToast } = useToast();

const activeCollection = computed(() =>
  collections.value.find(c => c.id === activeCollectionId.value)
);

const otherCollections = computed(() =>
  collections.value.filter(c => c.id !== activeCollectionId.value)
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
    ...lists.value
      .filter(l => l.collectionId === activeCollectionId.value)
      .map(l => ({ type: 'list' as const, data: l, id: l.id })),
    ...clozes.value
      .filter(c => c.collectionId === activeCollectionId.value)
      .map(c => ({ type: 'cloze' as const, data: c, id: c.id })),
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
    const firstCollection = collections.value[0];
    if (firstCollection?.id) {
      activeCollectionId.value = firstCollection.id;
    }
  }
}

async function loadLearningItems() {
  flashcards.value = await simpleFlashcardRepo.getAll();
  concepts.value = await elaborativeInterrogationRepo.getAll();
  lists.value = await listRepo.getAll();
  clozes.value = await clozeRepo.getAll();
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
    if (item.data.id) {
      if (item.type === 'flashcard') {
        await simpleFlashcardRepo.delete(item.data.id);
      } else if (item.type === 'concept') {
        await elaborativeInterrogationRepo.delete(item.data.id);
      } else if (item.type === 'list') {
        await listRepo.delete(item.data.id);
      } else if (item.type === 'cloze') {
        await clozeRepo.delete(item.data.id);
      }
    }
  }

  // Delete collection
  await collectionRepo.delete(activeCollection.value.id);

  // Reset active collection
  await loadCollections();
  await loadLearningItems();
}

function openItemModal(type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null, isNew: boolean) {
  editingItemType.value = type;
  editingItem.value = item || undefined;
  isNewItem.value = isNew;
  itemModalRef.value?.open();
}

async function handleSaveItem(data: unknown) {
  if (!activeCollectionId.value) return;

  // Convert reactive Proxy to plain object for Dexie
  const plainData = JSON.parse(JSON.stringify(data));

  const itemData = {
    ...plainData,
    collectionId: activeCollectionId.value,
  };

  if (isNewItem.value) {
    if (editingItemType.value === 'flashcard') {
      await simpleFlashcardRepo.create(itemData as Omit<SimpleFlashcard, 'id'>);
    } else if (editingItemType.value === 'concept') {
      await elaborativeInterrogationRepo.create(itemData as Omit<ElaborativeInterrogationConcept, 'id'>);
    } else if (editingItemType.value === 'list') {
      await listRepo.create(itemData as Omit<List, 'id'>);
    } else if (editingItemType.value === 'cloze') {
      await clozeRepo.create(itemData as Omit<Cloze, 'id'>);
    }
  } else {
    const id = (editingItem.value as { id?: string })?.id;
    if (id) {
      if (editingItemType.value === 'flashcard') {
        await simpleFlashcardRepo.update(id, plainData as Partial<SimpleFlashcard>);
      } else if (editingItemType.value === 'concept') {
        await elaborativeInterrogationRepo.update(id, plainData as Partial<ElaborativeInterrogationConcept>);
      } else if (editingItemType.value === 'list') {
        await listRepo.update(id, plainData as Partial<List>);
      } else if (editingItemType.value === 'cloze') {
        await clozeRepo.update(id, plainData as Partial<Cloze>);
      }
    }
  }

  await loadLearningItems();
}

async function handleDeleteItem(type: 'flashcard' | 'concept' | 'list' | 'cloze', id: string) {
  const confirmed = confirm('Delete this learning item?');
  if (!confirmed) return;

  if (type === 'flashcard') {
    await simpleFlashcardRepo.delete(id);
  } else if (type === 'concept') {
    await elaborativeInterrogationRepo.delete(id);
  } else if (type === 'list') {
    await listRepo.delete(id);
  } else if (type === 'cloze') {
    await clozeRepo.delete(id);
  }

  await loadLearningItems();
}

function openPreviewModal(type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze) {
  previewItemType.value = type;
  previewItem.value = item;
  previewModalRef.value?.open();
}

function openMoveItemModal(type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze) {
  movingItemType.value = type;
  movingItem.value = item;
  moveItemModalRef.value?.open();
}

async function handleMoveToCollection(targetCollectionId: string) {
  if (!movingItem.value?.id) return;

  const itemId = movingItem.value.id;
  const type = movingItemType.value;

  try {
    if (type === 'flashcard') {
      await simpleFlashcardRepo.update(itemId, { collectionId: targetCollectionId });
    } else if (type === 'concept') {
      await elaborativeInterrogationRepo.update(itemId, { collectionId: targetCollectionId });
    } else if (type === 'list') {
      await listRepo.update(itemId, { collectionId: targetCollectionId });
    } else if (type === 'cloze') {
      await clozeRepo.update(itemId, { collectionId: targetCollectionId });
    }

    await loadLearningItems();

    const targetCollection = collections.value.find(c => c.id === targetCollectionId);
    const itemName = getItemName(movingItem.value, type);
    showToast(`${itemName} was moved to ${targetCollection?.name || 'collection'}`, 'success');
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to move item', 'error');
  }
}

async function handleCreateAndMoveToCollection(newCollectionName: string) {
  if (!movingItem.value?.id) return;

  try {
    const newCollectionId = await collectionRepo.create({ name: newCollectionName });
    await loadCollections();
    await handleMoveToCollection(newCollectionId);
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Failed to create collection and move item', 'error');
  }
}

function getItemName(item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze, type: 'flashcard' | 'concept' | 'list' | 'cloze'): string {
  if (type === 'flashcard') {
    const flashcard = item as SimpleFlashcard;
    return flashcard.front.length > 20 ? flashcard.front.substring(0, 20) + '...' : flashcard.front;
  } else if (type === 'concept') {
    const concept = item as ElaborativeInterrogationConcept;
    return concept.name;
  } else if (type === 'list') {
    const list = item as List;
    return list.name;
  } else if (type === 'cloze') {
    const cloze = item as Cloze;
    return cloze.content.length > 20 ? cloze.content.substring(0, 20) + '...' : cloze.content;
  }
  return 'Item';
}
</script>

