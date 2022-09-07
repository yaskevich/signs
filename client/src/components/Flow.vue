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
                <div v-for="anno in item.annotations" :key="anno.id" class="anno">
                    <n-space>
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
                    </n-space>
                    <div>
                        <n-tag>{{ countries?.[item?.country]?.name }}</n-tag>
                    </div>
                </div>
            </div>
        </n-space>
    </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import axios from 'axios';

const page = ref(1);
const pageSize = ref(100);
const totalCount = ref(0);
const isLoaded = ref(false);
const items = reactive<Array<IMessage>>([]);
const countries = reactive({} as keyable);

const updatePage = async () => {
    let { data } = await axios.get('/api/annotations', { params: { offset: (page.value - 1) * pageSize.value, limit: pageSize.value } });
    Object.assign(items, data.selection);
    totalCount.value = Number(data.count);

    ({ data } = await axios.get('/api/scheme'));
    const countriesList = Object.assign({}, ...(data.countries.map((x: any) => ({ [x.code]: x }))));
    Object.assign(countries, countriesList);


    isLoaded.value = true;
}

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
</style>
