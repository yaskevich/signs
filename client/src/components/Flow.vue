<template>
    <n-card :title="`All annotations (${totalCount})`" v-show="isLoaded">
        <n-space vertical size="large">
            <n-pagination
                v-model:page="page"
                v-model:page-size="pageSize"
                show-size-picker
                :item-count="totalCount"
                :page-sizes="[50, 100, 250, 500, 1000]"
                @update:page="changePage"
                @update:page-size="changePageSize"
            />
            <div v-for="(item, index) in items" :key="index" class="photo">
                <div
                    v-for="anno in item?.annotations.map(x => processAnnotations(x, item.tg_id))"
                    :key="anno.id"
                    class="anno"
                    v-bind:class="{ error: anno.error }"
                >
                    <!-- <span>{{ anno }}}</span> -->
                    <n-space vertical>
                        <n-h3
                            prefix="bar"
                            type="primary"
                            style="margin-bottom: -1px;"
                        >{{ anno?.heading }}</n-h3>
                        <n-space>
                            <template v-for="tag in anno?.tags">
                                <n-tooltip trigger="hover" v-if="tag?.title">
                                    <template #trigger>
                                        <n-button type="info" size="small">{{ tag.label }}</n-button>
                                    </template>
                                    {{ tag.title }}
                                </n-tooltip>
                                <n-tag v-else type="success">{{ tag.label }}</n-tag>
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

                            <n-button
                                size="small"
                                @click="$router.push(`/message/${item?.tg_id}`)"
                            >Go to {{ item?.tg_id }}</n-button>
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
import { ArrowDown, ArrowUp } from '@vicons/fa';
import { useRoute } from 'vue-router';
import router from "../router";


const page = ref(1);
const pageSize = ref(50);
const totalCount = ref(0);
const isLoaded = ref(false);
const items = reactive<Array<IMessage>>([]);
const countries = reactive({} as keyable);


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
        if (item.purpose === "tagging") {
            const obj = { label: item.value.replace('TAG-', ''), tag: item.value } as keyable;
            const title = suggestions?.[item.value];
            if (title) {
                obj.title = title;
            }
            tags.push(obj);
        }
    }

    return ({ ...(error) && { error }, ...{ heading, tags, id: itemAnn.id } });
    // return '';
};

const updatePage = async () => {
    let { data } = await axios.get('/api/annotations', { params: { offset: (page.value - 1) * pageSize.value, limit: pageSize.value } });
    Object.assign(items, data.selection);
    totalCount.value = Number(data.count);

    ({ data } = await axios.get('/api/scheme'));
    const countriesList = Object.assign({}, ...(data.countries.map((x: any) => ({ [x.code]: x }))));
    Object.assign(countries, countriesList);
    router.replace(`/flow/${pageSize.value}/${(page.value || '')}`);
    isLoaded.value = true;
};

const changePage = async (i: number) => {
    console.log('change page', page.value, i);
    await updatePage();
};

const changePageSize = async (i: number) => {
    console.log('change size', pageSize.value, i);
    pageSize.value = i;
    page.value = 1;
    await updatePage();
};

onBeforeMount(async () => {
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
</style>
