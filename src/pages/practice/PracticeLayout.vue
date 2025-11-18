<template>
  <div class="space-y-4">
    <!-- Action Bar -->
    <div class="flex gap-2 justify-end">
      <button
        class="btn btn-circle btn-ghost btn-sm"
        aria-label="Skip"
        title="Skip"
        @click="emit('skip')"
      >
        <SkipForward :size="20" />
      </button>
      <button
        class="btn btn-circle btn-ghost btn-sm"
        aria-label="Edit"
        title="Edit"
        @click="emit('edit')"
      >
        <Pencil :size="20" />
      </button>
      <button
        class="btn btn-circle btn-ghost btn-sm"
        aria-label="Delete"
        title="Delete"
        @click="emit('delete')"
      >
        <Trash2 :size="20" />
      </button>
      <button
        v-if="showDisable"
        class="btn btn-circle btn-ghost btn-sm"
        :class="{ 'text-warning': isDisabled }"
        aria-label="Disable"
        :title="isDisabled ? 'Enable' : 'Disable'"
        @click="emit('disable')"
      >
        <EyeOff :size="20" />
      </button>
      <button
        class="btn btn-circle btn-ghost btn-sm"
        aria-label="Filter"
        title="Filter"
        @click="emit('filter')"
      >
        <Filter :size="20" />
      </button>
    </div>

    <!-- Exercise Content Card -->
    <div class="card bg-base-200 shadow-md">
      <div class="card-body">
        <slot name="exercise" />
      </div>
    </div>

    <!-- Interaction Controls Card -->
    <div class="card bg-base-100 shadow-md">
      <div class="card-body">
        <slot name="controls" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SkipForward, Pencil, Trash2, EyeOff, Filter } from 'lucide-vue-next';

defineProps<{
  showDisable?: boolean;
  isDisabled?: boolean;
}>();

const emit = defineEmits<{
  skip: [];
  edit: [];
  delete: [];
  disable: [];
  filter: [];
}>();
</script>
