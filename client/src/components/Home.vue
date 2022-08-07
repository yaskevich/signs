<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <h1>
      <span class="shadow-9 2">Signs project</span>
    </h1>
    <h3>¡signs are everywhere!</h3>
    <p>
      Click
      <b>Posts</b> link in page header
    </p>
    <n-divider></n-divider>
    <div v-if="isLoaded">
      <h4>Stats</h4>
      <div class="grid">
        <div class="col">Total Messages</div>
        <div class="col">{{ datum?.messages }}</div>
      </div>

      <div class="grid">
        <div class="col">...with Photo</div>
        <div class="col">{{ datum?.photos }}</div>
      </div>

      <div class="grid">
        <div class="col">...with Annotation</div>
        <div class="col font-bold" style="color:rgb(255, 0, 162);">{{ datum?.annotations }}</div>
      </div>

      <h5>Languages</h5>
      <div v-for="(value, key) in datum?.scheme?.languages" :key="key">
        <div class="grid">
          <div class="col">{{ value.replace('TAG-', '') }}</div>
          <div class="col font-bold" style="color:orange;">{{ datum?.languages[key] }}</div>
        </div>
      </div>

      <h5>Features</h5>
      <div v-for="(value, key) in datum?.scheme?.features" :key="key">
        <div class="grid">
          <div class="col">{{ value.replace('TAG-', '') }}</div>
          <div class="col font-bold" style="color:gray;">{{ datum?.features[key] }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, reactive, onBeforeMount } from 'vue';
import axios from 'axios';

const isLoaded = ref(false);
const datum = reactive({} as IStats);

onBeforeMount(async () => {
  const { data } = await axios.get('/api/stats');
  Object.assign(datum, data);
  console.log('stats', data);
  isLoaded.value = true;
});

</script>
