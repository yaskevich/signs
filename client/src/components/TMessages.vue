<template>
  <div v-if="isLoaded">
    <n-space vertical size="large">
      <n-space justify="center">
        <n-pagination
          :page-sizes="pageOptions"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker
        ></n-pagination>
      </n-space>

      <n-card
        v-for="(value, key) in messagesPage"
        :key="key"
        :style="value.annotated ? 'background-color:#dff6dd' : ''"
      >
        <template #header>
          <n-space>
            <n-tag>{{ value['tg_id'] }}</n-tag>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag>{{ users?.[value.data?.from_id?.user_id]?.['firstname'] || '•' }}</n-tag>
              </template>
              User
            </n-tooltip>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag>{{ value.data['_'] }}</n-tag>
              </template>
              Type
            </n-tooltip>

            <n-tooltip trigger="hover" v-if="value?.data?.views">
              <template #trigger>
                <n-tag type="info">{{ value.data['views'] }}</n-tag>
              </template>
              Views
            </n-tooltip>

            <!-- <n-tooltip trigger="hover" v-if="value.annotated">
              <template #trigger>
                <n-tag>   {{ '📃'.repeat(Number(value.annotated)) }}</n-tag>
              </template>
              Annotation added
            </n-tooltip> -->
          </n-space>
        </template>
        <template #header-extra>
          {{ value.data.date.slice(0, -6) }}
        </template>
        <n-grid :cols="12">
          <n-gi :span="8">
            <p v-if="value.data.grouped_id">
              <span style="font-weight: bold">Group</span>: {{ value.data['grouped_id'] }}
            </p>
            <p v-if="value.data.fwd_from">
              <span style="font-weight: bold">Fwd</span>: {{ value.data.fwd_from.from_id?.channel_id }}/{{
                value.data.fwd_from?.channel_post
              }}
              &nbsp;
              {{ value.data.fwd_from.date.slice(0, -6) }}
            </p>
            <p v-if="value.annotated">
              {{ '📃'.repeat(Number(value.annotated)) }}
            </p>
            <div v-if="value.data.message">
              <div style="border: 1px dashed gray; padding: 5px">
                <span v-html="value.data.message?.split('\n').join('<br/>')"></span>
              </div>
            </div>
          </n-gi>
          <n-gi :span="4">
            <div style="text-align: right">
              <router-link :to="'/message/' + value.tg_id">
                <img :src="'/api/media/thumbnails/' + value.imagepath" v-if="value.imagepath" class="image-navi" />
              </router-link>
            </div>
          </n-gi>
        </n-grid>
      </n-card>
      <n-space justify="center">
        <n-pagination
          :page-sizes="pageOptions"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker
        ></n-pagination>
      </n-space>
    </n-space>
  </div>
  <div v-else style="text-align: center">...loading</div>
</template>

<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import router from '../router';
import { useRoute } from 'vue-router';
import axios from 'axios';

const isLoaded = ref(false);
const messagesPage = ref<Array<IMessage>>([]);
const users = ref({} as IUsersDict);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);
const pageSize = ref(25);
const totalCount = ref(0);

const vuerouter = useRoute();
const pageIn = Number(vuerouter.params.page);
if (pageIn) {
  currentPage.value = pageIn;
}

const batchIn = Number(vuerouter.params.batch);
if (batchIn) {
  pageSize.value = batchIn;
}

const getPages = async () => {
  const offset = pageSize.value * (currentPage.value - 1);
  const { data } = await axios.get('/api/messages', { params: { off: offset, batch: pageSize.value } });
  messagesPage.value = data.data;
  // console.log(data.data);
  router.replace(`/messages/${pageSize.value}/${currentPage.value || ''}`);
  return data;
};

onBeforeMount(async () => {
  const datum = await getPages();
  totalCount.value = Number(datum.count);
  users.value = datum.users;
  isLoaded.value = true;
});

const onPageBatchChange = async (i: number) => {
  // console.log("request to change to batch", i);
  // console.log(pageSize.value, i, currentPage.value);
  pageSize.value = i;
  currentPage.value = 1;
  await getPages();
};

const onPageNumberChange = async (i: number) => {
  // console.log("request to change to page", i);
  // console.log(pageSize.value, currentPage.value);
  currentPage.value = i;
  await getPages();
};

// const goToMessage = (id) => {
//   router.push('/message/' + id);
// }
</script>

<style>
.image-navi {
  border: 5px double lightgray;
  transition: filter 0.2s ease-in-out;
  -webkit-filter: grayscale(0%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
  filter: grayscale(0%); /* FF 35+ */
  transform: scale(0.8);
}

.image-navi:hover {
  -webkit-filter: grayscale(100%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
  filter: grayscale(100%); /* FF 35+ */
  transform: scale(1);
}
</style>
