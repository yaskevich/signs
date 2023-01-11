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
                <n-icon :component="CameraAltFilled" />
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
// import { Faucet, ObjectGroupRegular } from '@vicons/fa';
import {
  SelectAllOutlined,
  AccountTreeOutlined,
  HomeOutlined,
  CommentOutlined,
  TextSnippetOutlined,
  SettingsOutlined,
  PersonOutlined,
  PermMediaOutlined,
  AssignmentOutlined,
  LabelOutlined,
  BackupOutlined,
  HistoryOutlined,
  PersonSearchOutlined,
  LogOutOutlined,
  EditNoteOutlined,
  MenuBookOutlined,
  ReceiptLongOutlined,
  FormatPaintOutlined,
  WebOutlined,
  CameraAltFilled,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  ListAltOutlined,
  InputOutlined,
} from '@vicons/material';
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
const menuOptions = ref<MenuOption[]>();

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const makeItem = (name: string, title: string, icon: Component) => ({
  label: () => h(RouterLink, { to: { name } }, { default: () => title }),
  key: name,
  icon: renderIcon(icon),
});

const processMenu = async (key: string, item: MenuOption) => {
  if (key === 'logout') {
    store.logoutUser();
  } else if (key === 'profile') {
    router.push(`/user/${store?.state?.user?.id}`);
  }
};

const makeMenu = () => [
  makeItem('Home', 'Home', HomeOutlined),
  makeItem('TMessages', 'Input', InputOutlined),
  makeItem('Flow', 'Objects', SelectAllOutlined),
  {
    label: 'Management',
    key: 'management',
    icon: renderIcon(SettingsOutlined),
    children: [
      makeItem('Upload', 'Upload', CloudUploadOutlined),
      makeItem('Scheme', 'Scheme', AccountTreeOutlined),
      makeItem('Users', 'Users', PersonSearchOutlined),
      makeItem('Settings', 'Settings', ListAltOutlined),
    ],
  },
  {
    label: store?.state?.user?.username,
    key: 'username',
    disabled: false,
    icon: renderIcon(PersonOutlined),
    children: [
      {
        label: 'Log out',
        key: 'logout',
        disabled: false,
        icon: renderIcon(LogOutOutlined),
      },
      {
        label: 'Edit profile',
        key: 'profile',
        disabled: false,
        icon: renderIcon(EditNoteOutlined),
      },
    ],
  },
];

onMounted(async () => {
  await store.getUser();
  if (store?.state?.user?.username) {
    menuOptions.value = makeMenu();
    activeKey.value = String(vuerouter.name);
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
.left {
  text-align: left;
}

.minimal {
  max-width: 600px;
  margin: auto;
}
</style>
