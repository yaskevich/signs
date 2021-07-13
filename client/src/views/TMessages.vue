<template>

  <div class="about">
    <!-- <h1>Data</h1> -->
  </div>
  <Paginator :first="pageOffset" :rows="pageRows" :totalRecords="totalCount" :rowsPerPageOptions="pageOptions" @page="onPage($event)"></Paginator>
  <div style="text-align:left; margin:auto;">
    <div v-for="(value, key) in messagesPage" :key="key" class="p-shadow-1 p-p-3 p-d-flex card" :style="value.annotations && value.annotations.length? 'background-color:#dff6dd': ''">
      <div class="p-mr-6">
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
            <td style="font-weight:bold;">{{value.annotations && value.annotations.length ? "Ann.": "Content"}}</td>
            <td v-if="value.annotations && value.annotations.length" style="border:1px double gold;">
              <!-- <div  v-for="item of value.annotations" v-html="item.body[0].value.split('\n').join('<br/>')"></div> -->
              <div  v-for="item of value.annotations" v-html="item.body[0]?.value||'ERROR: '+'|'+JSON.stringify(item) + '|'"></div>
            </td>
            <td v-else style="border:1px dashed gray;"><span v-html="value.data.message?.split('\n').join('<br/>')"></span></td>
          </tr>
          <tr v-if="value.data.grouped_id">
            <td style="font-weight:bold;">Group</td>
            <td>{{value.data["grouped_id"]}}</td>
          </tr>
          <tr v-if="value.data.fwd_from">
            <td style="font-weight:bold;">Fwd</td>
            <td>
              {{value.data.fwd_from.from_id?.channel_id}}/{{value.data.fwd_from?.channel_post}}
              <br/>{{value.data.fwd_from.date.slice(0, -6)}}
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
  <Paginator :first="pageOffset" :rows="pageRows" :totalRecords="totalCount" :rowsPerPageOptions="pageOptions" @page="onPage($event)"></Paginator>

</template>
<script>

  import { reactive, ref, onMounted } from 'vue';
  import router from "../router";
  import { useRoute } from 'vue-router';
  import axios from 'axios';
  export default {
    name: 'Messages',
    setup() {
      const messages = ref([]);
      const users = ref({});

      const totalCount = ref(0);
      const pageOptions = [10, 25, 50, 100];


      const vuerouter = useRoute();
      const page = Number(vuerouter.params.page);
      const batch = Number(vuerouter.params.batch);

      // console.log("params", page, batch);

      const pageRows = ref( pageOptions.includes(batch) ? batch: 25 );
      const pageOffset = ref( page  * pageRows.value || 0 );
      const messagesPage = ref([]);

      onMounted(async () => {
        const { data } = await axios.get('/api/messages', { params: { off: pageOffset.value, batch: pageRows.value } });
        messages.value = data.data;
        totalCount.value = Number(data.count);
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
        router.replace('/messages/' + e.rows + '/' + (e.page||''));
      };

      const goToMessage = (id) => {
        router.push('/message/' + id);
      }
      return { messages, messagesPage, onPage, pageRows, pageOptions, pageOffset, users, totalCount, goToMessage, };
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
