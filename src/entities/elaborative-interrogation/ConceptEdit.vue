<template>
  <div class="space-y-4">
    <div class="form-control w-full">
      <label
        for="name"
        class="label"
      >
        <span class="label-text">Name</span>
      </label>
      <input
        id="name"
        v-model="localName"
        type="text"
        placeholder="Concept name"
        class="input input-bordered w-full"
      >
    </div>

    <div class="form-control w-full">
      <label
        for="description"
        class="label"
      >
        <span class="label-text">Description (optional)</span>
      </label>
      <textarea
        id="description"
        v-model="localDescription"
        placeholder="Concept description (markdown supported)"
        class="textarea textarea-bordered w-full h-32"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import type { ElaborativeInterrogationConcept } from '@/app/database';

const props = defineProps<{
  concept?: ElaborativeInterrogationConcept;
}>();

const emit = defineEmits<{
  update: [data: { name: string; description?: string }];
}>();

const localName = ref(props.concept?.name || '');
const localDescription = ref(props.concept?.description || '');

watch([localName, localDescription], () => {
  emit('update', {
    name: localName.value,
    description: localDescription.value || undefined,
  });
});
</script>
