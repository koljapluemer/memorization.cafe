<template>
  <span>
    <strong>{{ list.name }}</strong>
    {{ ' - ' + formattedItems }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { List } from '@/app/database';

const props = defineProps<{
  list: List;
}>();

function truncate(text: string, maxLength: number = 40): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

const formattedItems = computed(() => {
  if (props.list.items.length === 0) return '(empty)';

  let formatted: string;
  if (props.list.isOrderedList) {
    formatted = props.list.items
      .map((item, index) => `${index + 1}) ${item}`)
      .join(' ');
  } else {
    formatted = props.list.items.join('; ');
  }

  return truncate(formatted);
});
</script>
