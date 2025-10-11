<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold">
              {{ isEditing ? 'Edit learning item' : 'New learning item' }}
            </h1>
            <p class="text-sm text-base-content/70">
              Provide a name and optional description and collection.
            </p>
          </div>
          <RouterLink
            to="/learning-items/list"
            class="btn"
          >
            Back to list
          </RouterLink>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Name</span>
            </div>
            <input
              v-model="form.name"
              type="text"
              class="input input-bordered"
              placeholder="Learning item name"
              required
            >
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Description</span>
            </div>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered h-24"
              placeholder="Optional description"
            />
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Collection</span>
            </div>
            <select
              v-model="form.collectionId"
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

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="btn"
              @click="resetForm"
            >
              Reset
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isBlockingSubmit"
            >
              {{ isEditing ? 'Save changes' : 'Create learning item' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

import { useLearningItemRepository, useCollectionRepository } from '../../app/providers';
import type { CollectionRecord } from '../../entities/collection';

interface LearningItemFormState {
  name: string;
  description: string;
  collectionId: string;
}

const learningItemRepository = useLearningItemRepository();
const collectionRepository = useCollectionRepository();
const route = useRoute();
const router = useRouter();

const form = reactive<LearningItemFormState>({
  name: '',
  description: '',
  collectionId: '',
});

const collections = ref<CollectionRecord[]>([]);
const currentId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);

const isEditing = computed(() => Boolean(currentId.value));
const isBlockingSubmit = computed(
  () => isSaving.value || !form.name.trim(),
);

let collectionSubscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
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
  collectionSubscription?.unsubscribe();
});

watch(
  () => route.params.id,
  (value) => {
    const idParam = Array.isArray(value) ? value[0] : value;
    currentId.value = idParam ?? null;
    void loadRecord();
  },
  { immediate: true },
);

async function loadRecord() {
  if (!currentId.value) {
    clearForm();
    return;
  }
  isLoading.value = true;
  try {
    const record = await learningItemRepository.get(currentId.value);
    if (!record) {
      await router.replace('/learning-items/list');
      return;
    }
    form.name = record.name;
    form.description = record.description;
    form.collectionId = record.collectionId ?? '';
  } catch (error) {
    reportError('Failed to load learning item', error);
  } finally {
    isLoading.value = false;
  }
}

async function handleSubmit() {
  if (isBlockingSubmit.value) {
    return;
  }
  isSaving.value = true;
  try {
    if (currentId.value) {
      await learningItemRepository.update(currentId.value, {
        name: form.name,
        description: form.description,
        collectionId: form.collectionId || null,
      });
    } else {
      await learningItemRepository.create({
        name: form.name,
        description: form.description,
        collectionId: form.collectionId || null,
      });
    }
    await router.push('/learning-items/list');
  } catch (error) {
    reportError('Failed to save learning item', error);
  } finally {
    isSaving.value = false;
  }
}

function resetForm() {
  if (currentId.value) {
    void loadRecord();
    return;
  }
  clearForm();
}

function clearForm() {
  form.name = '';
  form.description = '';
  form.collectionId = '';
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
