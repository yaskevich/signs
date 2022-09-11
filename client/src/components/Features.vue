<template>
  <n-tree
    block-line
    :render-label="renderOption"
    :data="options"
    key-field="id"
    default-expand-all
    :selectable="false"
    :cancelable="false"
    @update:selected-keys="handleSelect"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h } from 'vue';
import axios from 'axios';
import { NTag, NButton, NText, NTooltip, NIcon } from 'naive-ui';
import { ArrowDown, ArrowUp, InfoCircle } from '@vicons/fa';

const isLoaded = ref(false);
const datum = reactive({} as IStats);

const handleSelect = (e: any) => {
  console.log('label', e);
};

const renderOption = (e: any) => {
  //   console.log(e);
  return h(
    NButton,
    {
      size: 'small',
      onClick: () => handleSelect(e.option.code),
    },
    { default: () => e.option.code }
  );
};

const options = reactive([]);

const nest = (items: any, id = 0) =>
  items
    .filter((x: any) => x.parent === id)
    .map((x: any) => {
      const children = nest(items, x.id);
      return { ...x, ...(children?.length && { children }) };
    });

onBeforeMount(async () => {
  const { data } = await axios.get('/api/features');
  // Object.assign(datum, data);
  //   console.log('features', data);
  console.log('nest', nest(data));
  Object.assign(options, nest(data));
  isLoaded.value = true;
});
</script>
