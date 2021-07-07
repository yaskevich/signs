<template>

  <div class="about">
    <!-- <h1>Data</h1> -->
  </div>
  <Paginator :first="pageOffset" :rows="pageRows" :totalRecords="pageCount" :rowsPerPageOptions="pageOptions" @page="onPage($event)"></Paginator>
  <div style="text-align:left; margin:auto;">
    <div v-for="(value, key) in messagesPage" :key="key" class="p-shadow-1 p-p-3 p-d-flex card" style="">
      <div class="p-mr-6" style="">
        <table>
          <tr>
            <td style="font-weight:bold;">№</td>
            <td>{{value["tg_id"]}}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">User</td>
            <td>{{users?.[value.data.from_id?.user_id]?.["firstname"]}}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">Type</td>
            <td>{{value.data["_"]}}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">Date</td>
            <td>{{value.data.date.slice(0, -6)}}</td>
          </tr>
          <tr v-if="value.data.views">
            <td style="font-weight:bold;">Views</td>
            <td>{{value.data["views"]}}</td>
          </tr>
          <tr v-if="value.data.message">
            <td style="font-weight:bold;">Content</td>
            <td style="border:1px dashed red;"><span v-html="value.data.message?.split('\n').join('<br/>')"></span></td>
          </tr>
          <tr v-if="value.data.grouped_id">
            <td style="font-weight:bold;">Group</td>
            <td>{{value.data["grouped_id"]}}</td>
          </tr>
          <tr v-if="value.data.fwd_from">
            <td style="font-weight:bold;">Fwd</td>
            <td>
              {{value.data.fwd_from.from_id?.channel_id}}/{{value.data.fwd_from?.channel_post}}
              <br/>{{value.data.fwd_from.date}}
            </td>
          </tr>
          <!-- <tr>
              <td></td>
              <td>
              </td>
            </tr> -->
        </table>
      </div>
      <div class="p-ml-auto">
        <div class="p-text-right p-mb-2">
          <!-- <Button label="Annotate" class="p-button-outlined p-button-secondary" @click="goToMessage(value.tg_id)" v-if="value.imagepath && value.data['_'] == 'Message'"/> -->
        </div>
        <div>
          <router-link :to="'/message/' + value.tg_id">
            <img :src="'/api/media/thumbs/'+value.imagepath" v-if="value.imagepath" class="image-navi" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
  <Paginator :first="pageOffset" :rows="pageRows" :totalRecords="pageCount" :rowsPerPageOptions="pageOptions" @page="onPage($event)"></Paginator>

</template>
<script>

  import { reactive, ref, onMounted } from 'vue';
  import router from "../router";
  import axios from 'axios';
  export default {
    name: 'Messages',
    setup() {
      const messages = ref([]);
      const users = ref({});
      const pageRows = ref(25);
      const pageOffset = ref(0);
      const pageOptions = [10, 25, 50, 100];
      const pageCount = ref(0);

      const messagesPage = ref([]);
      onMounted(async () => {
        const { data } = await axios.get('/api/messages', { params: { off: 0, batch: pageRows.value } });
        messages.value = data.data;
        pageCount.value = Number(data.count);
        users.value = data.users;
        // console.log(data.users);
        messagesPage.value = messages.value.slice(0, pageRows.value);
        // console.log(messages.value);
      });

      const onPage = async e => {
        console.log(e);
        // console.log(messages.value.length, e.first);
        // messagesPage.value = messages.value.slice(e.first, e.first+ e.rows);
        pageOffset.value = e.first;
        pageRows.value = e.rows;
        const { data } = await axios.get('/api/messages', { params: { off: e.first, batch: e.rows } });
        messagesPage.value = data.data;
      };

      const goToMessage = (id) => {
        router.push('/message/' + id);
      }
      return { messages, messagesPage, onPage, pageRows, pageOptions, pageOffset, users, pageCount, goToMessage, };
    },
    components: {},
  };

</script>

<style>
.image-navi{
  border: 5px double lightgray;
  transition: filter .2s ease-in-out;
 -webkit-filter: grayscale(0%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
 filter: grayscale(0%); /* FF 35+ */
 transform: scale(.8);
}

.image-navi:hover {
  -webkit-filter: grayscale(100%); /* Ch 23+, Saf 6.0+, BB 10.0+ */
  filter: grayscale(100%); /* FF 35+ */
  transform: scale(1);
}

</style>
