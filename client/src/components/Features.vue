<template>
  <n-card :bordered="false" style="max-width: 400px; margin: auto">
    <n-tree
      block-line
      :render-label="renderOption"
      :data="options"
      key-field="id"
      :selectable="false"
      :cancelable="false"
      :default-expanded-keys="[1, 2, 4, 5, 6, 50, 51]"
      @update:selected-keys="handleSelect"
    />
  </n-card>
  <n-modal
    v-model:show="showModal"
    :style="{ 'max-width': '600px' }"
    class="custom-card"
    preset="card"
    title="Edit the feature"
    size="huge"
    :segmented="{ content: 'soft', footer: 'soft' }"
  >
    <n-form>
      <n-form-item label="Code" feedback="For internal use. Numbers and English letters only">
        <n-input
          v-model:value="feature.code"
          clearable
          placeholder="..."
          :allow-input="onlyAllowedInput"
          :maxlength="8"
        />
      </n-form-item>

      <n-form-item label="Title" feedback="Displayed everywhere">
        <n-input v-model:value="feature.title" clearable placeholder="..." />
      </n-form-item>

      <n-form-item label="Comment">
        <n-input v-model:value="feature.comment" clearable placeholder="..." type="textarea" />
      </n-form-item>
    </n-form>
    <n-space vertical>
      <n-space justify="space-between">
        <n-button type="info" @click="showModal = false">Cancel</n-button>
        <n-button type="success" @click="saveFeature" :disabled="!feature.code || !feature.title">Save</n-button>
      </n-space>
    </n-space>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h } from 'vue';
import axios from 'axios';
import { NButton } from 'naive-ui';

const isLoaded = ref(false);
const showModal = ref(false);
const feature = ref<IFeature>({ title: '', code: '', comment: '' } as IFeature);
const options = reactive([] as Array<IFeature>);

const onlyAllowedInput = (value: string) => !value || /^[a-z0-9]+$/.test(value);

const handleSelect = (inputFeature: IFeature) => {
  // console.log('label', inputFeature.code, inputFeature.id);
  feature.value = { ...inputFeature };
  feature.value.ref = inputFeature;
  showModal.value = true;
};

const renderOption = (e: any) => {
  //   console.log(e);
  return h(
    NButton,
    {
      size: 'small',
      onClick: () => handleSelect(e.option),
    },
    { default: () => e.option.title || e.option.code }
  );
};

const saveFeature = async () => {
  showModal.value = false;
  // console.log(feature?.value?.id);
  if (feature?.value?.ref) {
    const refOption = feature.value.ref;
    delete feature.value.ref;
    const { data } = await axios.post('/api/feature', {
      params: {
        id: feature.value.id,
        code: feature.value.code,
        title: feature.value.title,
        comment: feature.value.comment,
      },
    });
    // console.log(data);

    if (data?.id == feature.value.id) {
      refOption.title = feature.value.title;
      refOption.code = feature.value.code;
      refOption.comment = feature.value.comment;
      // message.success('The data were saved.');
    } else {
      // message.error('The data were not saved!');
    }
  }
};

const nest = (items: any, id = 0) =>
  items
    .filter((x: any) => x.parent === id)
    .map((x: any) => {
      const children = nest(items, x.id);
      return { ...x, ...(children?.length && { children }) };
    });

onBeforeMount(async () => {
  const { data } = await axios.get('/api/features');
  // console.log('nest', nest(data));
  Object.assign(options, nest(data));
  isLoaded.value = true;
});
</script>
