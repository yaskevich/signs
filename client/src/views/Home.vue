<template>

  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <h1><span class="p-shadow-9 p-p-2">Signs project</span></h1>
    <h3>¡signs are everywhere!</h3>
    <p>
      Click <b>Posts</b> link in page header
    </p>
    <Divider />
    <h4>Stats</h4>
    <div class="p-grid">
      <div class="p-col">Total Messages</div>
      <div class="p-col">{{datum?.messages}}</div>
    </div>

    <div class="p-grid">
      <div class="p-col">...with Photo</div>
      <div class="p-col">{{datum?.photos}}</div>
    </div>

    <div class="p-grid">
      <div class="p-col">...with Annotation</div>
      <div class="p-col p-text-bold" style="color:red;">{{datum?.annotations}}</div>
    </div>

    <h5>Languages</h5>
    <div v-for="(value, key) in datum?.scheme?.languages" :key="key">
      <div class="p-grid">
        <div class="p-col">{{value.replace('TAG-', '')}}</div>
        <div class="p-col p-text-bold" style="color:orange;">{{datum?.languages[key]}}</div>
      </div>
    </div>

    <h5>Features</h5>
    <div v-for="(value, key) in datum?.scheme?.features" :key="key">
      <div class="p-grid">
        <div class="p-col">{{value.replace('TAG-', '')}}</div>
        <div class="p-col p-text-bold" style="color:gray;">{{datum?.features[key]}}</div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">

  import { defineComponent, onBeforeMount, ref, reactive } from 'vue';
  import axios from 'axios';
  export default defineComponent({
    setup() {
      const datum = ref({});

      onBeforeMount(async () => {
        const { data } = await axios.get('/api/stats');
        datum.value = data;
        console.log('stats', data);
      });

      return { datum };
    },
  });

</script>
