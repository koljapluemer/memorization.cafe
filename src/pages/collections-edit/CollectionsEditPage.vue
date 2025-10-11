<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold">
              {{ isEditing ? 'Edit collection' : 'New collection' }}
            </h1>
            <p class="text-sm text-base-content/70">
              Provide a title and optional description.
            </p>
          </div>
          <RouterLink
            to="/collections/list"
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
              <span class="label-text font-medium">Title</span>
            </div>
            <input
              v-model="form.title"
              type="text"
              class="input input-bordered"
              placeholder="Collection name"
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
              {{ isEditing ? 'Save changes' : 'Create collection' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

import { useCollectionRepository } from '../../app/providers';

interface CollectionFormState {
  title: string;
  description: string;
}

const repository = useCollectionRepository();
const route = useRoute();
const router = useRouter();

const form = reactive<CollectionFormState>({
  title: '',
  description: '',
});

const currentId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);

const isEditing = computed(() => Boolean(currentId.value));
const isBlockingSubmit = computed(
  () => isSaving.value || !form.title.trim(),
);

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
    const record = await repository.get(currentId.value);
    if (!record) {
      await router.replace('/collections/list');
      return;
    }
    form.title = record.title;
    form.description = record.description;
  } catch (error) {
    reportError('Failed to load collection', error);
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
      await repository.update(currentId.value, {
        title: form.title,
        description: form.description,
      });
    } else {
      await repository.create({
        title: form.title,
        description: form.description,
      });
    }
    await router.push('/collections/list');
  } catch (error) {
    reportError('Failed to save collection', error);
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
  form.title = '';
  form.description = '';
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
