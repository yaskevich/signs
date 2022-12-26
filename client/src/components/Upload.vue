<template>
  <n-card title="Upload" :bordered="false" class="minimal left">
    <n-upload multiple directory-dnd action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f" :max="5">
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <!-- <n-button size="small" color="#2080f0">
          <template #icon>  -->
          <n-icon :component="InfoOutlined" />
          <!-- </template>
        </n-button> -->

          <!-- <n-icon size="48" :depth="3">
            <archive-icon />
          </n-icon> -->
        </div>
        <n-text style="font-size: 16px"> Click or drag an image file to this area to upload </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          Strictly prohibit from uploading sensitive information. For example, your bank card PIN or your credit card
          expiry date.
        </n-p>
      </n-upload-dragger>
    </n-upload>
  </n-card>
</template>

<script setup lang="ts">
import { InfoOutlined, SquareRound, PlusOutlined, MinusOutlined } from '@vicons/material';
</script>
