<template>
  <div class="home">
    <div v-if="isLoaded" style="text-align: center; max-width: 350px; margin: auto">
      <div v-for="item in datum?.tree">
        <n-h3> {{ item.title || item.code }} ({{ (datum as keyable)?.[item.code] }})</n-h3>
        <div v-for="item2 in item.children.filter((x:any) => x.type !== 'text')">
          <n-h5 style="font-variant: small-caps">{{ item2.code }}</n-h5>
          <template v-for="item3 in item2?.children?.sort((a:any, b:any) => b.num - a.num)">
            <template v-if="item3.type">
              <n-space vertical>
                <n-text>{{ item2.title || item2.code }} / {{ item3.title || item3.code }}</n-text>
                <n-space justify="space-between" v-for="item4 in item3.children.sort((a:any, b:any) => b.num - a.num)">
                  <template v-if="item4?.num">
                    <span>{{ item4.title || item4.code.toUpperCase() }}</span> <span>{{ item4?.num || 0 }}</span>
                  </template>
                </n-space>
              </n-space>
            </template>
            <template v-else>
              <n-space justify="space-between">
                <template v-if="item3?.num">
                  <span>{{ item3.title || item3.code.toUpperCase() }}</span> <span>{{ item3?.num || 0 }}</span>
                </template>
              </n-space>
            </template>
          </template>
        </div>
        <n-divider></n-divider>
      </div>
      <n-h3>Messages</n-h3>
      <n-space vertical>
        <n-space justify="space-between">
          <span>Total</span> <span> {{ datum?.messages?.all }} </span>
        </n-space>
        <n-space justify="space-between">
          <span>...with photos</span>
          <span :title="'total, including ' + datum?.messages?.dups + ' duplicates'">{{
            datum?.messages?.images
          }}</span>
        </n-space>
        <n-space justify="space-between">
          <span>...with unique photos</span> <span> {{ datum?.messages?.images - datum?.messages?.dups }} </span>
        </n-space>
      </n-space>
    </div>
    <div v-else style="text-align: center">...loading</div>
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
  // console.log('stats', data);
  isLoaded.value = true;
});
</script>
