<template>
  <div class="home">
    <div v-if="isLoaded" style="margin: auto; text-align: center">
      <n-descriptions label-placement="top" title="Stats" :column="4" label-align="center">
        <n-descriptions-item>
          <template #label>Total Messages</template>
          {{ datum?.messages }}
        </n-descriptions-item>
        <n-descriptions-item label="with Photos"
          ><span :title="'total, including ' + datum?.photos?.dups + ' duplicates'">{{ datum?.photos?.total }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="Unique Photos"
          ><span style="font-weight: bold">{{ datum?.photos?.total - datum?.photos?.dups }}</span></n-descriptions-item
        >
        <n-descriptions-item label="Annotated Photos">
          <span style="color: rgb(255, 0, 162); font-weight: bold">{{ datum?.annotated }}</span>
        </n-descriptions-item>
      </n-descriptions>

      <h5>Orientation</h5>
      <n-grid v-for="(value, key) in [1, 2]" :key="key" x-gap="12" :cols="2">
        <n-gi>{{ datum?.scheme?.orientation[key]?.name }}</n-gi>
        <n-gi
          ><span title="photos">{{ datum?.orientation?.[key]?.[0] }}</span> /
          <span title="annotations">{{ datum?.orientation?.[key]?.[1] }}</span></n-gi
        >
      </n-grid>

      <div v-for="(value, key) in tree" style="text-align: center; max-width: 350px; margin: auto">
        <div>
          <n-h3>
            <n-text type="info">
              {{ value.code }}
              <span v-if="value.code === 'annotations'">({{ datum?.annotations }})</span>
            </n-text></n-h3
          >
          <div v-for="(value2, key2) in value.children">
            <n-h5 style="font-variant: small-caps">{{ value2.code }}</n-h5>
            <template v-for="(value3, key3) in value2.children">
              <n-space justify="space-between" v-if="stats?.[value3?.id]">
                <span>{{ value3.code.toUpperCase() }}</span> <span>{{ stats?.[value3?.id] || 0 }}</span>
              </n-space>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-else style="text-align: center">...loading</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import axios from 'axios';

const isLoaded = ref(false);
const datum = reactive({} as IStats);
const tree = reactive({} as Array<IFeature>);
const stats = reactive({} as keyable);

const nest = (items: any, id = 0) =>
  items
    .filter((x: any) => x.parent === id)
    .map((x: any) => {
      const children = nest(items, x.id);
      return { ...x, ...(children?.length && { children }) };
    });

onBeforeMount(async () => {
  const { data } = await axios.get('/api/stats');
  Object.assign(datum, data);
  console.log('stats', data);
  Object.assign(tree, nest(data.ftree));
  Object.assign(stats, data.fstat);

  isLoaded.value = true;
});
</script>
