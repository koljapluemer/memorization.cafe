<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Verbatim passages
          </h1>
          <p class="text-sm text-base-content/70">
            Keep your passages organised, review them, or edit the text directly.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            class="btn"
            to="/verbatim/queue"
          >
            Open queue
          </RouterLink>
          <button
            type="button"
            class="btn"
            @click="handleDownloadDemo"
          >
            Download demo CSV
          </button>
          <label class="btn">
            Import CSV
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              class="hidden"
              @change="handleFileChange"
            >
          </label>
          <RouterLink
            class="btn btn-primary"
            to="/verbatim/edit"
          >
            Add passage
          </RouterLink>
        </div>
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
      <div class="collapse-content">
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
            class="btn btn-sm btn-error"
            :disabled="selectedIds.size === 0"
            @click="deleteSelected"
          >
            Delete selected
          </button>
        </div>
      </div>
    </div>

    <VerbatimList
      :items="items"
      :loading="isLoading"
      :selected-ids="selectedIds"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
    >
      <template #empty>
        <p>
          Nothing stored yet. Create your first passage to begin practising.
        </p>
      </template>
      <template #actions="{ item }">
        <RouterLink
          :to="`/verbatim/edit/${item.id}`"
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
      </template>
    </VerbatimList>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { useVerbatimRepository } from '../../app/providers';
import type { VerbatimItemRecord } from '../../entities/verbatim-item';
import VerbatimList from './components/VerbatimList.vue';

const repository = useVerbatimRepository();

const items = ref<VerbatimItemRecord[]>([]);
const isLoading = ref(true);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedIds = ref<Set<string>>(new Set());
const batchOpsOpen = ref(true);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(value) {
      items.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load passages', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  selectedIds.value = new Set(selectedIds.value);
}

function toggleSelectAll() {
  if (selectedIds.value.size === items.value.length) {
    selectedIds.value.clear();
  } else {
    selectedIds.value = new Set(items.value.map((item) => item.id));
  }
  selectedIds.value = new Set(selectedIds.value);
}

function selectAll() {
  selectedIds.value = new Set(items.value.map((item) => item.id));
}

async function deleteSelected() {
  const count = selectedIds.value.size;
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm
    ? globalThis.confirm(`Delete ${count} passage${count === 1 ? '' : 's'}?`)
    : true;
  if (!shouldDelete) {
    return;
  }

  for (const id of selectedIds.value) {
    await repository.remove(id);
  }
  selectedIds.value.clear();
  selectedIds.value = new Set(selectedIds.value);
}

async function confirmDelete(record: VerbatimItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this passage?') : true;
  if (!shouldDelete) {
    return;
  }
  await repository.remove(record.id);
  selectedIds.value.delete(record.id);
  selectedIds.value = new Set(selectedIds.value);
}

function handleDownloadDemo() {
  repository.downloadDemoCsv();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const count = await repository.importFromCsv(text);
    showAlert(`Successfully imported ${count} passage${count === 1 ? '' : 's'}`);
  } catch (error) {
    reportError('Failed to import CSV', error);
    showAlert('Failed to import CSV. Please check the file format.');
  } finally {
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
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
