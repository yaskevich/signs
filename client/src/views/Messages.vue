<template>

  <div class="about">
    <!-- <h1>Data</h1> -->
  </div>
  <div style="text-align:left; margin:auto;">
  <div v-for="(value, key) in messages.data" :key="key" class="p-shadow-9" style="border: 1px solid gray;">
    <table>
      <tr><td style="font-weight:bold;">№</td><td>{{value["tg_id"]}}</td></tr>
      <tr><td style="font-weight:bold;">Type</td><td>{{value.data["_"]}}</td></tr>
      <tr><td style="font-weight:bold;">Date</td><td>{{value.data.date.slice(0, -6)}}</td></tr>
      <tr><td style="font-weight:bold;">Content</td><td style="border:1px dashed red;"><span v-html="value.data.message?.split('\n').join('<br/>')"></span></td></tr>
      <tr><td style="font-weight:bold;">Image</td><td><img :src="'/api/media/thumbs/'+value.imagepath" v-if="value.imagepath"/></td></tr>
    </table>
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
      onMounted(async () => {
        const { data } = await axios.get('/api/messages');
        messages.value = data;
        console.log(data);
      });

      return { messages };
    },
    components: {},
  };

</script>
