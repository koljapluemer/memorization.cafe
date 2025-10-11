<template>
  <div class="space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">
            {{ collection?.title ?? 'Collection' }}
          </h1>
          <p
            v-if="collection?.description"
            class="text-sm text-base-content/70"
          >
            {{ collection.description }}
          </p>
        </div>
        <RouterLink
          to="/collections/list"
          class="btn"
        >
          Back to collections
        </RouterLink>
      </div>
    </section>

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
        <p>No learning items in this collection yet.</p>
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
          <div class="flex items-start justify-between gap-4">
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
            </div>
            <div class="flex flex-wrap gap-2">
              <RouterLink
                :to="`/learning-items/edit/${item.id}`"
                class="btn btn-sm"
              >
                Edit
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

import { useCollectionRepository, useLearningItemRepository } from '../../app/providers';
import type { CollectionRecord } from '../../entities/collection';
import type { LearningItemRecord } from '../../entities/learning-item';

const collectionRepository = useCollectionRepository();
const learningItemRepository = useLearningItemRepository();
const route = useRoute();
const router = useRouter();

const collection = ref<CollectionRecord | null>(null);
const learningItems = ref<LearningItemRecord[]>([]);
const isLoading = ref(true);
const collectionId = ref<string | null>(null);

watch(
  () => route.params.id,
  (value) => {
    const idParam = Array.isArray(value) ? value[0] : value;
    collectionId.value = idParam ?? null;
    void loadData();
  },
  { immediate: true },
);

async function loadData() {
  if (!collectionId.value) {
    await router.replace('/collections/list');
    return;
  }

  isLoading.value = true;
  try {
    const collectionRecord = await collectionRepository.get(collectionId.value);
    if (!collectionRecord) {
      await router.replace('/collections/list');
      return;
    }
    collection.value = collectionRecord;
    learningItems.value = await learningItemRepository.getByCollection(collectionId.value);
  } catch (error) {
    reportError('Failed to load collection items', error);
  } finally {
    isLoading.value = false;
  }
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
