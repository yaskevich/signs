<template>
  <n-card title="Map" :bordered="false" class="minimal" v-if="isLoaded">
    <n-space vertical>
      <n-space justify="space-between">
        <n-switch v-model:value="mode" @update:value="updateSwitch" :rail-style="railStyle" :round="false">
          <template #checked>
            Images
          </template>
          <template #unchecked>
            Objects
          </template>
        </n-switch>
        <n-select v-show="!mode" size="small" v-model:value="setsItem" filterable :options="sets" :clearable="true"
          placeholder="Select a set" label-field="title" value-field="id" @update:value="handleUpdateValue"
          @clear="handleUpdateValue" />
      </n-space>
      <Mapper :data="data" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import type { CSSProperties } from 'vue';
import store from '../store';
import Mapper from './Mapper.vue';

const isLoaded = ref(false);
const data = ref([]);
const sets = ref([]);
const setsItem = ref();
const mode = ref(false);


const railStyle = ({ focused, checked }: { focused: boolean, checked: boolean }) => {
  const style: CSSProperties = {}
  if (checked) {
    style.background = '#d03050'
    if (focused) {
      style.boxShadow = '0 0 0 2px #d0305040'
    }
  }
  else {
    style.background = '#2080f0'
    if (focused) {
      style.boxShadow = '0 0 0 2px #2080f040'
    }
  }
  return style
};

const handleUpdateValue = async () => {
  const res = (sets.value.find((x: ISet) => x.id === setsItem.value));
  let images, objects;
  if (res) {
    const option = res as ISet;
    images = Object.entries(option.query.images)
      .filter(x => x[1])
      .map(x => ({ id: typeof x[1] === 'number' ? x[1] : Number(x[0]), value: typeof x[1] === 'string' ? x[1] : true }));
    objects = Object.values(option.query.objects)
      .filter((x: IFeature) => x?.checked || x?.value)
      .map((x: IFeature) => ({ id: x.id, value: x?.value || x?.checked }));
  }
  data.value = await store.post('objects', { images, objects, map: 1 });
  // console.log(data.value);
};

const updateSwitch = async () => {
  // console.log(mode.value);
  if (mode.value) {
    data.value = await store.get('images');
  } else {
    handleUpdateValue();
  }
};

onBeforeMount(async () => {
  data.value = await store.post('objects', { map: 1 });
  // console.log(data.value);
  const sdata = await store.get('sets');
  sets.value = sdata;
  isLoaded.value = true;
});
</script>
