<template>
  <section
    class="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
  >
    <div class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h2 class="card-title text-lg font-semibold">
          {{ editingId ? 'Edit Item' : 'Add Item' }}
        </h2>
        <form
          class="space-y-4"
          @submit.prevent="onSubmit"
        >
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Pre Exercise
            </span>
            <textarea
              v-model="form.preExercise"
              class="textarea textarea-bordered h-24"
              placeholder="Optional context"
            />
          </label>
          <label class="form-control w-full">
            <span class="label-text font-medium">
              To Memorize *
            </span>
            <textarea
              v-model="form.toMemorize"
              class="textarea textarea-bordered h-32"
              placeholder="Text to memorize"
              required
            />
          </label>
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Post Exercise
            </span>
            <textarea
              v-model="form.postExercise"
              class="textarea textarea-bordered h-24"
              placeholder="Optional debrief"
            />
          </label>
          <div class="flex items-center justify-between gap-2">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!canSubmit"
            >
              {{ editingId ? 'Save changes' : 'Add item' }}
            </button>
            <button
              v-if="editingId"
              type="button"
              class="btn btn-ghost"
              @click="resetForm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">
          Verbatim Items
        </h2>
        <span class="badge badge-neutral">
          {{ items.length }}
        </span>
      </div>
      <div
        v-if="isLoading"
        class="flex justify-center py-10"
      >
        <span
          class="loading loading-spinner loading-lg"
          aria-label="Loading verbatim items"
        />
      </div>
      <div
        v-else-if="items.length === 0"
        class="card bg-base-100 shadow"
      >
        <div class="card-body text-sm text-base-content/70">
          <p>
            Store your first passage using the form on the left.
          </p>
        </div>
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="card bg-base-100 shadow"
        >
          <div class="card-body space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="text-base font-semibold">
                {{ item.toMemorize.slice(0, 80) || 'Untitled' }}
              </h3>
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span>
                  Reps: {{ item.fsrsCard.reps }}
                </span>
                <span v-if="item.nextReview">
                  Next: {{ formatRelative(item.nextReview) }}
                </span>
              </div>
            </div>
            <div class="space-y-4">
              <div v-if="item.preExercise">
                <p class="text-sm font-medium text-base-content/70">
                  Pre Exercise
                </p>
                <MarkdownPreview :source="item.preExercise" />
              </div>
              <div>
                <p class="text-sm font-medium text-base-content/70">
                  To Memorize
                </p>
                <MarkdownPreview :source="item.toMemorize" />
              </div>
              <div v-if="item.postExercise">
                <p class="text-sm font-medium text-base-content/70">
                  Post Exercise
                </p>
                <MarkdownPreview :source="item.postExercise" />
              </div>
            </div>
            <div class="flex justify-between">
              <button
                type="button"
                class="btn btn-sm"
                @click="startEdit(item)"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-sm btn-error"
                @click="confirmDelete(item)"
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import MarkdownPreview from '../../dumb/MarkdownPreview.vue';
import type {
  VerbatimDraft,
  VerbatimItemRecord,
  VerbatimRepository,
} from '../../entities/verbatim-item';

interface Props {
  repository: VerbatimRepository;
}

const props = defineProps<Props>();

const items = ref<VerbatimItemRecord[]>([]);
const isLoading = ref(true);
const editingId = ref<string | null>(null);
const form = reactive<VerbatimDraft>({
  preExercise: '',
  toMemorize: '',
  postExercise: '',
});

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = props.repository.watchAll().subscribe({
    next(value) {
      items.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load verbatim items', error);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  subscription?.unsubscribe();
});

const canSubmit = ref(false);

watch(
  () => ({ ...form }),
  () => {
    canSubmit.value = Boolean(form.toMemorize.trim());
  },
  { deep: true, immediate: true },
);

async function onSubmit() {
  if (!canSubmit.value) {
    return;
  }

  if (editingId.value) {
    await props.repository.update(editingId.value, form);
  } else {
    await props.repository.create(form);
  }

  resetForm();
}

function resetForm() {
  editingId.value = null;
  form.preExercise = '';
  form.toMemorize = '';
  form.postExercise = '';
}

function startEdit(record: VerbatimItemRecord) {
  editingId.value = record.id;
  form.preExercise = record.preExercise;
  form.toMemorize = record.toMemorize;
  form.postExercise = record.postExercise;
}

async function confirmDelete(record: VerbatimItemRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';

  const shouldDelete = canConfirm ? globalThis.confirm('Delete this item?') : true;
  if (!shouldDelete) {
    return;
  }

  await props.repository.remove(record.id);
  if (editingId.value === record.id) {
    resetForm();
  }
}

function formatRelative(iso: string) {
  return new Date(iso).toLocaleString();
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
