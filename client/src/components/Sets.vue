<template>
    <n-card title="Export" :bordered="false" class="minimal" v-if="isLoaded">
      <n-text>Exported projects</n-text>
    </n-card>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onBeforeMount } from 'vue';
  import store from '../store';
  
  const isLoaded = ref(false);
  const data = ref([]);
  
  onBeforeMount(async () => {
    // data.value = await store.get('map');
    isLoaded.value = true;
  });
  </script>
  