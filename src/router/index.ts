import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layout/AppLayout.vue'
import BudgetView from '../views/BudgetView.vue'
import AccountsView from '../views/AccountsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
            path: '/',
            name: 'budget',
            component: BudgetView
        },
        {
            path: '/accounts',
            name: 'accounts',
            component: AccountsView
        },
        {
            path: '/transactions/:account_id',
            name: 'transactions',
            // route level code-splitting
            // this generates a separate chunk (Accounts.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('@/views/TransactionsView.vue')
          }
      ]
    },
  ]
})

export default router
