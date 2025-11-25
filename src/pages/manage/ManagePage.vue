<template>
  <div>
    <!-- Empty State (no tabs open) -->
    <EmptyState
      v-if="openTabIds.length === 0"
      :has-collections="collections.length > 0"
      @open-collection="openCollectionModalRef?.open()"
      @new-collection="openCollectionModal(null, true)"
    />

    <!-- Tabs and Content (when tabs are open) -->
    <template v-else>
      <TabBar
        :open-tabs="openTabs"
        :active-tab-id="activeTabId"
        :has-unopened-collections="unopenedCollections.length > 0"
        @switch-tab="switchToTab"
        @close-tab="closeTab"
        @open-collection="openCollectionModalRef?.open()"
        @new-collection="openCollectionModal(null, true)"
      />

      <!-- Active Collection Content -->
      <CollectionContent
        v-if="activeCollection"
        :collection="activeCollection"
        :learning-items="allLearningItems"
        @edit-collection="openCollectionModal(activeCollection, false)"
        @share-collection="openShareModal"
        @delete-collection="handleDeleteCollection"
        @add-item="(type) => openItemModal(type, null, true)"
        @edit-item="(type, item) => openItemModal(type, item, false)"
        @delete-item="handleDeleteItem"
        @preview-item="openPreviewModal"
        @move-item="openMoveItemModal"
        @download-example-csv="handleDownloadExampleCsv"
        @import-csv="handleImportCsvClick"
      />

      <!-- Hidden file input for CSV import -->
      <input
        ref="csvFileInputRef"
        type="file"
        accept=".csv"
        class="hidden"
        @change="handleCsvFileSelected"
      >
    </template>

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

    <OpenCollectionModal
      ref="openCollectionModalRef"
      :collections="collections"
      :open-tab-ids="openTabIds"
      @select="openTab"
    />

    <ShareCollectionModal
      v-if="activeCollection?.id"
      ref="shareModalRef"
      :collection-id="activeCollection.id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

import EmptyState from './EmptyState.vue';
import TabBar from './TabBar.vue';
import CollectionContent from './CollectionContent.vue';
import CollectionEditModal from './CollectionEditModal.vue';
import LearningItemEditModal from './LearningItemEditModal.vue';
import PreviewModal from './PreviewModal.vue';
import MoveItemModal from './MoveItemModal.vue';
import OpenCollectionModal from './OpenCollectionModal.vue';
import { ShareCollectionModal } from '@/features/collection-sharing';
import { loadOpenTabs, saveOpenTabs } from './tab-storage';
import { generateExampleCsv, downloadCsv, parseCsv, validateCsvData, readFileAsText, type EntityType } from './csv-utils';
import { importFlashcardsFromCsv, importConceptsFromCsv, importListsFromCsv, importClozesFromCsv } from './csv-import';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { collectionRepo, type Collection } from '@/entities/collection';
import { elaborativeInterrogationRepo } from '@/entities/elaborative-interrogation';
import { simpleFlashcardRepo } from '@/entities/simple-flashcard';
import { listRepo } from '@/entities/list';
import { clozeRepo } from '@/entities/cloze';
import { useToast } from '@/app/toast';

const collections = ref<Collection[]>([]);
const openTabIds = ref<string[]>([]);
const activeTabId = ref<string | null>(null);

const flashcards = ref<SimpleFlashcard[]>([]);
const concepts = ref<ElaborativeInterrogationConcept[]>([]);
const lists = ref<List[]>([]);
const clozes = ref<Cloze[]>([]);

const collectionModalRef = ref<InstanceType<typeof CollectionEditModal> | null>(null);
const itemModalRef = ref<InstanceType<typeof LearningItemEditModal> | null>(null);
const previewModalRef = ref<InstanceType<typeof PreviewModal> | null>(null);
const moveItemModalRef = ref<InstanceType<typeof MoveItemModal> | null>(null);
const openCollectionModalRef = ref<InstanceType<typeof OpenCollectionModal> | null>(null);
const shareModalRef = ref<InstanceType<typeof ShareCollectionModal> | null>(null);

const editingCollection = ref<Collection | undefined>(undefined);
const isNewCollection = ref(false);

const editingItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const editingItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | undefined>(undefined);
const isNewItem = ref(false);

const previewItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const previewItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);

const movingItemType = ref<'flashcard' | 'concept' | 'list' | 'cloze'>('flashcard');
const movingItem = ref<SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze | null>(null);

const csvFileInputRef = ref<HTMLInputElement | null>(null);
const pendingImportType = ref<EntityType | null>(null);

const { show: showToast } = useToast();

