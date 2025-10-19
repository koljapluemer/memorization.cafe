<template>
  <div class="space-y-4">
    <MarkdownText :text="list.name" />
    <div
      v-if="list.isOrderedList"
      class="prose max-w-none"
    >
      <ol>
        <li
          v-for="(item, index) in list.items"
          :key="index"
        >
          <MarkdownText :text="item" />
        </li>
      </ol>
    </div>
    <div
      v-else
      class="prose max-w-none"
    >
      <ul>
        <li
          v-for="(item, index) in list.items"
          :key="index"
        >
          <MarkdownText :text="item" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { List } from '@/app/database';
import MarkdownText from '@/dumb/MarkdownText.vue';

defineProps<{
  list: List;
}>();
</script>
