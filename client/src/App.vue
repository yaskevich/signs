<template>
  <n-layout position="absolute">
    <n-layout-header id="nav">
      <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" />
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
import { ThumbsUpRegular, Camera, Bars, Faucet, ObjectGroupRegular, Sitemap, Home } from '@vicons/fa';
import router from './router';
import { RouterLink, useRoute } from 'vue-router';
import { h, Component, ref, reactive, onBeforeMount, onMounted, computed, watch } from 'vue';
import { MenuOption, NIcon } from 'naive-ui';

const vuerouter = useRoute();
const activeKey = ref<string | null>(null); // vuerouter?.name||'Home'

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const makeItem = (name: string, title: string, icon: Component) => ({
  label: () => h(RouterLink, { to: { name: name } }, { default: () => title }),
  key: name,
  icon: renderIcon(icon),
});

const menuOptions: MenuOption[] = reactive([
  makeItem('Home', 'Home', Home),
  makeItem('TMessages', 'Messages', Faucet),
  makeItem('Flow', 'Objects', ObjectGroupRegular),
  makeItem('Features', 'Features', Sitemap),
]);

onMounted(async () => {
  activeKey.value = String(vuerouter.name);
});
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
