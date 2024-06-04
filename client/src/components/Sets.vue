<template>
  <n-card title="Sets" :bordered="false" class="minimal" v-if="isLoaded">

    <n-space vertical justify="center" class="minimal" v-if="!items?.length">
      <n-alert title="No sets" type="warning">Create a saved set at Objects screen</n-alert>
    </n-space>

    <n-space vertical size="large">
      <n-grid x-gap="12" cols="2" y-gap="6" responsive="screen" v-for="item in items" :key="item.id">
        <n-gi>
          <n-tag type="info" size="large">
            <template #icon v-if="item.exported">
              <n-icon :component="CloudDownloadFilled" />
            </template>
            {{ item.title }}</n-tag>
        </n-gi>
        <n-gi style="text-align: right">
          <n-dropdown trigger="hover" :options="[
    { label: 'Export', key: 0, data: item, disabled: item.exported },
    { label: 'Delete', key: 1, data: item },
  ]" @select="handleSelect">
            <n-button>Manage</n-button>
          </n-dropdown>
        </n-gi>
      </n-grid>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import store from '../store';
import { useMessage } from 'naive-ui';
import { CloudDownloadFilled } from '@vicons/material';

const message = useMessage();
const isLoaded = ref(false);
const items = ref([] as Array<ISet>);

const handleSelect = async (key: string | number, option: any) => {
  // console.log(String(key), option);
  if (key) {
    // console.log(key, option.data.id);
    const data = await store.deleteById('sets', option.data.id);
    if (data?.id === option.data.id) {
      message.success('The set was deleted succesfully');
      items.value = items.value.filter((x: ISet) => x.id !== data?.id);
    } else {
      message.error('The set cannot be deleted');
    }
  } else {
    const res = await store.post('set/publish', option.data);
    // console.log('export', res);
    if (res?.success) {
      option.data.exported = true;
    }
  }
};

onBeforeMount(async () => {
  items.value = await store.get('sets');
  isLoaded.value = true;
});
</script>