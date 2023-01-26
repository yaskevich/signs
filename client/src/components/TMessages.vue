<template>
  <div v-if="isLoaded">
    <n-space vertical size="large">
      <n-space justify="center">
        <n-pagination
          :page-sizes="pageOptions"
          :page-slot="5"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker></n-pagination>
      </n-space>
      <n-card v-for="(msg, key) in messagesPage" :key="key" :style="msg?.annotated ? 'background-color:#dff6dd' : ''">
        <template #header>
          <n-space>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag>
                  <template #icon>
                    <n-icon
                      :component="
                        msg?.imagepath
                          ? msg?.eid
                            ? FilePresentOutlined
                            : UploadFileOutlined
                          : msg?.data['_'] === 'Message'
                          ? MessageOutlined
                          : ElectricalServicesOutlined
                      " />
                  </template>
                  {{ msg?.id }}
                </n-tag>
              </template>
              Data Type:
              <template v-if="msg?.eid">
                {{ msg?.data['_'] }}
              </template>
              <template v-else> File </template>
              <br />
              Source: <span v-if="msg?.eid">Telegram #{{ msg?.eid }} </span>
              <span v-else>Direct upload</span>
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag :type="msg?.eid ? 'default' : 'success'">
                  <template #icon>
                    <n-icon :component="PersonOutlineFilled" />
                  </template>
                  <template v-if="msg?.eid">
                    {{ tgUsers?.[msg?.data?.from_id?.user_id]?.['firstname'] || '•' }}
                  </template>
                  <template v-else>
                    {{ users?.[msg?.data?.user]?.username }}
                  </template>
                </n-tag>
              </template>
              User: {{ msg?.eid ? 'Telegram' : 'System' }}
            </n-tooltip>

            <n-tooltip trigger="hover" v-if="msg?.data.meta?.exif">
              <template #trigger>
                <n-tag :color="{ textColor: 'pink' }">
                  <template #icon>
                    <n-icon :component="ImageSearchOutlined" />
                  </template>
                </n-tag>
              </template>
              EXIF
            </n-tooltip>

            <n-tooltip trigger="hover" v-if="msg?.data.meta?.gps">
              <template #trigger>
                <n-tag :color="{ textColor: 'pink' }">
                  <template #icon>
                    <n-icon :component="GpsFixedOutlined" />
                  </template>
                </n-tag>
              </template>
              GPS
            </n-tooltip>

            <n-tooltip trigger="hover" v-if="msg?.data?.geo">
              <template #trigger>
                <n-tag :color="{ textColor: 'pink' }">
                  <template #icon>
                    <n-icon :component="MapsHomeWorkOutlined" />
                  </template>
                </n-tag>
              </template>
              {{ msg?.geonote }}
            </n-tooltip>

            <n-tooltip trigger="hover">
              <template #trigger>
                <n-button size="small" quaternary icon-placement="right" @click="showJSON(msg)">
                  <template #icon>
                    <n-icon :component="DataObjectOutlined" />
                  </template>
                </n-button>
              </template>
              Data JSON
            </n-tooltip>
          </n-space>
        </template>
        <template #header-extra>
          <n-space>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-tag>
                  <template #icon>
                    <n-icon :component="CalendarMonthOutlined" />
                  </template>
                  <template v-if="msg?.eid">
                    <template v-if="msg?.data?.fwd_from">
                      {{ msg?.data?.fwd_from?.date?.slice(0, -6) }}
                    </template>
                    <template v-else>
                      {{ msg?.data?.date?.slice(0, -6) }}
                    </template>
                  </template>
                  <template v-else>
                    {{ extractDate(msg?.data?.meta?.image?.ModifyDate || msg.created) }}
                  </template>
                </n-tag>
              </template>
              Timestamp
              <template v-if="msg?.eid">
                <div v-if="msg?.data?.fwd_from">FWD: {{ msg?.data.fwd_from.date.slice(0, -6) }}</div>
                <div>TG: {{ msg?.data?.date?.slice(0, -6) }}</div>
              </template>
              <div v-if="msg?.data?.meta?.image?.ModifyDate">
                EXIF: {{ extractDate(msg.data.meta.image.ModifyDate) }}
              </div>
              <div>DB: {{ extractDate(msg?.created) }}</div>
            </n-tooltip>
          </n-space>
        </template>
        <n-grid :cols="12">
          <n-gi :span="6">
            <n-space vertical>
              <n-space>
                <n-tooltip trigger="hover" v-if="msg?.data?.views">
                  <template #trigger>
                    <n-tag type="info">
                      <template #icon>
                        <n-icon :component="RemoveRedEyeOutlined" />
                      </template>
                      {{ msg?.data['views'] }}</n-tag
                    >
                  </template>
                  Views
                </n-tooltip>

                <n-tooltip trigger="hover" v-if="msg?.data?.grouped_id">
                  <template #trigger>
                    <n-tag type="success">
                      <template #icon>
                        <n-icon :component="ViewListOutlined" />
                      </template>
                    </n-tag>
                  </template>
                  Group {{ msg.data['grouped_id'] }}
                </n-tooltip>

                <n-tooltip trigger="hover" v-if="msg?.data?.fwd_from">
                  <template #trigger>
                    <n-tag type="warning" quaternary>
                      <template #icon>
                        <n-icon :component="ForwardToInboxOutlined" />
                      </template>
                      {{ msg.data.fwd_from.from_id?.channel_id }}
                    </n-tag>
                  </template>
                  Forwarded post: {{ msg.data.fwd_from.from_id?.channel_id }}/{{ msg.data.fwd_from?.channel_post }}
                </n-tooltip>
              </n-space>

              <n-space v-if="msg?.annotated">
                <n-tooltip trigger="hover" v-for="nmbr in Number(msg.annotated)">
                  <template #trigger>
                    <n-icon :component="TextsmsOutlined" color="darkred" :size="24" />
                  </template>
                  Annotation #{{ nmbr }}
                </n-tooltip>
              </n-space>

              <div v-if="msg?.data?.message">
                <!-- <div style="border: 1px dashed gray; padding: 5px"> -->
                <span v-html="msg.data.message?.split('\n').join('<br/>')"></span>
                <!-- </div> -->
              </div>
              <div v-if="msg?.data?.title">
                <!-- <div style="border: 1px dashed gray; padding: 5px"> -->
                {{ msg.data.title }}
                <!-- </div> -->
              </div>
              <n-popconfirm @positive-click="removeImage(msg)" v-if="!msg?.eid">
                <template #trigger>
                  <n-button type="error"> Delete </n-button>
                </template>
                <span>
                  You are going to remove this image and all its metadata stored in the database. <br />The operation
                  cannot be undone.
                </span>
              </n-popconfirm>
            </n-space>
          </n-gi>
          <n-gi :span="6">
            <div style="text-align: right">
              <router-link :to="'/datum/' + msg?.id">
                <img
                  :src="'/api/media/thumbnails/' + msg.imagepath + '?jwt=' + store?.state?.token"
                  @contextmenu.prevent="onRightClick"
                  v-if="msg?.imagepath"
                  class="image-navi" />
              </router-link>
            </div>
          </n-gi>
        </n-grid>
      </n-card>
      <n-space justify="center">
        <n-pagination
          :page-slot="5"
          :page-sizes="pageOptions"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker></n-pagination>
      </n-space>
    </n-space>
  </div>
  <div v-else style="text-align: center">...loading</div>
  <n-modal v-model:show="showModal" style="max-width: 600px">
    <div>
      <!-- <n-button @click="showModal = false">edqw</n-button> -->
      <!-- <n-card style="width: 600px" :bordered="false" size="huge" role="dialog" aria-modal="true"> -->
      <json-viewer :value="dataObject"></json-viewer>
      <!-- </n-card> -->
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import store from '../store';
import {
  ImageOutlined,
  FilePresentOutlined,
  NumbersOutlined,
  PersonOutlineFilled,
  CalendarMonthOutlined,
  RemoveRedEyeOutlined,
  DataObjectOutlined,
  MapsHomeWorkOutlined,
  GpsFixedOutlined,
  ImageSearchOutlined,
  UploadFileOutlined,
  AttachFileOutlined,
  ElectricalServicesOutlined,
  TextsmsOutlined,
  MessageOutlined,
  ViewListOutlined,
  ForwardToInboxOutlined,
} from '@vicons/material';
import { useMessage } from 'naive-ui';

