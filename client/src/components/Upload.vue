<template>
  <n-card title="Upload" :bordered="false" class="minimal left">
    <n-upload multiple directory-dnd action="/api/upload/" :headers="headers" 
    @before-upload="beforeUpload" @finish="imageLoaded">
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
  </n-card>
</template>

<script setup lang="ts">
import { FileUploadFilled } from '@vicons/material';
import store from '../store';
import type { UploadInst, UploadFileInfo, MessageType } from 'naive-ui';
import { useMessage } from 'naive-ui';

const message = useMessage();

const headers = { Authorization: 'Bearer ' + store.state.token };
// const previewFileList = reactive<CustomFileInfo[]>([]);

const beforeUpload = (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  if (!['image/png', 'image/jpeg'].includes(String(data.file.file?.type))) {
    message.error('Allowed file formats are JPEG and PNG only!');
    return false;
  }
  console.log(data);
  
  return true;
};

const imageLoaded = (options: { file: UploadFileInfo; event?: Event }) => {
  // console.log("options", options, previewFileList);
  // console.log('loaded', options.file);

  if (options?.file?.status === 'finished') {
    if (options?.event?.target){
        console.log('done', JSON.parse((options.event.target as XMLHttpRequest).response));
    }
    // const path = (options?.event?.target as XMLHttpRequest)?.responseText;
    // const url = `/api/images/${id}/${path}`;
    // // console.log('path/url', path, url);
    // previewFileList.unshift({ ...options.file, url, title: options.file.name.split('.').slice(0, -1).join('.') });
    // loadedFiles[options.file.id] = path;
  }

  return;
};
</script>