const activeCollection = computed(() =>
  collections.value.find(c => c.id === activeTabId.value)
);

const openTabs = computed(() => {
  return openTabIds.value
    .map(id => collections.value.find(c => c.id === id))
    .filter((c): c is Collection => c !== undefined);
});

const unopenedCollections = computed(() => {
  return collections.value.filter(c => !openTabIds.value.includes(c.id!));
});

const otherCollections = computed(() =>
  collections.value.filter(c => c.id !== activeTabId.value)
);

const allLearningItems = computed(() => {
  if (!activeTabId.value) return [];

  const items = [
    ...flashcards.value
      .filter(f => f.collectionId === activeTabId.value)
      .map(f => ({ type: 'flashcard' as const, data: f, id: f.id })),
    ...concepts.value
      .filter(c => c.collectionId === activeTabId.value)
      .map(c => ({ type: 'concept' as const, data: c, id: c.id })),
    ...lists.value
      .filter(l => l.collectionId === activeTabId.value)
      .map(l => ({ type: 'list' as const, data: l, id: l.id })),
    ...clozes.value
      .filter(c => c.collectionId === activeTabId.value)
      .map(c => ({ type: 'cloze' as const, data: c, id: c.id })),
  ];

  return items;
});

onMounted(async () => {
  await loadCollections();
  await loadLearningItems();
  initializeTabs();
});

function initializeTabs() {
  // Load open tabs from localStorage
  const savedTabIds = loadOpenTabs();

  // Filter out tabs for collections that no longer exist
  const validTabIds = savedTabIds.filter(id =>
    collections.value.some(c => c.id === id)
  );

  // If we have valid saved tabs, restore them
  if (validTabIds.length > 0) {
    openTabIds.value = validTabIds;
    activeTabId.value = validTabIds[0]!;
  } else if (collections.value.length > 0) {
    // No saved tabs but collections exist - open first collection
    const firstCollection = collections.value[0];
    if (firstCollection?.id) {
      openTabIds.value = [firstCollection.id];
      activeTabId.value = firstCollection.id;
      saveOpenTabs(openTabIds.value);
    }
  }
  // If no collections exist, stay in empty state (no tabs open)
}

async function loadCollections() {
  collections.value = await collectionRepo.getAll();
}

// Watch openTabIds and save to localStorage whenever it changes
watch(openTabIds, (newTabIds) => {
  saveOpenTabs(newTabIds);
}, { deep: true });

async function loadLearningItems() {
  flashcards.value = await simpleFlashcardRepo.getAll();
  concepts.value = await elaborativeInterrogationRepo.getAll();
  lists.value = await listRepo.getAll();
  clozes.value = await clozeRepo.getAll();
}

// Tab management functions
function openTab(collectionId: string) {
  if (!openTabIds.value.includes(collectionId)) {
    openTabIds.value.push(collectionId);
  }
  activeTabId.value = collectionId;
}

function closeTab(collectionId: string) {
  const index = openTabIds.value.indexOf(collectionId);
  if (index === -1) return;

  openTabIds.value.splice(index, 1);

  // If we closed the active tab, switch to another
  if (activeTabId.value === collectionId) {
    if (openTabIds.value.length > 0) {
      // Switch to adjacent tab (prefer next, fallback to previous)
      activeTabId.value = openTabIds.value[index] || openTabIds.value[index - 1] || null;
    } else {
      activeTabId.value = null;
    }
  }
}

function switchToTab(collectionId: string) {
  activeTabId.value = collectionId;
}

function openCollectionModal(collection: Collection | null, isNew: boolean) {
  editingCollection.value = collection || undefined;
  isNewCollection.value = isNew;
  // Pass the collection directly to open()
  collectionModalRef.value?.open(collection || undefined);
}

function openShareModal() {
  shareModalRef.value?.open();
}

async function handleSaveCollection(data: { name: string; description?: string }) {
  if (isNewCollection.value) {
    const id = await collectionRepo.create(data);
    await loadCollections();
    // Auto-open newly created collection as a tab
    openTab(id);
  } else if (editingCollection.value?.id) {
    await collectionRepo.update(editingCollection.value.id, data);
    await loadCollections();
  }
}

