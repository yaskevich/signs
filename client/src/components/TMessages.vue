<template>
  <div v-if="isLoaded">
    <n-space vertical size="large">
      <n-space justify="center">
        <n-pagination
          :page-sizes="pageOptions"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker
        ></n-pagination>
      </n-space>

      <n-card
        :title="`${value['tg_id']}`"
        v-for="(value, key) in messagesPage"
        :key="key"
        :style="value.annotations && value.annotations.length ? 'background-color:#dff6dd' : ''"
      >
        <n-grid x-gap="12" :cols="12" >
          <n-gi :span="9">
          <table>
            <tr>
              <td style="font-weight:bold;">User</td>
              <td>{{ users?.[value.data.from_id?.user_id]?.["firstname"] }}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Type</td>
              <td>{{ value.data["_"] }}</td>
            </tr>
            <tr>
              <td style="font-weight:bold;">Date</td>
              <td>{{ value.data.date.slice(0, -6) }}</td>
            </tr>
            <tr v-if="value.data.views">
              <td style="font-weight:bold;">Views</td>
              <td>{{ value.data["views"] }}</td>
            </tr>
            <tr v-if="value.data.message">
              <td
                style="font-weight:bold;"
              >{{ value.annotations && value.annotations.length ? "Ann." : "Content" }}</td>
              <td
                v-if="value.annotations && value.annotations.length"
                style="border:1px double gold;"
              >
                <!-- <div  v-for="item of value.an" v-html="item.body[0].value.split('\n').join('<br/>')"></div> -->
                <div
                  v-for="item of value.annotations"
                  style="max-width: 500px"
                  v-html="item.body?.filter(x => x.purpose == 'commenting' && x.value.substring(0, 4) != 'TAG-').map(x => x.value) || 'ERROR: ' + '|' + JSON.stringify(item) + '|'"
                ></div>
              </td>
              <td v-else style="border:1px dashed gray;">
                <span v-html="value.data.message?.split('\n').join('<br/>')"></span>
              </td>
            </tr>
            <tr v-if="value.data.grouped_id">
              <td style="font-weight:bold;">Group</td>
              <td>{{ value.data["grouped_id"] }}</td>
            </tr>
            <tr v-if="value.data.fwd_from">
              <td style="font-weight:bold;">Fwd</td>
              <td>
                {{ value.data.fwd_from.from_id?.channel_id }}/{{ value.data.fwd_from?.channel_post }}
                <br />
                {{ value.data.fwd_from.date.slice(0, -6) }}
              </td>
            </tr>
          </table>
          </n-gi>
          <n-gi :span="3">
           <router-link :to="'/message/' + value.tg_id">
          <img
            :src="'/api/media/thumbs/' + value.imagepath"
            v-if="value.imagepath"
            class="image-navi"
          />
        </router-link>         
          </n-gi>
        </n-grid>
      </n-card>
      <n-space justify="center">
        <n-pagination
          :page-sizes="pageOptions"
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          @update:page="onPageNumberChange"
          @update:page-size="onPageBatchChange"
          :item-count="totalCount"
          show-size-picker
        ></n-pagination>
      </n-space>
    </n-space>
  </div>
  <div v-else style="text-align:center">...loading</div>
</template>

<script setup lang="ts">
import { reactive, ref, onBeforeMount } from 'vue';
import router from "../router";
import { useRoute } from 'vue-router';
import axios from 'axios';

const isLoaded = ref(false);
const messagesPage = ref<Array<IMessage>>([]);
const users = ref({} as IUsersDict);
const pageOptions = [10, 25, 50, 100];
const currentPage = ref(1);
const pageSize = ref(25);
const totalCount = ref(0);


const vuerouter = useRoute();
const pageIn = Number(vuerouter.params.page);
if (pageIn) {
  currentPage.value = pageIn;
}

const batchIn = Number(vuerouter.params.batch);
if (batchIn) {
  pageSize.value = batchIn;
}


const getPages = async () => {
  const offset = pageSize.value * (currentPage.value - 1);
  const { data } = await axios.get('/api/messages', { params: { off: offset, batch: pageSize.value } });
  messagesPage.value = data.data;
  // console.log(data.data);
  router.replace(`/messages/${pageSize.value}/${(currentPage.value || '')}`);
  return data;
};

onBeforeMount(async () => {
  const datum = await getPages();
  totalCount.value = Number(datum.count);
  users.value = datum.users;
  isLoaded.value = true;

});

const onPageBatchChange = async (i: number) => {
  // console.log("request to change to batch", i);
  // console.log(pageSize.value, i, currentPage.value);
  pageSize.value = i;
  currentPage.value = 1;
  await getPages();
};

const onPageNumberChange = async (i: number) => {
  // console.log("request to change to page", i);
  // console.log(pageSize.value, currentPage.value);
  currentPage.value = i;
  await getPages();
};

// const goToMessage = (id) => {
//   router.push('/message/' + id);
// }
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
