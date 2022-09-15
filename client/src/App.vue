<template>
  <n-layout position="absolute">
    <n-layout-header id="nav">
      <router-link to="/" class="nav">Home</router-link>|
      <router-link to="/messages" class="nav">Messages</router-link>|
      <router-link to="/flow" class="nav">Annotations</router-link>|
      <router-link to="/features" class="nav">Features</router-link>|
      <router-link to="/about" class="nav">About</router-link>
    </n-layout-header>
    <n-layout-content style="max-width: 900px; min-height: 500px; margin: auto">
      <n-message-provider>
        <router-view :key="$route.fullPath" />
      </n-message-provider>
    </n-layout-content>
    <n-layout-footer style="margin: 1rem; padding: 1rem">
      <n-space justify="center">
        <n-button text tag="a" href="https://yaskevich.com/" target="_blank">
          <template #icon>
            <n-icon :component="Camera" />
          </template>
          2020–2022 •&nbsp;<strong>Signs</strong>&nbsp;by Alyaxey Yaskevich
        </n-button>
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
