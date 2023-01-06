<template>
  <n-card title="Settings" :bordered="false" class="minimal left">
    {{ settings }}
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount } from 'vue';
import store from '../store';
import { useMessage } from 'naive-ui';
const message = useMessage();
const settings = ref();

onBeforeMount(async () => {
  const { data } = await store.getUnauthorized('settings');
  settings.value = data;
});
</script>
