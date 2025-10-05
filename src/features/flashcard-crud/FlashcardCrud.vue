<template>
  <section
    class="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
  >
    <div class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h2 class="card-title text-lg font-semibold">
          {{ editingId ? 'Edit Flashcard' : 'Create Flashcard' }}
        </h2>
        <form
          class="space-y-4"
          @submit.prevent="onSubmit"
        >
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Front
            </span>
            <textarea
              v-model="form.front"
              class="textarea textarea-bordered h-32"
              placeholder="Prompt or question"
              required
            />
          </label>
          <label class="form-control w-full">
            <span class="label-text font-medium">
              Back
            </span>
            <textarea
              v-model="form.back"
              class="textarea textarea-bordered h-32"
              placeholder="Answer or explanation"
              required
            />
          </label>
          <div class="flex items-center justify-between gap-2">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!canSubmit"
            >
              {{ editingId ? 'Save changes' : 'Add flashcard' }}
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
          Stored Flashcards
        </h2>
        <span class="badge badge-neutral">
          {{ flashcards.length }}
        </span>
      </div>
      <div
        v-if="isLoading"
        class="flex justify-center py-10"
      >
        <span
          class="loading loading-spinner loading-lg"
          aria-label="Loading flashcards"
        />
      </div>
      <div
        v-else-if="flashcards.length === 0"
        class="card bg-base-100 shadow"
      >
        <div class="card-body text-sm text-base-content/70">
          <p>
            Nothing here yet. Create your first flashcard on the left.
          </p>
        </div>
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <article
          v-for="cardItem in flashcards"
          :key="cardItem.id"
          class="card bg-base-100 shadow"
        >
          <div class="card-body space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="text-base font-semibold">
                {{ cardItem.front.slice(0, 80) || 'Untitled' }}
              </h3>
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span>
                  Reps: {{ cardItem.fsrsCard.reps }}
                </span>
                <span v-if="cardItem.nextReview">
                  Next: {{ formatRelative(cardItem.nextReview) }}
                </span>
              </div>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-base-content/70">
                  Front
                </p>
                <MarkdownPreview :source="cardItem.front" />
              </div>
              <div>
                <p class="text-sm font-medium text-base-content/70">
                  Back
                </p>
                <MarkdownPreview :source="cardItem.back" />
              </div>
            </div>
            <div class="flex justify-between">
              <button
                type="button"
                class="btn btn-sm"
                @click="startEdit(cardItem)"
              >
                Edit
              </button>
              <button
                type="button"
                class="btn btn-sm btn-error"
                @click="confirmDelete(cardItem)"
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
  FlashcardDraft,
  FlashcardRecord,
  FlashcardRepository,
} from '../../entities/flashcard';

interface Props {
  repository: FlashcardRepository;
}

const props = defineProps<Props>();

const flashcards = ref<FlashcardRecord[]>([]);
const isLoading = ref(true);
const editingId = ref<string | null>(null);
const form = reactive<FlashcardDraft>({
  front: '',
  back: '',
});

let subscription: { unsubscribe: () => void } | null = null;

onMounted(() => {
  subscription = props.repository.watchAll().subscribe({
    next(value) {
      flashcards.value = value;
      isLoading.value = false;
    },
    error(error) {
      reportError('Failed to load flashcards', error);
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
    canSubmit.value = Boolean(form.front.trim() && form.back.trim());
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
  form.front = '';
  form.back = '';
}

function startEdit(record: FlashcardRecord) {
  editingId.value = record.id;
  form.front = record.front;
  form.back = record.back;
}

async function confirmDelete(record: FlashcardRecord) {
  const canConfirm =
    typeof globalThis !== 'undefined' &&
    'confirm' in globalThis &&
    typeof globalThis.confirm === 'function';

  const shouldDelete = canConfirm ? globalThis.confirm('Delete this flashcard?') : true;
  if (!shouldDelete) {
    return;
  }

  await props.repository.remove(record.id);
  if (editingId.value === record.id) {
    resetForm();
  }
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString();
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
