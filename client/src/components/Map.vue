<template>
  <n-card title="Map" :bordered="false" class="minimal" v-if="isLoaded">
    <n-select size="small" v-model:value="setsItem" filterable :options="sets" placeholder="Select a set"
      label-field="title" value-field="id" @update:value="handleUpdateValue" />
    <Mapper :data="data" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import Mapper from './Mapper.vue';

const isLoaded = ref(false);
const data = ref([]);
const sets = ref([]);
const setsItem = ref();

const handleUpdateValue = async (value: string, option: ISet) => {
  const images = Object.entries(option.query.images)
    .filter(x => x[1])
    .map(x => ({ id: typeof x[1] === 'number' ? x[1] : Number(x[0]), value: typeof x[1] === 'string' ? x[1] : true }));
  const objects = Object.values(option.query.objects)
    .filter((x: IFeature) => x?.checked || x?.value)
    .map((x: IFeature) => ({ id: x.id, value: x?.value || x?.checked }));
  data.value = await store.post('objects', { images, objects, map: 1 });
};

onBeforeMount(async () => {
  data.value = await store.post('objects', { map: 1 });
  console.log(data.value);
  const sdata = await store.get('sets');
  sets.value = sdata;
  isLoaded.value = true;
});
</script>
