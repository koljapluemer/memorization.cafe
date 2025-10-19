<template>
  <div
    role="tablist"
    class="tabs tabs-boxed mb-6"
  >
    <a
      v-for="tab in openTabs"
      :key="tab.id"
      role="tab"
      class="tab gap-2"
      :class="{ 'tab-active': activeTabId === tab.id }"
      @click="$emit('switch-tab', tab.id!)"
    >
      {{ tab.name }}
      <button
        class="btn btn-ghost btn-xs btn-circle"
        @click.stop="$emit('close-tab', tab.id!)"
      >
        <X :size="14" />
      </button>
    </a>

    <button
      v-if="hasUnopenedCollections"
      class="tab gap-1"
      @click="$emit('open-collection')"
    >
      <FolderOpen :size="16" /> Open
    </button>

    <button
      class="tab gap-1"
      @click="$emit('new-collection')"
    >
      <Plus :size="16" /> New
    </button>
  </div>
</template>

<script setup lang="ts">
import { Plus, FolderOpen, X } from 'lucide-vue-next';

import type { Collection } from '@/entities/collection';

defineProps<{
  openTabs: Collection[];
  activeTabId: string | null;
  hasUnopenedCollections: boolean;
}>();

defineEmits<{
  'switch-tab': [collectionId: string];
  'close-tab': [collectionId: string];
  'open-collection': [];
  'new-collection': [];
}>();
</script>
