<template>
  <n-layout position="absolute">
    <n-layout-header id="nav">
      <router-link to="/" class="nav">Home</router-link>|
      <router-link to="/messages" class="nav">Posts</router-link>|
      <router-link to="/about" class="nav">About</router-link>
    </n-layout-header>
    <n-layout-content style="max-width:900px;margin: auto;">
      <router-view />
    </n-layout-content>
    <n-layout-footer style="margin: 1rem">
      <n-space justify="center">
        <n-icon :component="Camera" />&nbsp;
        <span style="font-variant: small-caps;">Signs Project</span>
        2020–2022 ● Made by
        <n-button text tag="a" href="https://yaskevich.com/" target="_blank">Alyaxey Yaskevich</n-button>with
        <n-icon :component="ThumbsUpRegular" />
      </n-space>
    </n-layout-footer>
  </n-layout>
</template>
<script setup lang="ts">
import { ThumbsUpRegular, Camera } from '@vicons/fa';

</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;
  text-align: center;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}

.nav {
  margin-right: 5px;
}
#content {
  display: flex;
  flex-direction: column;
  min-height: 97vh;
  max-width: 100vh;
  /* max-width: 800px; */
  margin: auto;
}
</style>
