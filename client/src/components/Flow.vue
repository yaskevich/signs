<template>
  <n-card :title="`All annotations (${totalCount})`">
    <n-pagination
      v-model:page="page"
      v-model:page-size="pageSize"
      show-size-picker
      :item-count="totalCount"
      :page-sizes="[10, 50, 100, 250, 500, 1000]"
      @update:page="changePage"
      @update:page-size="changePageSize"
    />
    <n-divider></n-divider>
    <n-space vertical size="large" v-show="isLoaded">
      <div v-for="(item, index) in items" :key="index" class="photo">
        <div
          v-for="anno in item?.annotations?.map(x => processAnnotations(x, item.tg_id))"
          :key="anno.id"
          class="anno"
          v-bind:class="{ error: anno.error }"
        >
          <!-- <span>{{ anno }}}</span> -->
          <n-space vertical>
            <n-h3 prefix="bar" type="info" style="margin-bottom: -1px">{{ anno?.heading }}</n-h3>
            <n-space>
              <template v-for="tag in anno?.tags">
                <n-button-group size="small" v-if="tag?.title">
                  <n-button type="info" size="small">{{ tag.label }}</n-button>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-button size="small" color="#2080f0">
                        <template #icon>
                          <n-icon :component="InfoCircle" />
                        </template>
                      </n-button>
                    </template>
                    {{ tag.title }}
                  </n-tooltip>
                </n-button-group>
                <template v-else>
                  <n-button v-if="tag?.language" color="#5a428d" size="small">{{ tag.label }}</n-button>
                  <n-button v-else type="info" size="small">{{ tag.label }}</n-button>
                </template>
              </template>
            </n-space>
            <!-- <n-space>
                        <n-button @click="$router.push(`/message/${item?.tg_id}`)">{{ item?.tg_id }}</n-button>
                        <template v-for="(feature, n) in anno.body">
                            <div v-if="feature.purpose === 'commenting'">
                                <n-h6 align-text>{{ feature.value }}</n-h6>
                            </div>

                            <n-tag
                                type="success"
                                v-if="feature.purpose === 'tagging'"
                            >{{ feature.value.replace('TAG-', '') }}</n-tag>
                            <span
                                v-if="!['commenting', 'tagging'].includes(feature.purpose)"
                            >{{ feature }}</span>
                        </template>
                        </n-space>-->
            <n-space justify="space-between">
              <n-tag>{{ countries?.[item?.country]?.name }}</n-tag>
              <n-button quaternary type="primary">
                <template #icon>
                  <n-icon
                    :component="item?.orient > 1 ? ArrowUp : ArrowDown"
                    :color="item?.orient > 1 ? 'red' : 'green'"
                  />
                </template>
              </n-button>
              <router-link :to="`/message/${item?.tg_id}`" class="tag-link">Go to {{ item?.tg_id }}</router-link>
            </n-space>
          </n-space>
        </div>
      </div>
    </n-space>
  </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import axios from 'axios';
import { ArrowDown, ArrowUp, InfoCircle } from '@vicons/fa';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import router from '../router';

const page = ref(1);
const pageSize = ref(50);
const totalCount = ref(0);
const isLoaded = ref(false);
const items = reactive<Array<IMessage>>([]);
const countries = reactive({} as keyable);
const languages = reactive([] as Array<string>);

const vuerouter = useRoute();
const pageIn = Number(vuerouter.params.page);
if (pageIn) {
  page.value = pageIn;
}

const batchIn = Number(vuerouter.params.batch);
if (batchIn) {
  pageSize.value = batchIn;
}

const processAnnotations = (itemAnn: IAnnotation, id: number) => {
  // console.log(annos);
  const suggestions = {} as keyable;
  const tags = [];
  let flag = true;
  let heading = '';
  let error = false;
  for (let item of itemAnn.body) {
    if (['commenting', 'replying'].includes(item.purpose)) {
      if (flag) {
        heading = item.value;
        flag = false;
      } else {
        const tagContent = item.value.replaceAll('\n', '');
        const matches = tagContent.matchAll(/^(TAG-[A-Z]+)[:]?\s*(.*)$/g);
        const results = Array.from(matches);
        if (results?.[0]?.length) {
          if (!results?.[0][2]) {
            console.warn(id, results?.[0]?.length, results?.[0]);
            error = true;
          } else {
            suggestions[results?.[0][1]] = results?.[0][2];
          }
        } else {
          console.warn(id, item.value);
          error = true;
        }
      }
    }
  }

  for (let item of itemAnn.body) {
    if (item.purpose === 'tagging') {
      const obj = { label: item.value.replace('TAG-', ''), tag: item.value } as keyable;
      const title = suggestions?.[item.value];
      if (title) {
        obj.title = title;
      }
      if (languages.includes(item.value)) {
        obj.language = true;
      }
      tags.push(obj);
    }
  }

  if (!heading) {
    error = true;
  }

  return { ...(error && { error }), ...{ heading, tags: tags.sort(x => (x?.language ? -1 : 2)), id: itemAnn.id } };
  // return '';
};

const updatePage = async () => {
  isLoaded.value = false;
  console.log('call update page');

  let { data } = await axios.get('/api/annotations', {
    params: { offset: (page.value - 1) * pageSize.value, limit: pageSize.value },
  });
  Object.assign(items, data.selection);
  totalCount.value = Number(data.count);

  ({ data } = await axios.get('/api/scheme'));
  const countriesList = Object.assign({}, ...data.countries.map((x: any) => ({ [x.code]: x })));
  Object.assign(countries, countriesList);
  Object.assign(languages, data.languages);
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
  await updatePage();
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
