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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Plus, Edit, Trash2, Eye } from 'lucide-vue-next';

import CollectionEditModal from './CollectionEditModal.vue';
import LearningItemEditModal from './LearningItemEditModal.vue';
import PreviewModal from './PreviewModal.vue';

import type { SimpleFlashcard, ElaborativeInterrogationConcept } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo, ElaborativeInterrogationRow } from '@/entities/elaborative-interrogation';
import { simpleFlashcardRepo, SimpleFlashcardRow } from '@/entities/simple-flashcard';

const collections = ref<Collection[]>([]);
const activeCollectionId = ref<string | null>(null);

const flashcards = ref<SimpleFlashcard[]>([]);
const concepts = ref<ElaborativeInterrogationConcept[]>([]);

const collectionModalRef = ref<InstanceType<typeof CollectionEditModal> | null>(null);
const itemModalRef = ref<InstanceType<typeof LearningItemEditModal> | null>(null);
const previewModalRef = ref<InstanceType<typeof PreviewModal> | null>(null);

const editingCollection = ref<Collection | undefined>(undefined);
const isNewCollection = ref(false);

const editingItemType = ref<'flashcard' | 'concept'>('flashcard');
const editingItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | undefined>(undefined);
const isNewItem = ref(false);

const previewItemType = ref<'flashcard' | 'concept'>('flashcard');
const previewItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | null>(null);

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
    const firstCollection = collections.value[0];
    if (firstCollection?.id) {
      activeCollectionId.value = firstCollection.id;
    }
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
    if (item.data.id) {
      if (item.type === 'flashcard') {
        await simpleFlashcardRepo.delete(item.data.id);
      } else {
        await elaborativeInterrogationRepo.delete(item.data.id);
      }
    }
  }

  // Delete collection
  await collectionRepo.delete(activeCollection.value.id);

  // Reset active collection
  await loadCollections();
  await loadLearningItems();
}

function openItemModal(type: 'flashcard' | 'concept', item: SimpleFlashcard | ElaborativeInterrogationConcept | null, isNew: boolean) {
  editingItemType.value = type;
  editingItem.value = item || undefined;
  isNewItem.value = isNew;
  itemModalRef.value?.open();
}

async function handleSaveItem(data: unknown) {
  if (!activeCollectionId.value) return;

  const itemData = {
    ...(data as Record<string, unknown>),
    collectionId: activeCollectionId.value,
  };

  if (isNewItem.value) {
    if (editingItemType.value === 'flashcard') {
      await simpleFlashcardRepo.create(itemData as Omit<SimpleFlashcard, 'id'>);
    } else {
      await elaborativeInterrogationRepo.create(itemData as Omit<ElaborativeInterrogationConcept, 'id'>);
    }
  } else {
    const id = (editingItem.value as { id?: string })?.id;
    if (id) {
      if (editingItemType.value === 'flashcard') {
        await simpleFlashcardRepo.update(id, data as Partial<SimpleFlashcard>);
      } else {
        await elaborativeInterrogationRepo.update(id, data as Partial<ElaborativeInterrogationConcept>);
      }
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

function openPreviewModal(type: 'flashcard' | 'concept', item: SimpleFlashcard | ElaborativeInterrogationConcept) {
  previewItemType.value = type;
  previewItem.value = item;
  previewModalRef.value?.open();
}
</script>

