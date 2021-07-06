<template>

  <div class="about">
    <!-- <h1>Data</h1> -->
  </div>
  <Paginator :rows="pageRows" :totalRecords="pageCount" :rowsPerPageOptions="pageOptions" @page="onPage($event)"></Paginator>
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
          <!-- <tr>
              <td></td>
              <td>
              </td>
            </tr> -->
        </table>
      </div>
      <div class="p-ml-auto">
        <div class="p-text-right p-mb-2">
          <Button label="Annotate" class="p-button-outlined p-button-secondary" />
        </div>
        <div>
          <img :src="'/api/media/thumbs/'+value.imagepath" v-if="value.imagepath" />
        </div>
      </div>
    </div>
  </div>

</template>
<script>

  import { reactive, ref, onMounted } from 'vue';
  import axios from 'axios';
  export default {
    name: 'Messages',
    setup() {
      const messages = ref([]);
      const users = ref({});
      const pageRows = 25;
      const pageOptions = [25, 100, 500];
      const pageCount = ref(0);

      const messagesPage = ref([]);
      onMounted(async () => {
        const { data } = await axios.get('/api/messages', { params: { off: 0, batch: pageRows } });
        messages.value = data.data;
        pageCount.value = Number(data.count);
        users.value = data.users;
        // console.log(data.users);
        messagesPage.value = messages.value.slice(0, pageRows);
        // console.log(messages.value);
      });

      const onPage = async e => {
        // console.log(e);
        // console.log(messages.value.length, e.first);
        // messagesPage.value = messages.value.slice(e.first, e.first+ e.rows);
        const { data } = await axios.get('/api/messages', { params: { off: e.first, batch: e.rows } });
        messagesPage.value = data.data;
      };
      return { messages, messagesPage, onPage, pageRows, pageOptions, users, pageCount };
    },
    components: {},
  };

</script>
