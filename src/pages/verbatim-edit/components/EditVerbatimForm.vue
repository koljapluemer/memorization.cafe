<template>
  <form
    class="space-y-4"
    @submit.prevent="onSubmit"
  >
    <label class="form-control w-full">
      <span class="label-text font-medium">Pre exercise (optional)</span>
      <textarea
        v-model="localForm.preExercise"
        class="textarea textarea-bordered h-32"
        placeholder="Context or setup"
      />
    </label>
    <label class="form-control w-full">
      <span class="label-text font-medium">To memorise *</span>
      <textarea
        v-model="localForm.toMemorize"
        class="textarea textarea-bordered h-40"
        placeholder="Passage to recall"
        required
      />
    </label>
    <label class="form-control w-full">
      <span class="label-text font-medium">Post exercise (optional)</span>
      <textarea
        v-model="localForm.postExercise"
        class="textarea textarea-bordered h-32"
        placeholder="Follow-up or notes"
      />
    </label>
    <div class="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        class="btn"
        @click="emit('reset-requested')"
      >
        Reset
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="disabled"
      >
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

interface VerbatimFormState {
  preExercise: string;
  toMemorize: string;
  postExercise: string;
}

interface Props {
  form: VerbatimFormState;
  disabled?: boolean;
  submitLabel: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:form': [VerbatimFormState];
  'submit': [];
  'reset-requested': [];
}>();

const localForm = reactive<VerbatimFormState>({ ...props.form });

watch(
  () => ({ ...props.form }),
  (value) => {
    localForm.preExercise = value.preExercise;
    localForm.toMemorize = value.toMemorize;
    localForm.postExercise = value.postExercise;
  },
);

watch(
  () => ({ ...localForm }),
  (value) => {
    emit('update:form', { ...value });
  },
  { deep: true },
);

const disabled = computed(() => props.disabled ?? false);
const submitLabel = computed(() => props.submitLabel);

function onSubmit() {
  if (disabled.value) {
    return;
  }
  emit('submit');
}
</script>
