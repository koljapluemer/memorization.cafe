<template>
  <form
    class="space-y-4"
    @submit.prevent="onSubmit"
  >
    <label class="form-control">
      <div class="label">
        <span class="label-text font-medium">Front</span>
      </div>
      <textarea
        v-model="localForm.front"
        class="textarea textarea-bordered h-40"
        placeholder="Prompt or question"
        required
      />
    </label>
    <label class="form-control">
      <div class="label">
        <span class="label-text font-medium">Back</span>
      </div>
      <textarea
        v-model="localForm.back"
        class="textarea textarea-bordered h-40"
        placeholder="Answer or explanation"
        required
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

interface FlashcardFormState {
  front: string;
  back: string;
  learningItemId: string;
}

interface Props {
  form: FlashcardFormState;
  disabled?: boolean;
  submitLabel: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:form': [FlashcardFormState];
  'submit': [];
  'reset-requested': [];
}>();

const localForm = reactive<FlashcardFormState>({ ...props.form });

watch(
  () => ({ ...props.form }),
  (value) => {
    localForm.front = value.front;
    localForm.back = value.back;
    localForm.learningItemId = value.learningItemId;
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
