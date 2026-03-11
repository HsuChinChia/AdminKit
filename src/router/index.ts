import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Auth（公開）─────────────────────────────────────────
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true, title: '登入' },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guestOnly: true, title: '註冊' },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true, title: '忘記密碼' },
    },

    // ── 受保護（需登入）──────────────────────────────────────
    {
      path: '/',
      component: () => import('@/components/layout/AppShell.vue'),
      meta: { requiresAuth: true },
      redirect: '/profile',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue'),
          meta: { title: '儀表板', permissions: ['dashboard:view'] },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: '個人資料', permissions: ['profile:view'] },
        },
        // ── CRM 專屬 ────────────────────────────────────────
        {
          path: 'crm/customers',
          name: 'CRMCustomers',
          component: () => import('@/views/crm/CustomersView.vue'),
          meta: { title: '客戶管理', permissions: ['customers:view'] },
        },
        {
          path: 'crm/customers/:id',
          name: 'CustomerDetail',
          component: () => import('@/views/crm/CustomerDetailView.vue'),
          meta: { title: '客戶詳情', permissions: ['customers:view'] },
        },
        {
          path: 'crm/deals',
          name: 'CRMKanban',
          component: () => import('@/views/crm/DealsKanbanView.vue'),
          meta: { title: '銷售漏斗', permissions: ['deals:view'] },
        },
        {
          path: 'crm/contracts',
          name: 'CRMContracts',
          component: () => import('@/views/crm/ContractsView.vue'),
          meta: { title: '合約與文件', permissions: ['contracts:view'] },
        },
        {
          path: 'crm/tickets',
          name: 'CRMTickets',
          component: () => import('@/views/crm/TicketsView.vue'),
          meta: { title: '客服派單', permissions: ['tickets:view'] },
        },
        // ── Admin 專屬 ──────────────────────────────────────
        {
          path: 'admin/users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { title: '用戶管理', permissions: ['users:view'] },
        },
        {
          path: 'admin/users/create',
          name: 'AdminCreateUser',
          component: () => import('@/views/admin/AdminCreateUserView.vue'),
          meta: { title: '新增用戶', permissions: ['users:create'] },
        },
        {
          path: 'admin/roles',
          name: 'AdminRoles',
          component: () => import('@/views/admin/RolesView.vue'),
          meta: { title: '角色管理', permissions: ['roles:view'] },
        },
        {
          path: 'admin/settings',
          name: 'AdminSettings',
          component: () => import('@/views/admin/SettingsView.vue'),
          meta: { title: '系統設定', permissions: ['settings:view'] }
        }
      ],
    },

    // ── 404 ─────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// ── 導航守衛 ─────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 第一次載入等待 Session 初始化
  if (auth.loading) await auth.init()

  // 未登入 → /login
  if (to.meta.requiresAuth && !auth.isLoggedIn)
    return { name: 'Login', query: { redirect: to.fullPath } }

  // 已登入 → 跳出 Auth 頁
  if (to.meta.guestOnly && auth.isLoggedIn)
    return { name: 'Dashboard' }

  // 檢查權限 (RBAC)
  if (to.meta.permissions) {
    const requiredPerms = to.meta.permissions as string[]
    const hasAccess = requiredPerms.every(p => auth.hasPermission(p))
    if (!hasAccess) return { name: 'Dashboard' }
  }

  // 舊版備用
  if (to.meta.requiresAdmin && !auth.isAdmin)
    return { name: 'Dashboard' }

  document.title = to.meta.title ? `${to.meta.title} — AdminKit` : 'AdminKit'
})

export default router
