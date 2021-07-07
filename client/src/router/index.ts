import { createRouter, createWebHistory, RouteRecordRaw, RouterScrollBehavior,   } from 'vue-router'
import Home from '../views/Home.vue'
import TMessages from '../views/TMessages.vue'
import TMessage from '../views/TMessage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // {
  //   path: '/messages',
  //   name: 'Messages',
  //   component: Messages
  // },
  {
    path: '/messages/:batch?/:page?',
    name: 'TMessages',
    component: TMessages
  },
  {
		path: '/message/:id?',
		name: 'TMessage',
		component: TMessage
	},
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const scrollBehavior: RouterScrollBehavior = (to:any, from:any, savedPosition:any) => {
  if (savedPosition) {
    return savedPosition
  } else {
    return { x: 0, y: 0 }
  }
};

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior
})

export default router
