<template>
  <n-card>
    <template #header>
      <n-spin :show="!isLoaded"> All annotations ({{ totalCount }}) </n-spin>
    </template>
    <n-space vertical size="large" v-if="isLoaded">
      <n-pagination
        v-model:page="page"
        v-model:page-size="pageSize"
        show-size-picker
        :item-count="totalCount"
        :page-sizes="paginationOptions"
        @update:page="changePage"
        @update:page-size="changePageSize"
      />
      <div style="min-height: 400px">
        <n-space vertical size="large">
          <!-- <div v-for="(item, index) in items" :key="index" class="photo"> -->
          <n-card v-for="(item, index) in items" :key="index" class="anno" :title="item?.content">
            <template #header-extra>
              <router-link :to="`/message/${item?.tg_id}`" class="tag-link"
                >Go to {{ item?.tg_id }}</router-link
              ></template
            >
            <n-space justify="space-between">
              <n-space vertical>
                <n-space>
                  <template v-for="tag in item.features">
                    <n-button-group size="small" v-if="tag?.note">
                      <n-button type="info" size="small">{{ features[tag.id]?.code?.toUpperCase() }}</n-button>
                      <n-tooltip trigger="hover">
                        <template #trigger>
                          <n-button size="small" color="#2080f0">
                            <template #icon>
                              <n-icon :component="InfoCircle" />
                            </template>
                          </n-button>
                        </template>
                        {{ tag.note }}
                      </n-tooltip>
                    </n-button-group>
                    <template v-else>
                      <n-button
                        v-if="features[features[tag.id]?.parent]?.code === 'languages'"
                        color="#5a428d"
                        size="small"
                        >{{ features[tag.id]?.code?.toUpperCase() }}</n-button
                      >
                      <n-button v-else type="info" size="small">{{ features[tag.id]?.code?.toUpperCase() }}</n-button>
                    </template>
                  </template>
                </n-space>
                <n-space justify="start">
                  <template v-for="tag in item.properties">
                    <template v-if="!features[tag?.id]?.type">
                      <n-button :type="tag.id === 52 ? 'secondary' : 'primary'" v-if="features[tag.id]?.parent === 51">
                        <template #icon>
                          <n-icon :component="Square" color="red" />
                        </template>
                      </n-button>
                      <n-button v-else tertiary>{{ features[tag.id]?.title }}</n-button>
                    </template>
                  </template>
                </n-space>
              </n-space>
              <img style="max-width: 300px" :src="'/api/media/fragments/' + item.id + '.png'" />
            </n-space>
          </n-card>
        </n-space>
      </div>
      <n-pagination
        v-model:page="page"
        v-model:page-size="pageSize"
        show-size-picker
        :item-count="totalCount"
        :page-sizes="paginationOptions"
        @update:page="changePage"
        @update:page-size="changePageSize"
      />
    </n-space>
  </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import axios from 'axios';
import { ArrowDown, ArrowUp, InfoCircle, Square } from '@vicons/fa';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import router from '../router';

const page = ref(1);
const pageSize = ref(50);
const totalCount = ref(0);
const isLoaded = ref(false);
const items = reactive<Array<IAnnotation>>([]);
const features = reactive({} as keyable);
const countries = reactive({} as keyable);
const paginationOptions = [10, 50, 100, 250, 500, 1000];

const vuerouter = useRoute();
const pageIn = Number(vuerouter.params.page);
if (pageIn) {
  page.value = pageIn;
}

const batchIn = Number(vuerouter.params.batch);
if (batchIn) {
  pageSize.value = batchIn;
}

const updatePage = async () => {
  isLoaded.value = false;
  console.log('call update page');

  let { data } = await axios.get('/api/annotations', {
    params: { offset: (page.value - 1) * pageSize.value, limit: pageSize.value },
  });
  Object.assign(items, data.selection);

  totalCount.value = Number(data.count);

  ({ data } = await axios.get('/api/features'));
  const featuresData = Object.fromEntries(data.map((x: any) => [x.id, x]));
  Object.assign(features, featuresData);

  isLoaded.value = true;
};

const updateURL = () => {
  router.push(`/flow/${pageSize.value}/${page.value || ''}`);
};

const changePage = async (i: number) => {
  console.log('change page', page.value, i);
  router.push(`/flow/${pageSize.value}/${page.value || ''}`);
  updateURL();
};

const changePageSize = async (i: number) => {
  console.log('change size', pageSize.value, i);
  pageSize.value = i;
  page.value = 1;
  updateURL();
};

onBeforeMount(async () => {
  console.log('mount');
  updateURL();
  await updatePage();
});

onBeforeRouteUpdate(async (to, from) => {
  // console.log('route', to.params, from.params);
  console.log('route update');
  page.value = Number(to.params.page);
  pageSize.value = Number(to.params.batch);
  // await updatePage();
});
</script>

<style lang="scss" scoped>
.photo {
  border: 1px solid gray;
}
.anno {
  border: 1px dashed silver;
  padding: 5px;
  margin: 5px;
}
.error {
  background-color: pink;
}
.tag-link {
  text-decoration: none;
  border: 1px solid gray;
  border-radius: 3px;
  padding: 3px;
}
</style>
