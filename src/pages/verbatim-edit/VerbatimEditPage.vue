<template>
  <div class="mx-auto w-full max-w-3xl space-y-6">
    <section class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold">
              {{ isEditing ? 'Edit passage' : 'New passage' }}
            </h1>
            <p class="text-sm text-base-content/70">
              Provide the text you want to remember. Markdown is supported everywhere.
            </p>
          </div>
          <RouterLink
            to="/verbatim/list"
            class="btn"
          >
            Back to list
          </RouterLink>
        </div>
        <EditVerbatimForm
          :form="form"
          :disabled="isBlockingSubmit"
          :submit-label="isEditing ? 'Save changes' : 'Create passage'"
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

import EditVerbatimForm from './components/EditVerbatimForm.vue';
import { useVerbatimRepository } from '../../app/providers';

interface VerbatimFormState {
  preExercise: string;
  toMemorize: string;
  postExercise: string;
}

const repository = useVerbatimRepository();
const route = useRoute();
const router = useRouter();

const form = reactive<VerbatimFormState>({
  preExercise: '',
  toMemorize: '',
  postExercise: '',
});

const currentId = ref<string | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);

const isEditing = computed(() => Boolean(currentId.value));
const isBlockingSubmit = computed(
  () => isSaving.value || !form.toMemorize.trim(),
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
      await router.replace('/verbatim/list');
      return;
    }
    form.preExercise = record.preExercise;
    form.toMemorize = record.toMemorize;
    form.postExercise = record.postExercise;
  } catch (error) {
    reportError('Failed to load passage', error);
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
        preExercise: form.preExercise,
        toMemorize: form.toMemorize,
        postExercise: form.postExercise,
      });
    } else {
      await repository.create({
        preExercise: form.preExercise,
        toMemorize: form.toMemorize,
        postExercise: form.postExercise,
      });
    }
    await router.push('/verbatim/list');
  } catch (error) {
    reportError('Failed to save passage', error);
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
  form.preExercise = '';
  form.toMemorize = '';
  form.postExercise = '';
}

function updateForm(value: VerbatimFormState) {
  form.preExercise = value.preExercise;
  form.toMemorize = value.toMemorize;
  form.postExercise = value.postExercise;
}

function reportError(message: string, error: unknown) {
  if (typeof globalThis !== 'undefined' && globalThis.console) {
    globalThis.console.error(message, error);
  }
}
</script>
