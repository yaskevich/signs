<template>
  <n-card title="Settings" :bordered="false" class="minimal left" v-if="isLoaded">
    <n-space vertical>
      <n-h4>Registration</n-h4>
      Status
      <n-switch v-model:value="settings.registration_open">
        <template #checked> Open </template>
        <template #unchecked> Closed </template>
      </n-switch>

      Code
      <n-input
        v-model:value="settings.registration_code"
        type="text"
        placeholder="...some unique string..."
        :disabled="!settings.registration_open"
        autofocus
        clearable></n-input>

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
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import { useMessage } from 'naive-ui';
const message = useMessage();
const settings = ref();
const isLoaded = ref(false);

const saveSettings = async () => {
  const data = await store.post('settings', {
    ...settings.value,
  });
  console.log(data);
};

onBeforeMount(async () => {
  const { data } = await store.getUnauthorized('settings');
  settings.value = data;
  isLoaded.value = true;
});
</script>
