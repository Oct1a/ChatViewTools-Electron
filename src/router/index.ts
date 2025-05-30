import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 