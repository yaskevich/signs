<template>
  <n-card title="Logs" :bordered="false" class="minimal left" v-if="isLoaded">
    <n-data-table :columns="columns" :data="data" :pagination="pagination" :bordered="false" />
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeMount, h } from 'vue';
import { NButton, NTooltip, NTime, NTag } from 'naive-ui';
import store from '../store';

const pagination = false;
const isLoaded = ref(false);
const data = ref([]);
const usersHash = reactive({} as keyable);
const columns = [
  {
    title: 'Time',
    key: 'created',
    render(row: ILog) {
      return h(NTime, { time: new Date(row.created) }, { default: () => row?.created });
    },
  },
  {
    title: 'Event',
    key: 'event',
  },
  {
    title: 'User',
    key: 'user_id',
    render(row: ILog) {
      const user = usersHash[String(row?.user_id)] as IUser;
      const label = user?.firstname + ' ' + user.lastname;
      return h('span', null, { default: () => label });
    },
  },
  {
    title: 'Country',
    key: 'country',
    render(row: ILog) {
      return h(
        NTooltip,
        {
          placement: 'left',
          trigger: 'hover',
        },
        {
          default: () => row?.address || 'Local Network',
          trigger: () =>
            h(
              NTag,
              {
                strong: true,
                tertiary: true,
                // size: 'small',
                // onClick: () => play(row)
              },
              { default: () => row?.country || '🖧' }
            ),
        }
      );
    },
  },
];

onBeforeMount(async () => {
  data.value = await store.get('logs');
  const users = await store.get('users');
  Object.assign(usersHash, store.convertArrayToObject(users));
  isLoaded.value = true;
});
</script>
