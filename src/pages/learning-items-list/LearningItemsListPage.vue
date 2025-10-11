<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Learning Items
          </h1>
          <p class="text-sm text-base-content/70">
            Manage learning items and assign them to collections.
          </p>
        </div>
        <RouterLink
          class="btn btn-primary"
          to="/learning-items/edit"
        >
          Add learning item
        </RouterLink>
      </div>
    </section>

    <div class="collapse collapse-arrow bg-base-100 shadow">
      <input
        v-model="batchOpsOpen"
        type="checkbox"
      >
      <div class="collapse-title font-semibold">
        Batch operations
        <span v-if="selectedIds.size > 0">({{ selectedIds.size }} selected)</span>
      </div>
      <div class="collapse-content space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm"
            @click="selectAll"
          >
            Select all
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :disabled="selectedIds.size === 0"
            @click="clearSelection"
          >
            Clear selection
          </button>
          <button
            type="button"
            class="btn btn-sm btn-error"
            :disabled="selectedIds.size === 0"
            @click="deleteSelected"
          >
            Delete selected
          </button>
        </div>

        <div
          v-if="selectedIds.size > 0"
          class="space-y-2"
        >
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Assign to collection</span>
            </div>
            <select
              v-model="selectedCollectionId"
              class="select select-bordered"
            >
              <option value="">
                No collection
              </option>
              <option
                v-for="collection in collections"
                :key="collection.id"
                :value="collection.id"
              >
                {{ collection.title }}
              </option>
            </select>
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm"
              :disabled="!selectedCollectionId"
              @click="attachToCollection"
            >
              Attach to collection
            </button>
            <button
              type="button"
              class="btn btn-sm"
              @click="detachFromCollection"
            >
              Remove from collections
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="card bg-base-100 shadow"
    >
      <div class="card-body">
        <p>Loading learning items...</p>
      </div>
    </div>

    <div
      v-else-if="learningItems.length === 0"
      class="card bg-base-100 shadow"
    >
      <div class="card-body">
        <p>No learning items yet. Create your first learning item to get started.</p>
      </div>
    </div>

    <div
      v-else
      class="grid gap-4"
    >
      <div
        v-for="item in learningItems"
        :key="item.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <div class="flex items-start gap-4">
            <label class="label cursor-pointer">
              <input
                type="checkbox"
                class="checkbox"
                :checked="selectedIds.has(item.id)"
                @change="toggleSelect(item.id)"
              >
            </label>
            <div class="flex-1">
              <h2 class="card-title">
                {{ item.name }}
              </h2>
              <p
                v-if="item.description"
                class="text-sm text-base-content/70"
              >
                {{ item.description }}
              </p>
              <p
                v-if="item.collectionId"
                class="mt-1 text-xs text-base-content/50"
              >
                Collection: {{ getCollectionName(item.collectionId) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <RouterLink
                :to="`/learning-items/edit/${item.id}`"
                class="btn btn-sm"
              >
                Edit
              </RouterLink>
              <button
                type="button"
                class="btn btn-sm btn-error"
                @click="confirmDelete(item)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useLearningItemRepository, useCollectionRepository } from '../../app/providers';
import type { LearningItemRecord } from '../../entities/learning-item';
import type { CollectionRecord } from '../../entities/collection';

const learningItemRepository = useLearningItemRepository();
const collectionRepository = useCollectionRepository();

const learningItems = ref<LearningItemRecord[]>([]);
const collections = ref<CollectionRecord[]>([]);
const isLoading = ref(true);
const selectedIds = ref<Set<string>>(new Set());
const batchOpsOpen = ref(true);
const selectedCollectionId = ref('');

let itemSubscription: { unsubscribe: () => void } | null = null;
let collectionSubscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  itemSubscription = learningItemRepository.watchAll().subscribe({
    next(value) {
      learningItems.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load learning items', error);
      isLoading.value = false;
    },
  });

  collectionSubscription = collectionRepository.watchAll().subscribe({
    next(value) {
      collections.value = value;
    },
    error(error) {
      reportError('Failed to load collections', error);
    },
  });
});

onBeforeUnmount(() => {
  itemSubscription?.unsubscribe();
  collectionSubscription?.unsubscribe();
});

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  selectedIds.value = new Set(selectedIds.value);
}

function selectAll() {
  selectedIds.value = new Set(learningItems.value.map((item) => item.id));
}

function clearSelection() {
  selectedIds.value.clear();
  selectedIds.value = new Set(selectedIds.value);
}

async function deleteSelected() {
  const count = selectedIds.value.size;
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm
    ? globalThis.confirm(`Delete ${count} learning item${count === 1 ? '' : 's'}?`)
    : true;
  if (!shouldDelete) {
    return;
  }

  for (const id of selectedIds.value) {
    await learningItemRepository.remove(id);
  }
  selectedIds.value.clear();
  selectedIds.value = new Set(selectedIds.value);
}

async function attachToCollection() {
  if (!selectedCollectionId.value) {
    return;
  }
  try {
    await learningItemRepository.attachToCollection(
      Array.from(selectedIds.value),
      selectedCollectionId.value,
    );
    showAlert(`Attached ${selectedIds.value.size} item(s) to collection`);
    selectedIds.value.clear();
    selectedIds.value = new Set(selectedIds.value);
    selectedCollectionId.value = '';
  } catch (error) {
    reportError('Failed to attach to collection', error);
  }
}

async function detachFromCollection() {
  try {
    await learningItemRepository.detachFromCollection(Array.from(selectedIds.value));
    showAlert(`Removed ${selectedIds.value.size} item(s) from their collections`);
    selectedIds.value.clear();
    selectedIds.value = new Set(selectedIds.value);
  } catch (error) {
    reportError('Failed to detach from collection', error);
  }
}

async function confirmDelete(record: LearningItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this learning item?') : true;
  if (!shouldDelete) {
    return;
  }
  await learningItemRepository.remove(record.id);
  selectedIds.value.delete(record.id);
  selectedIds.value = new Set(selectedIds.value);
}

function getCollectionName(collectionId: string): string {
  const collection = collections.value.find((c) => c.id === collectionId);
  return collection?.title ?? 'Unknown';
}

function showAlert(message: string) {
  if (typeof globalThis !== 'undefined' && 'alert' in globalThis) {
    globalThis.alert(message);
  }
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
