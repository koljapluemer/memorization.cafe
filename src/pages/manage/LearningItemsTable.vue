<template>
  <div class="overflow-x-auto">
    <table class="table w-full">
      <tbody>
        <tr
          v-for="item in items"
          :key="item.id"
        >
          <td>
            <SimpleFlashcardRow
              v-if="item.type === 'flashcard'"
              :flashcard="item.data as SimpleFlashcard"
            />
            <ElaborativeInterrogationRow
              v-else-if="item.type === 'concept'"
              :concept="item.data as ElaborativeInterrogationConcept"
            />
            <ListRow
              v-else-if="item.type === 'list'"
              :list="item.data as List"
            />
            <ClozeRow
              v-else-if="item.type === 'cloze'"
              :cloze="item.data as Cloze"
            />
          </td>
          <td class="text-right">
            <div class="flex gap-2 justify-end">
              <button
                class="btn btn-ghost btn-sm"
                @click="$emit('edit', item.type, item.data)"
              >
                <Edit :size="16" />
              </button>
              <button
                class="btn btn-ghost btn-sm"
                @click="$emit('move', item.type, item.data)"
              >
                <FolderInput :size="16" />
              </button>
              <button
                class="btn btn-ghost btn-sm"
                @click="item.data.id && $emit('delete', item.type, item.data.id)"
              >
                <Trash2 :size="16" />
              </button>
              <button
                class="btn btn-ghost btn-sm"
                @click="$emit('preview', item.type, item.data)"
              >
                <Eye :size="16" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Edit, Trash2, Eye, FolderInput } from 'lucide-vue-next';

import type { SimpleFlashcard, ElaborativeInterrogationConcept, List, Cloze } from '@/app/database';
import { ElaborativeInterrogationRow } from '@/entities/elaborative-interrogation';
import { SimpleFlashcardRow } from '@/entities/simple-flashcard';
import { ListRow } from '@/entities/list';
import { ClozeRow } from '@/entities/cloze';

export interface LearningItem {
  type: 'flashcard' | 'concept' | 'list' | 'cloze';
  data: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze;
  id?: string;
}

defineProps<{
  items: LearningItem[];
}>();

defineEmits<{
  edit: [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
  delete: [type: 'flashcard' | 'concept' | 'list' | 'cloze', id: string];
  preview: [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
  move: [type: 'flashcard' | 'concept' | 'list' | 'cloze', item: SimpleFlashcard | ElaborativeInterrogationConcept | List | Cloze];
}>();
</script>
