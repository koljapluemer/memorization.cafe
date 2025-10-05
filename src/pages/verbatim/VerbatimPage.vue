<template>
  <div class="space-y-8">
    <VerbatimStudy
      :repository="repository"
    />
    <VerbatimCrud
      :repository="repository"
    />
  </div>
</template>

<script setup lang="ts">
import { useVerbatimRepository } from '../../app/providers';
import VerbatimCrud from '../../features/verbatim-crud/VerbatimCrud.vue';
import VerbatimStudy from '../../features/verbatim-study/VerbatimStudy.vue';

const repository = useVerbatimRepository();
</script>
