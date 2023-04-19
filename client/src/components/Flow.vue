<template>
  <n-card>
    <template #header>
      <n-spin :show="!isLoaded"> {{ formatHeader() }}</n-spin>
    </template>
    <template #header-extra>
      <n-checkbox v-model:checked="store.state.selection.mode"> Text only </n-checkbox>
      <n-button @click="showPanel = !showPanel">
        <template #icon>
          <n-icon :component="showPanel ? PlusOutlined : MinusOutlined" />
        </template>
      </n-button>
    </template>
    <n-space vertical size="large" v-if="isLoaded">
      <n-card embedded v-show="showPanel">
        <n-space vertical>
          <template v-for="feat in options?.[1]?.children">
            <n-space>
              <n-tag type="info">{{ feat.title }}</n-tag>
              <n-tag
                @click="updateSelection"
                v-model:checked="features[item.id].checked"
                checkable
                v-for="item in feat?.children">
                {{ item?.title }}
              </n-tag>
              <template v-if="feat.type === 'text'">
                <n-input
                  type="text"
                  size="small"
                  placeholder="Input a fragment"
                  v-model:value="features[feat.id].value"
                  @keyup.enter="selectObjects" />
                <n-button size="small" @click="features[feat.id].value = ''">Clear</n-button>
              </template>
            </n-space>
          </template>
          <n-divider></n-divider>
          <template v-for="feat in options?.[0]?.children">
            <n-space>
              <n-tag type="info">{{ feat.title }}</n-tag>
              <template v-if="feat.type === 'text'">
                <n-input
                  type="text"
                  size="small"
                  placeholder="Input a fragment"
                  v-model:value="properties[feat.id]"
                  @keyup.enter="selectObjects" />
                <n-button size="small" @click="properties[feat.id] = ''">Clear</n-button>
              </template>
              <template v-if="feat?.type === 'single'">
                <n-select
                  size="small"
                  :options="feat?.children"
                  label-field="title"
                  value-field="id"
                  :placeholder="'Select ' + feat?.title"
                  filterable
                  v-model:value="properties[feat.id]" />
                <n-button size="small" @click="properties[feat.id] = null">Clear</n-button>
              </template>
              <template v-else v-for="item in feat?.children">
                <n-tag
                  @click="updateSelection"
                  v-model:checked="properties[item.id]"
                  :checkable="item.type !== 'single'">
                  {{ item?.title }}
                </n-tag>
                <template v-if="item?.type === 'single'">
                  <n-select
                    size="small"
                    :options="item?.children"
                    label-field="title"
                    value-field="id"
                    :placeholder="'Select ' + item?.title"
                    filterable
                    v-model:value="properties[feat.id]" />
                  <n-button size="small" @click="properties[feat.id] = null">Clear</n-button>
                </template>
              </template>
            </n-space>
          </template>
          <n-button type="success" @click="selectObjects"> Select </n-button>
        </n-space>
      </n-card>
      <template v-if="items?.length">
        <n-space justify="center">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            show-size-picker
            :page-slot="5"
            :item-count="currentCount"
            :page-sizes="paginationOptions"
            @update:page="changePage"
            @update:page-size="changePageSize" />
        </n-space>
        <div style="min-height: 400px">
          <n-space vertical size="large">
            <!-- <div v-for="(item, index) in items" :key="index" class="photo"> -->
            <template v-if="store.state.selection.mode">
              <template v-for="(item, index) in items" :key="index">
                <router-link
                  style="text-decoration: none"
                  v-if="item?.content"
                  :to="{ name: 'Toolset', params: { id: item?.data_id }, query: { object: item?.id } }"
                  >{{ item.content }}
                </router-link>
              </template>
            </template>
            <template v-else>
              <n-card v-for="(item, index) in items" :key="index" class="anno" :title="item?.content">
                <template #header-extra>
                  <router-link
                    :to="{ name: 'Toolset', params: { id: item?.data_id, object: item?.id }, query: {} }"
                    class="tag-link"
                    >Go to {{ item?.data_id }}
                  </router-link>
                </template>
                <n-space justify="space-between">
                  <n-space vertical>
                    <n-space>
                      <template v-for="tag in item?.features?.filter(x => x?.value)">
                        <n-button-group size="small" v-if="tag?.note">
                          <n-tooltip trigger="hover">
                            <template #trigger>
                              <n-button type="info" size="small">{{ features[tag.id]?.title }}</n-button>
                            </template>
                            {{
                              typeof tag.value === 'string'
                                ? features[tag.id]?.title
                                : features[features[tag.id].parent].title
                            }}
                          </n-tooltip>
                          <n-tooltip trigger="hover">
                            <template #trigger>
                              <n-button size="small" color="#2080f0">
                                <template #icon>
                                  <n-icon :component="InfoOutlined" />
                                </template>
                              </n-button>
                            </template>
                            {{ tag.note }}
                          </n-tooltip>
                        </n-button-group>
                        <template v-else>
                          <n-tooltip trigger="hover">
                            <template #trigger>
                              <n-button
                                v-if="features[features[tag.id]?.parent]?.code === 'languages'"
                                color="#5a428d"
                                size="small"
                                >{{ features[tag.id]?.title }}</n-button
                              >
                              <n-button v-else :type="typeof tag.value === 'string' ? 'warning' : 'info'" size="small">
                                {{ typeof tag.value === 'string' ? tag.value : features[tag.id]?.title }}</n-button
                              >
                            </template>
                            {{
                              typeof tag.value === 'string'
                                ? features[tag.id]?.title
                                : features[features[tag.id].parent].title
                            }}
                          </n-tooltip>
                        </template>
                      </template>
                    </n-space>
                    <n-space justify="start">
                      <template v-for="tag in item?.properties?.filter(x => x?.value)">
                        <template v-if="!features[tag?.id]?.type">
                          <n-button
                            :type="tag.id === 52 ? 'secondary' : 'primary'"
                            size="small"
                            v-if="features[tag.id]?.parent === 51">
                            <template #icon>
                              <n-icon :component="SquareRound" color="red" />
                            </template>
                          </n-button>
                          <n-tooltip trigger="hover" v-else>
                            <template #trigger>
                              <n-button tertiary size="small">{{ features[tag.id]?.title }}</n-button>
                            </template>
                            {{
                              typeof tag.value === 'string'
                                ? features[tag.id]?.title
                                : features[features[tag.id].parent].title
                            }}
                          </n-tooltip>
                          <!-- <n-button v-else tertiary>{{ features[tag.id]?.title }}</n-button> -->
                        </template>
                      </template>
                    </n-space>
                  </n-space>
                  <router-link :to="{ name: 'Toolset', params: { id: item?.data_id, object: item?.id }, query: {} }">
                    <img
                      style="max-width: 300px"
                      :src="'/api/media/fragments/' + item.id + '.png' + '?jwt=' + store?.state?.token"
                      @contextmenu.prevent="onRightClick" />
                  </router-link>
                </n-space>
              </n-card>
            </template>
          </n-space>
        </div>
        <n-space justify="center">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            show-size-picker
            :page-slot="5"
            :item-count="currentCount"
            :page-sizes="paginationOptions"
            @update:page="changePage"
            @update:page-size="changePageSize" />
        </n-space>
      </template>
      <template v-else>
        <n-alert title="Empty selection" type="warning">
          There is no object with the selected features. Try to change your query
        </n-alert>
      </template>
    </n-space>
  </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import { InfoOutlined, SquareRound, PlusOutlined, MinusOutlined } from '@vicons/material';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import router from '../router';
