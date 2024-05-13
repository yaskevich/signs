import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior } from 'vue-router';
// import Home from '../components/Home.vue';
// import TMessages from '../components/TMessages.vue';
// import TMessage from '../components/TMessage.vue';
// import Flow from '../components/Flow.vue';
// import Scheme from '../components/Scheme.vue';
// import User from '../components/User.vue';
// import Users from '../components/Users.vue';
// import Upload from '../components/Upload.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    // component: Home,
    component: () => import('./components/Home.vue'),
  },
  {
    path: '/sets',
    name: 'Sets',
    component: () => import('./components/Sets.vue'),
  },
  {
    path: '/upload',
    name: 'Upload',
    // component: Upload,
    component: () => import('./components/Upload.vue'),
  },
  {
    path: '/scheme',
    name: 'Scheme',
    // component: Scheme,
    component: () => import('./components/Scheme.vue'),
  },
  {
    path: '/users',
    name: 'Users',
    // component: Users,
    component: () => import('./components/Users.vue'),
  },
  {
    path: '/user/:id?',
    name: 'User',
    // component: User,
    component: () => import('./components/User.vue'),
  },
  // {
  //   path: '/messages',
  //   name: 'Messages',
  //   component: Messages
  // },
  {
    path: '/data/:batch?/:page?',
    name: 'TMessages',
    // component: TMessages,
    component: () => import('./components/TMessages.vue'),
  },
  {
    path: '/datum/:id/:object?',
    name: 'Toolset',
    // component: TMessage,
    component: () => import('./components/Toolset.vue'),
  },
  {
    path: '/objects/:batch?/:page?',
    name: 'Flow',
    // component: Flow,
    component: () => import('./components/Flow.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('./components/About.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./components/Settings.vue'),
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('./components/Map.vue'),
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('./components/Logs.vue'),
  },
];

const scrollBehavior: RouterScrollBehavior = async (to: any, from: any, savedPosition: any) => {
  console.log('savedPosition', savedPosition);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (savedPosition) {
        console.log('restore scroll position');
        resolve(savedPosition);
      } else {
        resolve({ top: 0 });
      }
    }, 1500);
  });
};

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior,
});

export default router;
