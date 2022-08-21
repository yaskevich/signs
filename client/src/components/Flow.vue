<template>
    <n-card title="All annotations">
        <div v-for="(item, index) in items" :key="index" class="photo">
            <div v-for="anno in item.annotations" :key="anno.id" class="anno">
                <n-space >
                <template v-for="feature in anno.body">
                    <n-h6
                        prefix="bar"
                        align-text
                        v-if="feature.purpose === 'commenting'"
                    >{{ feature.value }}</n-h6>
                    <n-tag type="success" v-if="feature.purpose === 'tagging'">{{ feature.value.replace('TAG-', '') }}</n-tag>
                    <span v-if="!['commenting', 'tagging'].includes(feature.purpose)">{{ feature }}</span>
                    </template>
                </n-space>
            </div>
        </div>
    </n-card>
</template>
<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import axios from 'axios';

const items = reactive<Array<IMessage>>([]);
onBeforeMount(async () => {
    const { data } = await axios.get('/api/annotations');
    Object.assign(items, data);
    console.log(data);
    //   totalCount.value = Number(datum.count);
    //   users.value = datum.users;
    //   isLoaded.value = true;
});
</script>

<style lang="scss" scoped>
.photo {
    border: 1px solid gray;
}
.anno{
    border: 1px dashed silver;
    padding: 5px;
    margin: 5px;
}
</style>