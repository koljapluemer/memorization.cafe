<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold">
              {{ isEditing ? 'Edit flashcard' : 'New flashcard' }}
            </h1>
            <p class="text-sm text-base-content/70">
              Fill in both sides of the card. Markdown is supported.
            </p>
          </div>
          <RouterLink
            to="/flashcards/list"
            class="btn"
          >
            Back to list
          </RouterLink>
        </div>
        <EditFlashcardForm
          :form="form"
          :disabled="isBlockingSubmit"
          :submit-label="isEditing ? 'Save changes' : 'Create flashcard'"
          @update:form="updateForm"
          @submit="handleSubmit"
          @reset-requested="resetForm"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

import EditFlashcardForm from './components/EditFlashcardForm.vue';
import { useFlashcardRepository, useLearningItemRepository } from '../../app/providers';

interface FlashcardFormState {
  front: string;
  back: string;
  learningItemId: string;
}

const repository = useFlashcardRepository();
const learningItemRepository = useLearningItemRepository();
const route = useRoute();
const router = useRouter();

const form = reactive<FlashcardFormState>({
  front: '',
  back: '',
  learningItemId: '',
});

const currentId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);

const isEditing = computed(() => Boolean(currentId.value));
const isBlockingSubmit = computed(
  () =>
    isSaving.value ||
    !form.front.trim() ||
    !form.back.trim() ||
    !form.learningItemId,
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

watch(
  () => route.query.learningItemId,
  (value) => {
    const itemIdParam = Array.isArray(value) ? value[0] : value;
    if (itemIdParam && !currentId.value) {
      form.learningItemId = itemIdParam;
    }
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
      await router.replace('/flashcards/list');
      return;
    }
    form.front = record.front;
    form.back = record.back;
    form.learningItemId = record.learningItemId;
  } catch (error) {
    reportError('Failed to load flashcard', error);
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
    let actualLearningItemId = form.learningItemId;

    if (!actualLearningItemId && !currentId.value) {
      actualLearningItemId = await learningItemRepository.create({
        name: form.front.substring(0, 50) + (form.front.length > 50 ? '...' : ''),
        description: '',
        collectionId: null,
      });
    }

    if (currentId.value) {
      await repository.update(currentId.value, {
        front: form.front,
        back: form.back,
        learningItemId: actualLearningItemId,
      });
    } else {
      await repository.create({
        front: form.front,
        back: form.back,
        learningItemId: actualLearningItemId,
      });
    }
    await router.push('/flashcards/list');
  } catch (error) {
    reportError('Failed to save flashcard', error);
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
  const learningItemIdFromQuery = Array.isArray(route.query.learningItemId)
    ? route.query.learningItemId[0]
    : route.query.learningItemId;
  form.front = '';
  form.back = '';
  form.learningItemId = learningItemIdFromQuery || '';
}

function updateForm(value: FlashcardFormState) {
  form.front = value.front;
  form.back = value.back;
  form.learningItemId = value.learningItemId;
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
