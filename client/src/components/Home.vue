<template>
  <div class="home">
    <div v-if="isLoaded" style="margin:auto;text-align:center;">
      
      <n-descriptions label-placement="top" title="Stats" label-align="center">
        <n-descriptions-item>
          <template #label>Total Messages</template>
          {{ datum?.messages }}
        </n-descriptions-item>
        <n-descriptions-item label="...with Photo">{{ datum?.photos }}</n-descriptions-item>
        <n-descriptions-item label="...with Annotation">
          <span style="color:rgb(255, 0, 162);font-weight:bold;">{{ datum?.annotations }}</span>
        </n-descriptions-item>
      </n-descriptions>

      <h5>Orientation</h5>
      <n-grid v-for="(value, key) in [1, 2]" :key="key" x-gap="12" :cols="2">
        <n-gi>{{ datum?.scheme?.orientation[key]?.name }}</n-gi>
        <n-gi><span title="photos">{{datum?.orientation?.[key]?.[0]}}</span> / <span title="annotations">{{datum?.orientation?.[key]?.[1]}}</span></n-gi>
      </n-grid> 

      <h5>Languages</h5>
      <n-grid v-for="(value, key) in datum?.scheme?.languages" :key="key" x-gap="12" :cols="2">
        <n-gi>{{ value.replace('TAG-', '') }}</n-gi>
        <n-gi style="color:orange;">{{ datum?.languages[key] }}</n-gi>
      </n-grid>

      <h5>Features</h5>
      <n-grid v-for="(value, key) in datum?.scheme?.features" :key="key" x-gap="12" :cols="2">
        <n-gi>{{ value.replace('TAG-', '') }}</n-gi>
        <n-gi style="color:gray;">{{ datum?.features[key] }}</n-gi>
      </n-grid>
    </div>
    <div v-else style="text-align:center">
      ...loading
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import axios from 'axios';

const isLoaded = ref(false);
const datum = reactive({} as IStats);

onBeforeMount(async () => {
  const { data } = await axios.get('/api/stats');
  Object.assign(datum, data);
  console.log('stats', data);
  isLoaded.value = true;
});

</script>
