<template>
  <n-card>
    <template #header>
      <n-spin :show="!isLoaded"> {{ formatHeader() }}</n-spin>
    </template>
    <template #header-extra>
      <n-button @click="showPanel = !showPanel">
        <template #icon>
          <n-icon :component="showPanel ? Plus : Minus" />
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
            </n-space>
          </template>
          <n-button color="#2080f0" @click="selectObjects"> Select </n-button>
        </n-space>
      </n-card>

      <n-pagination
        v-model:page="page"
        v-model:page-size="pageSize"
        show-size-picker
        :item-count="currentCount"
        :page-sizes="paginationOptions"
        @update:page="changePage"
        @update:page-size="changePageSize" />
      <div style="min-height: 400px">
        <n-space vertical size="large">
          <!-- <div v-for="(item, index) in items" :key="index" class="photo"> -->
          <n-card v-for="(item, index) in items" :key="index" class="anno" :title="item?.content">
            <template #header-extra>
              <router-link
                :to="{ name: 'TMessage', params: { id: item?.tg_id }, query: { object: item?.id } }"
                class="tag-link"
                >Go to {{ item?.tg_id }}
              </router-link>
            </template>
            <n-space justify="space-between">
              <n-space vertical>
                <n-space>
                  <template v-for="tag in item.features">
                    <n-button-group size="small" v-if="tag?.note">
                      <n-button type="info" size="small">{{ features[tag.id]?.title }}</n-button>
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
                        >{{ features[tag.id]?.title }}</n-button
                      >
                      <n-button v-else type="info" size="small">{{ features[tag.id]?.title }}</n-button>
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
              <router-link :to="{ name: 'TMessage', params: { id: item?.tg_id }, query: { object: item?.id } }">
                <img
                  style="max-width: 300px"
                  :src="'/api/media/fragments/' + item.id + '.png' + '?jwt=' + store?.state?.token"
                  @contextmenu.prevent="onRightClick" />
              </router-link>
            </n-space>
          </n-card>
        </n-space>
      </div>
      <n-pagination
        v-model:page="page"
        v-model:page-size="pageSize"
        show-size-picker
        :item-count="currentCount"
        :page-sizes="paginationOptions"
        @update:page="changePage"
        @update:page-size="changePageSize" />
    </n-space>
  </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import { ArrowDown, ArrowUp, InfoCircle, Square, Plus, Minus } from '@vicons/fa';
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
const features = reactive({} as keyable);
const paginationOptions = [10, 50, 100, 250, 500, 1000];
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
  store.state.selection.objects = Object.values(features)
    .filter((x: IFeature) => Boolean(x?.checked))
    .map((x: IFeature) => x.id);
};

const updatePage = async () => {
  isLoaded.value = false;
  console.log('call update page');

  let data = await store.get('objects', null, {
    offset: (page.value - 1) * pageSize.value,
    limit: pageSize.value,
    features: store.state.selection.objects,
  });

  items.value = data.selection;
  console.log('count', data.count);

  totalCount.value = Number(data.count.ttl);
  selectedCount.value = Number(data.count?.sel || 0);
  isSelected.value = 'sel' in data.count;
  currentCount.value = isSelected.value ? selectedCount.value : totalCount.value;
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

const onRightClick = () => {
  console.log('right click');
};

const selectObjects = async () => {
  page.value = 1;
  await updatePage();
};

const formatHeader = () => {
  return isSelected.value
    ? `Selected objects – ${selectedCount.value} (${totalCount.value})`
    : `All objects – ${totalCount.value}`;
};

onBeforeMount(async () => {
  console.log('mount');
  const fdata = await store.get('features');
  const featuresData = Object.fromEntries(
    fdata.map((x: any) => [x.id, { ...x, checked: store.state.selection.objects.includes(x.id) }])
  );

  Object.assign(features, featuresData);
  updateURL();
  await updatePage();
  // const fdata = await store.get('features');
  Object.assign(options, store.nest(fdata));
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
