# AdminKit Pro

> 企業級後台管理系統模板 · Vue 3 + Supabase + Tailwind CSS

**Live Demo → [adminkit.seanhsu097.xyz](https://adminkit.seanhsu097.xyz)**

---

## ✨ 功能特色

| 類別 | 功能 |
|------|------|
| 🔐 **認證** | Email 登入、Google OAuth、忘記密碼、註冊流程 |
| 👥 **RBAC 權限** | 角色管理、細粒度權限控制（e.g. `customers:view`, `users:delete`） |
| 📊 **儀表板** | KPI 卡片、折線圖、圓餅圖、長條圖、待辦事項 Widget |
| 🏢 **CRM 模組** | 客戶管理、聯絡人、銷售漏斗（看板）、合約文件、客服派單 |
| 📋 **稽核日誌** | 自動記錄所有 INSERT/UPDATE/DELETE，支持合規需求 |
| 🖼️ **檔案儲存** | 頭像上傳、工單照片上傳（Supabase Storage） |
| 🎨 **UI/UX Pro Max** | 磨砂玻璃（Glassmorphism）、骨架屏、亮/暗雙主題、Shimmer 動畫 |
| ⚡ **即時推播** | Supabase Realtime 訂閱（新用戶通知） |

---

## 🛠 技術棧

```
前端         Vue 3 (Composition API) + TypeScript + Vite
樣式         Tailwind CSS v3 + 自訂 Premium 設計系統
狀態管理     Pinia
路由         Vue Router 4 (含 Navigation Guard / RBAC 守衛)
圖表         Chart.js + vue-chartjs
圖示         Lucide Vue Next
後端         Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
```

---

## 📁 專案結構

```
src/
├── assets/         全域 CSS（骨架屏、Glass effect、組件樣式）
├── components/
│   ├── common/     通用組件 (DataTable, AvatarUpload, SkeletonLoader...)
│   ├── charts/     圖表組件 (Line, Bar, Doughnut)
│   ├── crm/        CRM 專用組件 (TaskWidget)
│   └── layout/     版面組件 (AppShell, Sidebar, Topbar)
├── composables/    可重用邏輯 (useCRUD, useRealtime, usePagination)
├── router/         路由定義與 RBAC 守衛
├── stores/         Pinia Stores (auth, ui, notifications)
└── views/
    ├── auth/       登入、註冊、忘記密碼
    ├── admin/      用戶、角色、設定、稽核日誌
    ├── crm/        客戶、看板、合約、派單
    └── dashboard/  儀表板
supabase/
├── functions/      Edge Functions (create-user, update-user)
└── migrations/     資料庫 Migration SQL (001 ~ 009)
```

---

## 🚀 快速開始

### 1. Clone & Install

```bash
git clone https://github.com/your-username/adminkit.git
cd adminkit
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 建立資料庫

在 [Supabase Dashboard SQL Editor](https://supabase.com/dashboard) 依序執行：

```
supabase/migrations/001_auth_profiles.sql
supabase/migrations/002_storage.sql
supabase/migrations/003_crm_customers.sql
supabase/migrations/004_crm_deals.sql
supabase/migrations/005_crm_activities.sql
supabase/migrations/006_crm_contracts.sql
supabase/migrations/007_crm_tickets.sql
supabase/migrations/009_audit_logs.sql
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

---

## 🏗 架構亮點

### useCRUD — 通用 CRUD Composable

```typescript
// 一行即可獲得完整的 CRUD + 搜尋 + 排序 + 分頁
const { items, loading, fetch, create, update, remove } = useCRUD<Customer>('customers')
```

### RBAC 權限系統

```typescript
// 細粒度 Permission Check
auth.hasPermission('customers:delete')  // → true / false

// Router Guard 自動保護路由
{ path: '/admin/audit', meta: { permissions: ['audit:view'] } }
```

### 稽核日誌 — 資料庫層自動記錄

```sql
-- PostgreSQL Trigger 自動捕捉所有操作
CREATE TRIGGER audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();
```

---

## 📸 截圖預覽

> *請參閱 Live Demo 查看完整互動效果*

---

## 📄 License

MIT — 自由使用於個人或商業專案
