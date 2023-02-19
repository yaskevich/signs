<template>
  <n-card title="Settings" :bordered="false" class="minimal left" v-if="isLoaded">
    <n-space vertical>
      <n-h4>Registration</n-h4>
      <n-h5>Status</n-h5>
      <n-switch v-model:value="settings.registration_open">
        <template #checked> Open </template>
        <template #unchecked> Closed </template>
      </n-switch>
      <n-h5>Activation Code</n-h5>
      <n-input
        v-model:value="settings.registration_code"
        type="text"
        placeholder="...some unique string..."
        :disabled="!settings.registration_open"
        autofocus
        clearable></n-input>
      <n-h4>Uploading</n-h4>
      <n-h5>Geotag</n-h5>

      <n-switch v-model:value="settings.geotag_required">
        <template #checked> Required </template>
        <template #unchecked> Not required </template>
      </n-switch>

      <n-h4>Telegram</n-h4>
      <a href="https://gram.js.org/getting-started/authorization">Getting API ID and API Hash</a>
      API ID
      <n-input-number
        v-model:value="settings.telegram_api_id"
        type="text"
        autofocus
        :show-button="false"
        clearable></n-input-number>
      API Hash
      <n-input v-model:value="settings.telegram_api_hash" type="text" autofocus clearable></n-input>
      <n-button type="success" @click="saveSettings"> Save </n-button>
    </n-space>
    {{ settings }}

    <n-space v-for="item in chats" justify="space-between">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-tag type="success">
            <template #icon>
              <n-icon :component="TelegramOutlined" />
            </template>
            {{ item.eid }}
          </n-tag>
        </template>
        Telegram ID
      </n-tooltip>
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-tag type="success">
            <template #icon>
              <n-icon :component="PersonOutlineFilled" />
            </template>
            {{ item?.firstname }} {{ item?.lastname }} {{ item?.title }}
          </n-tag>
        </template>
        {{ item?.src }} {{ item.type }}
      </n-tooltip>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import { TelegramOutlined, PersonOutlineFilled } from '@vicons/material';
import { useMessage } from 'naive-ui';
const message = useMessage();
const settings = ref();
const isLoaded = ref(false);
const chats = ref([] as Array<IChat>);

const saveSettings = async () => {
  const data = await store.post('settings', {
    ...settings.value,
  });
  if (data === 1) {
    message.success('Settings were updated successfully');
  }
};

onBeforeMount(async () => {
  const data = await store.get('settings');
  settings.value = data;
  isLoaded.value = true;
  const chatsList = await store.get('chats');
  chats.value = chatsList;
});
</script>
