<template>
  <n-tooltip trigger="hover" v-if="item.comment">
    <template #trigger>
      <n-text>{{ item.title || item.code.toUpperCase() }}</n-text>
    </template>
    {{ item.comment }}
  </n-tooltip>
  <n-text v-else>{{ item.title || item.code.toUpperCase() }}</n-text>
</template>
<script setup lang="ts">
defineProps<{
  item: { code: string; title: string; comment: string };
}>();
</script>