import store from '../store';

const page = ref(1);
const pageSize = ref(50);
const totalCount = ref(0);
const selectedCount = ref(0);
const currentCount = ref(0);
const isSelected = ref(false);
const isLoaded = ref(false);
const items = ref<Array<IAnnotation>>([]);
const features = store.state.selection.objects;
const properties = store.state.selection.images;
const paginationOptions = [10, 50, 100, 250, 500, 1000, 5000];
const options = reactive([] as Array<IFeature>);
const showPanel = ref(false);
const vuerouter = useRoute();
const pageIn = Number(vuerouter.params.page);
if (pageIn) {
  page.value = pageIn;
}

const batchIn = Number(vuerouter.params.batch);
if (batchIn) {
  pageSize.value = batchIn;
}

const updateSelection = () => {
  console.log('click');
};

const updatePage = async () => {
  isLoaded.value = false;
  console.log('call update page');

  // const images = Object.entries(store.state.selection.images)
  //   .filter(x => x[1])
  //   .map(x => (typeof x[1] === 'number' ? x[1] : Number(x[0])));

  // const objects = Object.values(store.state.selection.objects)
  //   .filter((x: IFeature) => Boolean(x?.checked))
  //   .map((x: IFeature) => x.id);

  const images = Object.entries(store.state.selection.images)
    .filter(x => x[1])
    .map(x => ({ id: typeof x[1] === 'number' ? x[1] : Number(x[0]), value: typeof x[1] === 'string' ? x[1] : true }));

  const objects = Object.values(store.state.selection.objects)
    .filter((x: IFeature) => x?.checked || x?.value)
    .map((x: IFeature) => ({ id: x.id, value: x?.value || x?.checked }));

  // console.log(images2);
  // console.log(objects2);

  let data = await store.post('objects', {
    offset: (page.value - 1) * pageSize.value,
    limit: pageSize.value,
    objects,
    images,
    // images: Object.values(store.state.selection.images)?.filter(Boolean),
  });

  items.value = data.selection;
  console.log('count', items.value.length);

  totalCount.value = Number(data.count.ttl);
  selectedCount.value = Number(data.count?.sel || 0);
  isSelected.value = 'sel' in data.count;
  currentCount.value = isSelected.value ? selectedCount.value : totalCount.value;
  isLoaded.value = true;
};

