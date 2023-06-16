<template>
  <n-card title="Map" :bordered="false" class="minimal" v-if="isLoaded">
    {{ datum }}
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
const isLoaded = ref(false);
const datum = ref([]);

onBeforeMount(async () => {
  datum.value = await store.get('map');
  isLoaded.value = true;
});
</script>
