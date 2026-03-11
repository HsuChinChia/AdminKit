# Vue 3 + Vite + Tailwind + Supabase 管理系統模板

一套**通用可複用**的管理系統模板，適合面試展示或快速接案。技術棧：Vue 3 Composition API、Pinia、Vue Router、Tailwind CSS、Supabase。所有 CRUD、Auth、檔案上傳邏輯皆封裝為組合式函數，換案子只需改業務資料，不必重寫基礎設施。

---

## 注意事項

> [!IMPORTANT]
> **Supabase 憑證**：目前使用占位符環境變數。待您在 [supabase.com](https://supabase.com) 建立新專案後，將 URL 與 Anon Key 填入 `.env` 即可連接後端。

> [!NOTE]
> **SQL 腳本**：`profiles` 資料表觸發器與 Storage 儲存桶策略會以 `.sql` 檔提供在 `supabase/migrations/`，需手動貼到 Supabase SQL Editor 執行一次。

> [!NOTE]
> **Google OAuth**：在 Supabase Dashboard → Authentication → Providers → Google 啟用並填入 Google Cloud Console 的 Client ID / Secret，無需修改程式碼。

---

## 擬議變更

### 模組一：專案腳手架

#### [新增] 專案根目錄 `d:/nick/supabase/`

透過 `npm create vite@latest` 初始化，模板選 `vue`。

**主要依賴套件：**
| 套件 | 用途 |
|---|---|
| `vue-router@4` | 用戶端路由 |
| `pinia` | 狀態管理 |
| `@supabase/supabase-js` | Supabase 客戶端 |
| `@headlessui/vue` | 無樣式可訪問性 UI 原語 |
| `lucide-vue-next` | Icon 圖示庫 |
| `vue-chartjs` + `chart.js` | 儀表板圖表 |
| `tailwindcss` + `postcss` + `autoprefixer` | 樣式系統 |

**資料夾結構：**
```
src/
├── components/
│   ├── ui/          # 原子元件（Button、Input、Badge、Modal）
│   ├── layout/      # AppShell、Sidebar、Topbar、Breadcrumb
│   ├── data/        # DataTable、DataForm（通用 CRUD 元件）
│   ├── charts/      # LineChart、BarChart、DoughnutChart
│   └── common/      # AvatarUpload、FileUpload、Toast
├── composables/     # useCRUD、useRealtime、useAuth、useUpload
├── lib/             # supabase.js 客戶端單例
├── router/          # index.js + guards.js
├── stores/          # auth.js、ui.js、notifications.js
├── views/
│   ├── auth/        # LoginView、RegisterView、ForgotPasswordView
│   ├── dashboard/   # DashboardView
│   └── admin/       # UsersView（通用 CRUD 範例頁）
├── App.vue
└── main.js
supabase/
└── migrations/      # 001_profiles.sql、002_storage.sql
```

---

### 模組二：身份驗證與角色權限

#### [新增] `src/lib/supabase.js`
讀取 `.env` 環境變數，匯出 Supabase 單例客戶端。

#### [新增] `src/stores/auth.js`
Pinia Store，管理：`user`、`profile`、`role`、Session 載入、`signIn`、`signInWithGoogle`、`signOut`、`resetPassword`。

#### [新增] `src/router/index.js` + `src/router/guards.js`
- 未登入訪問需登入路由 → 跳轉 `/login`
- 已登入訪問 `/login` → 跳轉 `/dashboard`
- `meta.requiresAdmin` → 非 admin 顯示 403

#### [新增] `src/views/auth/LoginView.vue`
電子郵件密碼登入 + Google OAuth 按鈕。採用 Headless UI Transition 入場動畫。

#### [新增] `src/views/auth/RegisterView.vue` / `ForgotPasswordView.vue`
標準表單流程。

#### [Customer Support]
Additional CRUD operations for contacts within the Customer Detail view.

#### [MODIFY] [CustomerDetailView.vue](file:///d:/nick/supabase/src/views/crm/CustomerDetailView.vue)
- Add "Edit" button for contacts.
- Fix "Delete" button visibility by adding `group` class.
- Update modal logic to support editing.
- Add "Edit Customer" form logic.

---
#### [新增] `supabase/migrations/001_profiles.sql`
```sql
-- profiles 資料表（連結 auth.users）
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- 新用戶自動建立 profile
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
create policy "用戶可查看自己的 profile"   on profiles for select using (auth.uid() = id);
create policy "用戶可更新自己的 profile"   on profiles for update using (auth.uid() = id);
create policy "管理員可查看所有 profile"   on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
```

---

### 模組三：應用殼層與版型

#### [新增] `src/components/layout/AppShell.vue`
主版型：折疊側欄 + 黏性頂欄 + `<router-view>` 插槽。

#### [新增] `src/components/layout/Sidebar.vue`
- Lucide 圖示 + 路由名稱導航連結
- 高亮當前路由（`router-link-active`）
- 手機版折疊為僅顯示圖示模式
- Admin-only 連結根據 `authStore.profile.role` 顯示

#### [新增] `src/components/layout/Topbar.vue`
主題切換（深色 / 淺色）、用戶頭像下拉選單（個人資料、登出）、通知鈴鐺。

#### [新增] `src/stores/ui.js`
管理：`theme`（持久化至 `localStorage`）、`sidebarOpen`。

---

### 模組四：CRUD 引擎

#### [新增] `src/composables/useCRUD.js`
```js
// 使用方式
const { items, loading, error, fetch, create, update, remove } = useCRUD('table_name')
```
泛型組合式函數，封裝 Supabase select / insert / update / delete，含響應式狀態。

#### [新增] `src/composables/useRealtime.js`
```js
// 使用方式
useRealtime('table_name', { onInsert, onUpdate, onDelete })
```
訂閱 Supabase Realtime 頻道，資料庫事件觸發回調，並推送 Toast 通知。

#### [新增] `src/components/data/DataTable.vue`
Props：`columns`（欄位定義陣列）、`rows`（資料陣列）、`loading`、`paginate`。
功能：用戶端搜尋 + 排序、伺服器端分頁、行操作插槽。

#### [新增] `src/components/data/DataForm.vue`
Props：`fields`（欄位配置陣列）、`modelValue`（v-model）。
根據欄位 `type` 自動渲染 text、select、textarea、date 輸入元件。

#### [新增] `src/components/common/Toast.vue`
固定右下角 Toast 容器，支援 `success`、`error`、`info` 類型，進出場動畫。

---

### 模組五：檔案儲存

#### [新增] `src/composables/useUpload.js`
通用上傳組合式函數：接受 `bucket`、`file`，返回 `{ progress, url, upload(), remove() }`。

#### [新增] `src/components/common/AvatarUpload.vue`
圓形頭像預覽 + 點擊上傳，含進度環動畫。

#### [新增] `src/components/common/FileUpload.vue`
拖放 + 點擊上傳區，支援 PDF、圖片，含進度條。

#### [新增] `supabase/migrations/002_storage.sql`
```sql
-- 建立儲存桶（在 Supabase Dashboard > Storage 或 SQL Editor 執行）
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "用戶可上傳自己的頭像" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "頭像公開讀取" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "文件僅本人可讀" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

### 模組六：儀表板與圖表

#### [新增] `src/views/dashboard/DashboardView.vue`
- KPI 卡片列：今日營收、新增會員、待處理訂單、完成率
- 雙欄圖表區：折線圖（營收趨勢）+ 甜甜圈圖（訂單狀態）
- 底部：最近活動 DataTable

#### [新增] `src/components/charts/LineChart.vue` / `BarChart.vue` / `DoughnutChart.vue`
vue-chartjs 封裝。接受 `labels` + `datasets` props，自動響應深色 / 淺色主題。

---

## 驗證計畫

### 自動化 / Dev Server
```powershell
cd d:\nick\supabase
npm run dev
```
- 確認 Dev Server 在 `http://localhost:5173` 無編譯錯誤啟動

### 手動驗證（瀏覽器）

| 功能 | 驗證步驟 |
|---|---|
| **Auth 流程** | 開啟首頁 → 自動跳轉 `/login` → 註冊帳號 → 跳轉 `/dashboard` → 登出 → 回到 `/login` |
| **RBAC** | 在 Supabase 將用戶 role 設為 `admin` → 登入後側欄出現管理員專屬連結 |
| **DataTable** | 搜尋過濾、欄位排序、換頁均正常 |
| **Realtime** | 雙視窗開啟，一窗插入資料，另一窗右下角出現 Toast 通知 |
| **檔案上傳** | 上傳頭像 → 進度環填滿 → 頭像更新；上傳 PDF → 進度條完成 |
| **Dashboard** | 圖表在深色 / 淺色模式下均正確渲染 |
