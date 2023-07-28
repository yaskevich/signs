<template>
  <n-card title="Annotation Scheme" :bordered="false" class="minimal">
    <n-tree
      v-if="isLoaded"
      block-line
      :render-label="renderOption"
      :data="options"
      key-field="id"
      :selectable="false"
      :cancelable="false"
      :default-expanded-keys="[1, 2, 4, 5, 6, 50, 51, 61]"
      @update:selected-keys="handleSelect" />
  </n-card>
  <n-modal
    v-model:show="showModal"
    :style="{ 'max-width': '600px' }"
    class="custom-card"
    preset="card"
    title="Edit the feature"
    size="huge"
    :segmented="{ content: 'soft', footer: 'soft' }">
    <n-form>
      <n-text strong v-if="Boolean(feature?.id)"
        >Type: {{ (itemTypes.find(x => x.value === feature.type) || itemTypes[0])?.label }}</n-text
      >

      <n-form-item label="Type" feedback="Cannot be changed if it is set" v-else>
        <n-select v-model:value="feature.type" :options="itemTypes" />
      </n-form-item>

      <n-form-item label="Code" feedback="For internal use. Numbers and English letters only">
        <n-input v-model:value="feature.code" clearable placeholder="..." :allow-input="onlyAllowedInput" />
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
import { NButton, NTag, NSpace, NIcon } from 'naive-ui';
import store from '../store';
import { useMessage } from 'naive-ui';
import {
  PanToolAltFilled,
  PanToolFilled,
  TextSnippetFilled,
  TopicFilled,
  SquareRound,
  CheckBoxFilled,
  CheckFilled,
  FolderFilled,
} from '@vicons/material';

const message = useMessage();
const isLoaded = ref(false);
const showModal = ref(false);
const feature = ref<IFeature>({ title: '', code: '', comment: '' } as IFeature);
const options = reactive([] as Array<IFeature>);

const itemTypes = [
  {
    label: 'Generic Item',
    value: '',
  },
  {
    label: 'Generic Category',
    value: 'multi',
  },
  {
    label: 'Single Choice Category',
    value: 'single',
  },
  {
    label: 'Text Item',
    value: 'text',
  },
];

const onlyAllowedInput = (value: string) => !value || /^[a-z0-9]+$/.test(value);

const handleSelect = (inputFeature: IFeature) => {
  // console.log('label', inputFeature.code, inputFeature.id);
  feature.value = { ...inputFeature };
  feature.value.ref = inputFeature;
  showModal.value = true;
};

const chooseIcon = (item: IFeature) => {
  if (!item.parent) {
    return FolderFilled;
  }
  if (item.type === 'text') {
    return TextSnippetFilled;
  }
  if (item.type === 'single') {
    return PanToolAltFilled;
  }
  if (item.type === 'multi') {
    return TopicFilled;
  }
  return CheckFilled;
};

const renderOption = (e: any) => {
  //   console.log(e);
  return h(NSpace, null, {
    default: () => [
      h(
        NTag,
        {
          size: 'medium',
          type: 'success',
        },
        {
          default: () => e.option.title || e.option.code,
          icon: () => h(NIcon, {}, { default: () => h(chooseIcon(e.option)) }),
        }
      ),
      store?.state?.user?.privs === 1
        ? h(NButton, { onClick: () => handleSelect(e.option), size: 'small' }, { default: () => 'Edit' })
        : null,
      store?.state?.user?.privs === 1 && ['single', 'multi'].includes(e?.option?.type)
        ? h(
            NButton,
            { onClick: () => addItem(e.option), size: 'small', secondary: true, type: 'warning' },
            { default: () => 'Add item' }
          )
        : h(
            NButton,
            { onClick: () => deleteItem(e.option), size: 'small', secondary: true, type: 'error' },
            { default: () => 'Delete' }
          ),
    ],
  });
};

const addItem = (inputFeature: IFeature) => {
  if (inputFeature?.id) {
    feature.value = { code: '', comment: '', title: '', type: '', parent: inputFeature.id } as IFeature;
    feature.value.ref = inputFeature;
    showModal.value = true;
  }
};

const deleteItem = async (inputFeature: IFeature) => {
  if (inputFeature?.id) {
    console.log('delete feature', inputFeature?.id);
    const data = await store.deleteById('feature', inputFeature.id);
    if (data?.id === inputFeature.id) {
      console.log('item deleted');
    }
  }
};

const saveFeature = async () => {
  showModal.value = false;
  // console.log('feature', feature?.value);

  if (feature?.value?.ref) {
    const refOption = feature.value.ref;
    delete feature.value.ref;
    const data = await store.post('feature', {
      params: {
        id: feature.value.id,
        code: feature.value.code,
        title: feature.value.title,
        comment: feature.value.comment,
        type: feature.value.type,
        parent: feature.value.parent,
      },
    });

    if (data?.id) {
      if (data.id == feature.value.id) {
        refOption.id = feature.value.id;
        refOption.title = feature.value.title;
        refOption.code = feature.value.code;
        refOption.comment = feature.value.comment;
        refOption.parent = feature.value.parent;
        message.success('The data were saved.');
      } else if (!feature?.value?.id) {
        refOption?.children
          ? refOption?.children.push({ ...feature.value })
          : (refOption.children = [{ ...feature.value }]);
        message.success('New item was added.');
      } else {
        message.error('The data were not saved!');
      }
    } else {
      message.error('The data were not saved!');
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
  const fdata = await store.get('features');
  Object.assign(options, nest(fdata));
  isLoaded.value = true;
});
</script>
