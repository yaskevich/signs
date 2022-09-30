<template>
  <div class="home">
    <div v-if="isLoaded" style="text-align: center; max-width: 350px; margin: auto">
      <n-card :bordered="false">
        <n-space vertical>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-h1 style="color: orangered">
                {{ Number((datum.photos / ((datum?.messages?.images - datum?.messages?.dups) / 100)).toFixed(2)) }} %
              </n-h1>
            </template>
            Annotated photos to all unique photos ratio
          </n-tooltip>

          <div v-for="item in datum?.tree">
            <n-h3> {{ item.title || item.code }} • {{ (datum as keyable)?.[item.code] }}</n-h3>
            <div v-for="item2 in item.children.filter((x:any) => x.type !== 'text')">
              <n-h5 style="font-variant: small-caps">{{ item2.title || item2.code }}</n-h5>
              <template v-for="item3 in item2?.children?.sort((a:any, b:any) => b.num - a.num)">
                <template v-if="item3.type">
                  <n-space vertical>
                    <FeatureItem :item="item3"></FeatureItem>
                    <n-space
                      justify="space-between"
                      v-for="item4 in item3.children.sort((a:any, b:any) => b.num - a.num)">
                      <template v-if="item4?.num">
                        <FeatureItem :item="item4"></FeatureItem>
                        <span>{{ item4?.num || 0 }}</span>
                      </template>
                    </n-space>
                  </n-space>
                </template>
                <template v-else>
                  <n-space justify="space-between">
                    <template v-if="item3?.num">
                      <FeatureItem :item="item3"></FeatureItem>
                      <span>{{ item3?.num || 0 }}</span>
                    </template>
                  </n-space>
                </template>
              </template>
            </div>
            <!-- <n-divider></n-divider> -->
          </div>
          <n-h3>Input</n-h3>
          <n-space vertical>
            <n-space justify="space-between">
              <span>Total number of items</span> <span> {{ datum?.messages?.all }} </span>
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
          <!-- <n-divider></n-divider> -->
          <n-card>
            <n-h5>Platform {{ info?.unix ? ' • ' + new Date(info.unix * 1000).toLocaleDateString() : '' }}</n-h5>
            <n-space vertical>
              <n-space justify="space-between">
                <span>Client</span> <span> {{ project.version }} </span>
              </n-space>
              <n-space justify="space-between">
                <span>Server</span>
                <span>{{ info.server }}</span>
              </n-space>
              <n-space justify="space-between">
                <span>Commit</span>
                <n-button
                  text
                  tag="a"
                  :href="'https' + project?.repository?.url?.slice(3, -4) + '/commit/' + info.commit"
                  target="_blank"
                  type="primary"
                  >{{ info.commit }}</n-button
                >
              </n-space>
            </n-space>
          </n-card>
        </n-space>
      </n-card>
    </div>
    <div v-else style="text-align: center">...loading</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import axios from 'axios';
import project from '../../package.json';
import FeatureItem from './FeatureItem.vue';

const isLoaded = ref(false);
const datum = reactive({} as IStats);
const info = ref();

onBeforeMount(async () => {
  const { data } = await axios.get('/api/stats');
  Object.assign(datum, data);

  const infodata = await axios.get('/api/user/info');
  info.value = infodata.data;
  // console.log('stats', data);
  isLoaded.value = true;
});
</script>
