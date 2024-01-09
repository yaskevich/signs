<template>
  <n-card title="Upload" :bordered="false" class="minimal left">
    <template #header-extra>
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-switch :rail-style="railStyle" v-model:value="mode">
            <template #checked> Multiple Files</template>
            <template #unchecked> Single File </template>
          </n-switch>
        </template>
        After single file upload a user will be redirected to annotation screen. <br />
        In multiple mode a user will stay on upload screen.
      </n-tooltip>
    </template>
    <n-space vertical>
      <n-upload :multiple="mode" directory-dnd action="/api/upload/" :headers="headers"
        :data="{ 'features': JSON.stringify(Object.values(selected).map(x => ({ id: x, value: true }))) }"
        @before-upload="beforeUpload" @finish="imageLoaded" @error="handleError">
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <!-- <n-button size="small" color="#2080f0">
          <template #icon>  -->
            <n-icon size="48" color="green" :component="FileUploadFilled" />
            <!-- </template>
        </n-button> -->

            <!-- <n-icon size="48" :depth="3">
            <archive-icon />
          </n-icon> -->
          </div>
          <n-text style="font-size: 16px"> Click or drag one or multiple image files to this area to upload </n-text>
          <n-p depth="3" style="margin: 8px 0 0 0">
            Only PNG and JPEG formats are accepted. Upload the file version of the best quality you have.
          </n-p>
        </n-upload-dragger>
      </n-upload>

      <div v-for="item in options">
        ■ {{ item.title }}
        <div>
          <n-radio-group name="item.key" v-model:value="selected[item.id]">
            <n-space>
              <n-radio @change="clickRadio(item.id, item2.id)" v-for="(item2, index2) in item.children" :key="item2.key"
                :value="item2.id" :label="item2.title" />
            </n-space>
          </n-radio-group>
        </div>
      </div>
      <n-space>
        <n-button @click="clear">Clear properties</n-button>
      </n-space>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { FileUploadFilled } from '@vicons/material';
import { CSSProperties, ref, onBeforeMount, reactive } from 'vue';
import store from '../store';
import type { UploadInst, UploadFileInfo, MessageType } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';

const router = useRouter();
const message = useMessage();
const mode = ref(false);

const options = ref();
const selected = ref({} as keyable)

const clickRadio = (parent: number, id: number) => {
  console.log(parent, id);
  // selected[parent] = id;
};

const clear = () => {
  for (const [key] of Object.entries(selected.value)) {
    selected.value[key] = null;
  }
};

const railStyle = ({ focused, checked }: { focused: boolean; checked: boolean }) => {
  const style = {} as CSSProperties;
  if (checked) {
    style.background = '#d03050';
    if (focused) {
      style.boxShadow = '0 0 0 2px #d0305040';
    }
  } else {
    style.background = '#2080f0';
    if (focused) {
      style.boxShadow = '0 0 0 2px #2080f040';
    }
  }
  return style;
};

const headers = { Authorization: 'Bearer ' + store.state.token };
// const previewFileList = reactive<CustomFileInfo[]>([]);

const beforeUpload = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  if (!['image/png', 'image/jpeg'].includes(String(data.file.file?.type))) {
    message.error('Allowed file formats are JPEG and PNG only!');
    return false;
  }
  console.log('before', data);
  return true;
};

const imageLoaded = (options: { file: UploadFileInfo; event?: Event }) => {
  // console.log("options", options);
  // console.log('loaded', options.file);
  if (options?.file?.status === 'finished') {
    if (options?.event?.target) {
      const datum = JSON.parse((options.event.target as XMLHttpRequest).response);
      console.log('done', datum);
      if (!mode.value) {
        router.push({ name: 'Toolset', params: { id: datum?.id } });
      }
    }
    // const path = (options?.event?.target as XMLHttpRequest)?.responseText;
    // const url = `/api/images/${id}/${path}`;
    // // console.log('path/url', path, url);
    // previewFileList.unshift({ ...options.file, url, title: options.file.name.split('.').slice(0, -1).join('.') });
    // loadedFiles[options.file.id] = path;
  }
  return;
};

const handleError = (options: { file: UploadFileInfo; event?: Event }) => {
  if (options?.event?.target) {
    const datum = JSON.parse((options.event.target as XMLHttpRequest).response);
    console.log('error', datum);
    message.error(datum.error);
  }
};

onBeforeMount(async () => {
  const featuresData = await store.get('features');
  options.value = store.nest(featuresData)?.shift()?.children;
  console.log(options.value);
});


</script>