const updateURL = () => {
  console.log('update URL');
  router.push(`/objects/${pageSize.value}/${page.value || ''}`);
};

const changePage = async (i: number) => {
  console.log('change page', page.value, i);
  updateURL();
};

const changePageSize = async (i: number) => {
  console.log('change size', pageSize.value, i);
  pageSize.value = i;
  page.value = 1;
  updateURL();
};

const onRightClick = () => {
  console.log('right click');
};

const selectObjects = async () => {
  page.value = 1;
  await updatePage();
};

const formatHeader = () => {
  return isSelected.value
    ? `Selected objects – ${selectedCount.value} (${totalCount.value}) • ${Number(
        (selectedCount.value / (totalCount.value / 100)).toFixed(2)
      )}%`
    : `All objects – ${totalCount.value}`;
};

onBeforeMount(async () => {
  console.log('mount');
  const fdata = await store.get('features');
  if (!Object.keys(store.state.selection.objects)?.length) {
    const featuresData = Object.fromEntries(fdata.map((x: any) => [x.id, { ...x, checked: false, value: '' }]));
    Object.assign(store.state.selection.objects, featuresData);
  }
  Object.assign(options, store.nest(fdata));
  await updatePage();
  router.replace(`/objects/${pageSize.value}/${page.value || ''}`);
});

onBeforeRouteUpdate(async (to, from) => {
  console.log('update route', from.fullPath, '→', to.fullPath);

  if (to?.params?.page) {
    // console.log('-> update params');
    page.value = Number(to.params.page);
    pageSize.value = Number(to.params.batch);
  }
  if (from?.params?.page) {
    // console.log('-> call update');
    await updatePage();
  }
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
