<template>
  <n-message-provider>
    <template id="main" v-if="loggedIn">
      <n-layout position="absolute">
        <n-layout-header id="nav">
          <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" @update:value="processMenu" />
        </n-layout-header>
        <n-layout-content style="max-width: 900px; min-height: 500px; margin: auto">
          <router-view :key="$route.fullPath" />
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
    <div v-else style="max-width: 300px; margin: auto">
      <n-tabs
        default-value="signin"
        size="large"
        animated
        justify-content="center"
        style="margin: 0 -4px"
        pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;">
        <n-tab-pane name="signin" tab="Log in">
          <Login />
        </n-tab-pane>
        <n-tab-pane name="signup" tab="Register">
          <Register v-if="settings?.registration_open" />
          <n-h2 v-else>
            <n-text type="warning">Registration is closed.</n-text>
          </n-h2>
        </n-tab-pane>
      </n-tabs>
    </div>
  </n-message-provider>
</template>
<script setup lang="ts">
import { ThumbsUpRegular, Camera, Bars, Faucet, ObjectGroupRegular, Sitemap, Home, User, SignInAlt } from '@vicons/fa';
import router from './router';
import { RouterLink, useRoute } from 'vue-router';
import { h, Component, ref, reactive, onBeforeMount, onMounted, computed, watch } from 'vue';
import { MenuOption, NIcon } from 'naive-ui';
import store from './store';
import Login from './components/Login.vue';
import Register from './components/Register.vue';

const vuerouter = useRoute();
const activeKey = ref<string | null>(null); // vuerouter?.name||'Home'
const loggedIn = computed(() => store?.state?.token?.length);
const settings = ref<ISettings>();
const username = ref(String(store?.state?.user?.username || ''));

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const makeItem = (name: string, title: string, icon: Component) => ({
  label: () => h(RouterLink, { to: { name } }, { default: () => title }),
  key: name,
  icon: renderIcon(icon),
});

const processMenu = (key: string, item: MenuOption) => {
  if (key === 'logout') {
    store.logoutUser();
  }
};

const menuOptions: MenuOption[] = reactive([
  makeItem('Home', 'Home', Home),
  makeItem('TMessages', 'Input', Faucet),
  makeItem('Flow', 'Objects', ObjectGroupRegular),
  makeItem('Features', 'Features', Sitemap),
  {
    label: username,
    key: 'username',
    disabled: false,
    icon: renderIcon(User),
    children: [
      {
        label: 'Log out',
        key: 'logout',
        disabled: false,
        icon: renderIcon(SignInAlt),
      },
    ],
  },
]);

onMounted(async () => {
  await store.getUser();
  if (store?.state?.user?.username) {
    activeKey.value = String(vuerouter.name);
    username.value = String(store?.state?.user?.username);
  } else {
    const { data } = await store.getUnauthorized('settings');
    settings.value = data;
  }
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

    &.router-link-exact-active,
    &.router-link-active {
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