const router = useRouter();
const message = useMessage();
const isLoaded = ref(false);
const messagesPage = ref<Array<IMessage>>([]);
const tgUsers = ref({} as IUsersDict);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);
const pageSize = ref(25);
const totalCount = ref(0);
const users = reactive({} as IUsersDict);
const showModal = ref(false);
const dataObject = ref({});

const removeImage = async (info: IMessage) => {
  if (info?.id) {
    const data = await store.post('unload', { id: info.id });
    // console.log(data);
    if (data?.img === info.imagepath) {
      messagesPage.value.splice(
        messagesPage.value.findIndex(x => x.id === info.id),
        1
      );
      message.success('Image was removed');
    } else {
      message.error(data?.msg || 'Unknown error');
    }
  } else {
    message.error('ID error');
  }
};

const extractDate = (timestamp: string) => {
  // console.log(timestamp);
  if (timestamp) {
    const theDate = new Date(timestamp);
    const d = theDate.toLocaleString('en-GB', {
      timeZoneName: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    // console.log(d);
    return (
      d.substring(6, 10) +
      '-' +
      d.substring(3, 5) +
      '-' +
      d.substring(0, 2) +
      ' ' +
      d.substring(12, 20) +
      ' (' +
      d.substring(24, 26) +
      ')'
    );
  }
};

const vuerouter = useRoute();
const pageIn = Number(vuerouter?.params?.page);
if (pageIn) {
  currentPage.value = pageIn;
}

const batchIn = Number(vuerouter?.params?.batch);
if (batchIn) {
  pageSize.value = batchIn;
}

const getPages = async () => {
  const offset = pageSize.value * (currentPage.value - 1);
  // const { data } = await axios.get('/api/messages', { params: { off: offset, batch: pageSize.value } });
  const data = await store.get('messages', null, { off: offset, batch: pageSize.value });
  messagesPage.value = data.data;
  // console.log(data.data);
  // console.log('get data');
  // router.push(`/data/${pageSize.value}/${currentPage.value || ''}`);
  return data;
};

onBeforeRouteUpdate(async (to, from) => {
  console.log('update route', from.fullPath, '→', to.fullPath);
  if (to?.params?.page) {
    // console.log('-> update params');
    currentPage.value = Number(to.params.page);
    pageSize.value = Number(to.params.batch);
  }
  if (from?.params?.page) {
    // console.log('-> call update');
    await getPages();
  }
});

const onRightClick = () => {
  console.log('right click');
};

onBeforeMount(async () => {
  console.log('mount');
  const datum = await getPages();
  totalCount.value = Number(datum.count);
  tgUsers.value = datum.users;
  const data = await store.get('users');
  Object.assign(users, store.convertArrayToObject(data));
  isLoaded.value = true;
  router.replace(`/data/${pageSize.value}/${currentPage.value || ''}`);
});

const onPageBatchChange = async (i: number) => {
  // console.log("request to change to batch", i);
  // console.log(pageSize.value, i, currentPage.value);
  pageSize.value = i;
  currentPage.value = 1;
  // await getPages();
  router.push(`/data/${pageSize.value}/${currentPage.value || ''}`);
};

const onPageNumberChange = async (i: number) => {
  // console.log("request to change to page", i);
  // console.log(pageSize.value, currentPage.value);
  // await getPages();
  router.push(`/data/${pageSize.value}/${currentPage.value || ''}`);
};

// const goToMessage = (id) => {
//   router.push('/message/' + id);
// }

const showJSON = (msg: IMessage) => {
  // console.log(msg.data);
  dataObject.value = msg.data;
  showModal.value = true;
};
</script>

<style>
.image-navi {
  border: 5px double lightgray;
  transition: filter 0.2s ease-in-out;
  -webkit-filter: grayscale(0%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
  filter: grayscale(0%); /* FF 35+ */
  transform: scale(0.8);
}

.image-navi:hover {
  -webkit-filter: grayscale(100%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
  filter: grayscale(100%); /* FF 35+ */
  transform: scale(1);
}
</style>