async function handleDeleteCollection() {
  if (!activeCollection.value?.id) return;

  const collectionIdToDelete = activeCollection.value.id;

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
  await collectionRepo.delete(collectionIdToDelete);

  // Close the tab for this collection
  closeTab(collectionIdToDelete);

  // Reload data
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
  if (!activeTabId.value) return;

  // Convert reactive Proxy to plain object for Dexie
  const plainData = JSON.parse(JSON.stringify(data));

  const itemData = {
    ...plainData,
    collectionId: activeTabId.value,
  };

  // Set default minimumInterval for new items
  if (isNewItem.value && !itemData.minimumInterval) {
    if (editingItemType.value === 'concept') {
      itemData.minimumInterval = 'WEEK';
    } else if (editingItemType.value === 'list') {
      itemData.minimumInterval = 'DAY';
    }
    // flashcards and clozes have no default (undefined)
  }

  let itemId: string | undefined;

  if (isNewItem.value) {
    if (editingItemType.value === 'flashcard') {
      itemId = await simpleFlashcardRepo.create(itemData as Omit<SimpleFlashcard, 'id'>);
    } else if (editingItemType.value === 'concept') {
      itemId = await elaborativeInterrogationRepo.create(itemData as Omit<ElaborativeInterrogationConcept, 'id'>);
    } else if (editingItemType.value === 'list') {
      itemId = await listRepo.create(itemData as Omit<List, 'id'>);
    } else if (editingItemType.value === 'cloze') {
      itemId = await clozeRepo.create(itemData as Omit<Cloze, 'id'>);
    }
  } else {
    itemId = (editingItem.value as { id?: string })?.id;
    if (itemId) {
      if (editingItemType.value === 'flashcard') {
        await simpleFlashcardRepo.update(itemId, plainData as Partial<SimpleFlashcard>);
      } else if (editingItemType.value === 'concept') {
        await elaborativeInterrogationRepo.update(itemId, plainData as Partial<ElaborativeInterrogationConcept>);
      } else if (editingItemType.value === 'list') {
        await listRepo.update(itemId, plainData as Partial<List>);
      } else if (editingItemType.value === 'cloze') {
        await clozeRepo.update(itemId, plainData as Partial<Cloze>);
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

// CSV Import/Export handlers
function handleDownloadExampleCsv(type: EntityType) {
  const csv = generateExampleCsv(type);
  const entityName = getEntityDisplayName(type);
  downloadCsv(csv, `${entityName}-example.csv`);
  showToast(`Downloaded example CSV for ${entityName}`, 'success');
}

function handleImportCsvClick(type: EntityType) {
  pendingImportType.value = type;
  // Reset and trigger file input
  if (csvFileInputRef.value) {
    csvFileInputRef.value.value = '';
    csvFileInputRef.value.click();
  }
}

async function handleCsvFileSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  const importType = pendingImportType.value;

  if (!file || !importType || !activeTabId.value) {
    return;
  }

  try {
    // Read and parse CSV
    const csvText = await readFileAsText(file);
    const data = parseCsv(csvText);

    // Validate
    const validation = validateCsvData(importType, data);
    if (!validation.valid) {
      showToast(`CSV validation failed:\n${validation.errors.join('\n')}`, 'error');
      return;
    }

    // Import based on type
    let result;
    switch (importType) {
      case 'flashcard':
        result = await importFlashcardsFromCsv(data, activeTabId.value);
        break;
      case 'concept':
        result = await importConceptsFromCsv(data, activeTabId.value);
        break;
      case 'list':
        result = await importListsFromCsv(data, activeTabId.value);
        break;
      case 'cloze':
        result = await importClozesFromCsv(data, activeTabId.value);
        break;
    }

    // Reload items
    await loadLearningItems();

    // Show result
    const entityName = getEntityDisplayName(importType);
    if (result.success > 0 && result.failed === 0 && result.skipped === 0) {
      showToast(`Successfully imported ${result.success} ${entityName}(s)`, 'success');
    } else if (result.success > 0 && result.failed === 0 && result.skipped > 0) {
      showToast(`Imported ${result.success} ${entityName}(s), ${result.skipped} skipped (duplicates)`, 'success');
    } else if (result.success > 0 && result.failed > 0) {
      const skipMsg = result.skipped > 0 ? `, ${result.skipped} skipped (duplicates)` : '';
      showToast(
        `Imported ${result.success} ${entityName}(s)${skipMsg}, ${result.failed} failed:\n${result.errors.slice(0, 3).join('\n')}`,
        'warning'
      );
    } else if (result.skipped > 0 && result.success === 0) {
      showToast(`All ${result.skipped} ${entityName}(s) were duplicates (skipped)`, 'info');
    } else {
      showToast(`Import failed:\n${result.errors.slice(0, 3).join('\n')}`, 'error');
    }
  } catch (error) {
    showToast(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
  }

  // Clear pending state
  pendingImportType.value = null;
}

function getEntityDisplayName(type: EntityType): string {
  switch (type) {
    case 'flashcard':
      return 'Flashcard';
    case 'concept':
      return 'Concept';
    case 'list':
      return 'List';
    case 'cloze':
      return 'Cloze';
  }
}
</script>

