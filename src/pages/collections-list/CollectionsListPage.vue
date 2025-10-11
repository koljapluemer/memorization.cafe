<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            Collections
          </h1>
          <p class="text-sm text-base-content/70">
            Organize learning items into collections.
          </p>
        </div>
        <RouterLink
          class="btn btn-primary"
          to="/collections/edit"
        >
          Add collection
        </RouterLink>
      </div>
    </section>

    <div
      v-if="isLoading"
      class="card bg-base-100 shadow"
    >
      <div class="card-body">
        <p>Loading collections...</p>
      </div>
    </div>

    <div
      v-else-if="collections.length === 0"
      class="card bg-base-100 shadow"
    >
      <div class="card-body">
        <p>No collections yet. Create your first collection to get started.</p>
      </div>
    </div>

    <div
      v-else
      class="grid gap-4"
    >
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="card-title">
                {{ collection.title }}
              </h2>
              <p
                v-if="collection.description"
                class="text-sm text-base-content/70"
              >
                {{ collection.description }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <RouterLink
                :to="`/collections/${collection.id}/items`"
                class="btn btn-sm"
              >
                View items
              </RouterLink>
              <RouterLink
                :to="`/collections/edit/${collection.id}`"
                class="btn btn-sm"
              >
                Edit
              </RouterLink>
              <button
                type="button"
                class="btn btn-sm btn-error"
                @click="confirmDelete(collection)"
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

import { useCollectionRepository } from '../../app/providers';
import type { CollectionRecord } from '../../entities/collection';

const repository = useCollectionRepository();

const collections = ref<CollectionRecord[]>([]);
const isLoading = ref(true);

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = repository.watchAll().subscribe({
    next(value) {
      collections.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load collections', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

async function confirmDelete(record: CollectionRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';
  const shouldDelete = canConfirm ? globalThis.confirm('Delete this collection?') : true;
  if (!shouldDelete) {
    return;
  }
  await repository.remove(record.id);
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
