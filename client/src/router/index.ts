import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior } from 'vue-router';
import Home from '../components/Home.vue';
import TMessages from '../components/TMessages.vue';
import TMessage from '../components/TMessage.vue';
import Flow from '../components/Flow.vue';
import Scheme from '../components/Scheme.vue';
import User from '../components/User.vue';
import Users from '../components/Users.vue';
import Upload from '../components/Upload.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
  },
  {
    path: '/scheme',
    name: 'Scheme',
    component: Scheme,
  },
  {
    path: '/users',
    name: 'Users',
    component: Users,
  },
  {
    path: '/user/:id?',
    name: 'User',
    component: User,
  },
  // {
  //   path: '/messages',
  //   name: 'Messages',
  //   component: Messages
  // },
  {
    path: '/messages/:batch?/:page?',
    name: 'TMessages',
    component: TMessages,
  },
  {
    path: '/message/:id?',
    name: 'TMessage',
    component: TMessage,
  },
  {
    path: '/flow/:batch?/:page?',
    name: 'Flow',
    component: Flow,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../components/About.vue'),
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
