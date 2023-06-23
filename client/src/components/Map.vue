<template>
  <n-card title="Map" :bordered="false" class="minimal" v-if="isLoaded">
    <Mapper :data="data" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import Mapper from './Mapper.vue';

const isLoaded = ref(false);
const data = ref([]);

onBeforeMount(async () => {
  data.value = await store.get('map');
  isLoaded.value = true;
});
</script>
