# FREMED IT MANAGER — Tài liệu tổng hợp dự án

> **Phiên bản:** v2.0 · **Cập nhật:** Tháng 05/2026
> **Mục đích:** Hệ thống quản lý thiết bị IT nội bộ cho công ty Fremed

---

## 1. TỔNG QUAN KIẾN TRÚC

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER NETWORK: fremed_net (bridge)            │
│                                                                              │
│  ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────────┐    │
│  │  fremed_frontend │    │  fremed_backend  │    │     fremed_db        │    │
│  │  (Vite + React)  │───▶│  (Express.js)    │───▶│  (PostgreSQL 16)    │    │
│  │  Port: 5173      │    │  Port: 3000      │    │  Port: 5432         │    │
│  │  Node 20-alpine  │    │  Node 20-alpine  │    │  postgres:16-alpine │    │
│  └─────────────────┘    │                  │    │                      │    │
│                          │    ┌──────────┐  │    │  Volume:             │    │
│                          │    │ mssqlPool│──│──▶ │  postgres_data       │    │
│                          │    └──────────┘  │    └──────────────────────┘    │
│                          │         │        │                                │
│                          └─────────│────────┘                                │
│                                    │                                         │
│                                    ▼                                         │
│                          ┌──────────────────┐                                │
│                          │  SQL Server       │  (bên ngoài Docker)           │
│                          │  10.1.11.36:1433  │  Database: prod_fremed        │
│                          │  (Qualzen data)   │                               │
│                          └──────────────────┘                                │
│                                                                              │
│  ┌─────────────────┐    ┌──────────────────┐                                │
│  │ fremed_migrate   │    │  fremed_pgadmin  │  Profile: tools                │
│  │ Profile: migrate │    │  Port: 5050      │  (chạy khi cần: --profile)     │
│  │ (chạy 1 lần)    │    │  dpage/pgadmin4  │                                │
│  └─────────────────┘    └──────────────────┘                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Stack công nghệ:**
- Frontend: React 18 + Vite 5 + Tailwind CSS 3 + Axios + Recharts + Socket.io-client
- Backend: Express 4 + PostgreSQL (pg) + JWT + Multer + Mammoth + Socket.io + MSSQL + Ping
- Database chính: PostgreSQL 16 (chạy trong Docker)
- Database phụ: SQL Server (máy chủ nội bộ 10.1.11.36) — chỉ đọc dữ liệu Qualzen
- Containerization: Docker Compose

---

## 2. DOCKER — CHI TIẾT TỪNG CONTAINER

### 2.1 docker-compose.yml — Luồng khởi động

**Thứ tự start:**

```
postgres (healthcheck: pg_isready mỗi 10s, tối đa 5 lần)
    │
    ├── Khi healthy ──▶ backend (depends_on: postgres healthy)
    │                      │
    │                      └──▶ frontend (depends_on: backend)
    │
    └── Khi healthy ──▶ migrate (profile: migrate, chỉ chạy thủ công)
```

Khi chạy `docker-compose up -d`, Docker sẽ:
1. Start `fremed_db` trước
2. Chờ healthcheck pass (~20-30 giây), lúc này terminal hiện "db starting"
3. Start `fremed_backend` sau khi DB healthy
4. Start `fremed_frontend` sau khi backend đã start

**Tại sao DB "lâu nhất":** Không phải DB chậm, mà là Docker chờ healthcheck (pg_isready chạy mỗi 10s × tối đa 5 lần = 50s) trước khi cho phép backend start.

### 2.2 Container: fremed_db (PostgreSQL)

| Thuộc tính | Giá trị |
|-----------|---------|
| Image | postgres:16-alpine |
| Container name | fremed_db |
| Port | 5432:5432 |
| Database | fremed_device |
| User/Pass | fremed / fremed@2025 |
| Volume | postgres_data → /var/lib/postgresql/data |
| Init script | ./scripts/init.sql → /docker-entrypoint-initdb.d/init.sql |

**init.sql chỉ chạy lần đầu tiên** khi volume postgres_data chưa tồn tại. Nếu volume đã có data, Docker bỏ qua init.sql hoàn toàn.

**Quan trọng:** `docker-compose down` KHÔNG xoá volume → data an toàn. Chỉ `docker-compose down -v` mới xoá volume → mất data.

### 2.3 Container: fremed_backend (Express.js)

| Thuộc tính | Giá trị |
|-----------|---------|
| Build context | ./backend, Dockerfile |
| Base image | node:20-alpine + iputils (cho ping) |
| Container name | fremed_backend |
| Port | 3000:3000 |
| CMD | npm run dev (nodemon — auto-restart khi code thay đổi) |
| Volume mount | ./backend:/app (live reload) |
| Volume exclusion | /app/node_modules (dùng node_modules trong container) |

**Environment variables:**
- `DATABASE_URL`: postgresql://fremed:fremed@2025@postgres:5432/fremed_device
- `JWT_SECRET`: fremed_secret_key_2025
- `JWT_EXPIRES_IN`: 8h (token hết hạn sau 8 giờ)
- `NODE_ENV`: development

**cap_add: NET_RAW** — cần thiết để gói `ping` (node module) có quyền gửi ICMP packets trong container.

**extra_hosts: host.docker.internal** — cho phép backend gọi ra máy host (dùng kết nối SQL Server).

### 2.4 Container: fremed_frontend (Vite + React)

| Thuộc tính | Giá trị |
|-----------|---------|
| Build context | ./frontend, Dockerfile |
| Base image | node:20-alpine |
| Container name | fremed_frontend |
| Port | 5173:5173 |
| CMD | npm run dev -- --host 0.0.0.0 |
| Volume mount | ./frontend:/app (hot module reload) |

**Vite proxy config (vite.config.js):**
```
/api/* → http://backend:3000
```
Frontend gọi `/api/devices` → Vite proxy chuyển sang `http://backend:3000/api/devices` (dùng tên container `backend` trong Docker network).

### 2.5 Container: fremed_migrate (Profile: migrate)

**Chỉ chạy khi cần** migrate data từ MySQL dump cũ:
```bash
docker-compose --profile migrate up migrate
```
Đọc file SQL dump từ `./backend/src/db/gagnnyox_device.sql`, parse và insert vào PostgreSQL.

### 2.6 Container: fremed_pgadmin (Profile: tools)

**Chỉ chạy khi cần** quản lý DB trực quan:
```bash
docker-compose --profile tools up pgadmin
```
Truy cập: http://localhost:5050, login: admin@fremed.local / admin123

---

## 3. CẤU TRÚC THƯ MỤC

```
fremed-app/
├── docker-compose.yml          ← Orchestration tất cả containers
├── Dockerfile.migrate          ← Dockerfile cho migration tool
│
├── backend/
│   ├── Dockerfile              ← Build image cho backend
│   ├── package.json            ← Dependencies: express, pg, jwt, bcrypt, multer, ping, mssql, mammoth, pdfkit, xlsx, socket.io
│   ├── uploads/                ← Thư mục lưu file upload (quy trình, phiếu đề nghị)
│   │   ├── quy-trinh/          ← File đính kèm quy trình IT
│   │   └── phieu-de-nghi/      ← (legacy) file PDF phiếu đề nghị
│   └── src/
│       ├── index.js            ← Entry point: Express app, middleware, route mounting
│       ├── db/
│       │   ├── pool.js         ← PostgreSQL connection pool (pg)
│       │   ├── mssqlPool.js    ← SQL Server connection pool (mssql) → 10.1.11.36
│       │   └── gagnnyox_device.sql  ← MySQL dump cũ (dùng cho migrate)
│       ├── middleware/
│       │   └── auth.js         ← JWT authentication middleware
│       ├── services/
│       │   └── pingService.js  ← ICMP ping service (ping 4 gói tin)
│       └── routes/
│           ├── auth.js         ← POST /login, POST /change-password
│           ├── devices.js      ← CRUD /api/devices (thiết bị IT)
│           ├── cardsAndIps.js  ← CRUD /api/cards + /api/ips (thẻ từ + IP tĩnh)
│           ├── lookup.js       ← GET/POST phongban, loaimay, dashboard stats
│           ├── ping.js         ← POST /api/ping/:id (ping 1 thiết bị)
│           ├── quyTrinh.js     ← CRUD quy trình + upload/download/preview file
│           ├── taiKhoan.js     ← CRUD tài khoản thiết bị + import CSV/Excel
│           ├── phieuDeNghi.js  ← CRUD phiếu đề nghị + next-pr auto-increment
│           └── qualzen.js      ← GET action-items từ SQL Server (read-only)
│
├── frontend/
│   ├── Dockerfile              ← Build image cho frontend
│   ├── package.json            ← Dependencies: react, react-router-dom, axios, recharts, socket.io-client, tailwindcss, vite
│   ├── index.html              ← HTML shell (zoom: 1.2, font: Be Vietnam Pro)
│   ├── vite.config.js          ← Vite config + proxy /api → backend:3000
│   ├── tailwind.config.js      ← Tailwind config (custom colors: fremed green)
│   ├── postcss.config.js       ← PostCSS (tailwindcss + autoprefixer)
│   └── src/
│       ├── main.jsx            ← React DOM render entry point
│       ├── App.jsx             ← Router: AuthProvider → BrowserRouter → Routes
│       ├── index.css           ← Global styles + Tailwind layers (btn, input, table, badge, nav...)
│       ├── api/
│       │   └── index.js        ← Axios instance + interceptors + tất cả API functions
│       ├── hooks/
│       │   ├── useAuth.jsx     ← Auth context (token, username, login, logout)
│       │   └── usePing.js      ← WebSocket ping status (socket.io-client)
│       ├── components/
│       │   ├── Layout.jsx      ← Header + Sidebar + Outlet (main layout)
│       │   ├── Modal.jsx       ← Reusable modal component
│       │   └── PingBadge.jsx   ← Online/offline badge component
│       └── pages/
│           ├── Login.jsx       ← Trang đăng nhập
│           ├── Dashboard.jsx   ← Trang tổng quan (stats + charts)
│           ├── Devices.jsx     ← Quản lý thiết bị IT
│           ├── Cards.jsx       ← Quản lý thẻ từ
│           ├── IPs.jsx         ← Quản lý IP tĩnh
│           ├── QuyTrinhIT.jsx  ← Quản lý quy trình IT (upload file)
│           ├── TaiKhoanIT.jsx  ← Quản lý tài khoản thiết bị
│           ├── PhieuDeNghi.jsx ← Phiếu đề nghị mua hàng (tạo + preview + in)
│           └── ActionItems.jsx ← Qualzen Action Items (từ SQL Server)
│
└── scripts/
    ├── init.sql                ← Schema tạo bảng ban đầu (chạy 1 lần bởi Docker)
    ├── migrate.js              ← Script migrate data từ MySQL dump → PostgreSQL
    ├── migrate_new_tabs.sql    ← Migration thêm 3 bảng mới (quy_trinh, tai_khoan_tb, phieu_de_nghi)
    └── migrate_phieu_de_nghi_v2.sql  ← Migration thêm cột so_pr, truong_phong, soat_xet
```

---

## 4. DATABASE SCHEMA

### 4.1 PostgreSQL (fremed_device) — 9 bảng

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│  phongban    │◀────┐│  loaimay    │      │    users     │
│  ─────────  │     ││  ──────────  │      │  ──────────  │
│  id (PK)    │     ││  id (PK)    │      │  id (PK)     │
│  name       │     ││  idban (FK) │──────│  username    │
└──────┬──────┘     │└─────┬───────┘      │  password    │
       │            │      │               │  phongban    │
       │            │      │               │  block (0/1) │
       ▼            │      ▼               └──────────────┘
┌──────────────────┐│┌──────────────────┐
│   device_it      │││   device_card    │   ┌──────────────────┐
│   ────────────   │││   ────────────   │   │   device_ip      │
│   id (PK)        │││   id (PK)        │   │   ────────────   │
│   idmay (FK)  ───┘│   idban (FK)  ───┘   │   id (PK)        │
│   idban (FK)  ────┘   card            │   │   idban (FK)  ───┘
│   name             │   name            │   │   ip             │
│   service_tag      │   created_at      │   │   name           │
│   express_code     │   updated_at      │   │   vlan           │
│   mac_address      └──────────────────┘   │   created_at      │
│   ngay_mua                                 │   updated_at      │
│   details                                  └──────────────────┘
│   tinh_trang
│   ip_address
│   created_at
│   updated_at
└──────┬───────────┐
       │           │
       ▼           │
┌──────────────┐   │   ┌──────────────────┐   ┌──────────────────┐
│ ping_history │   │   │   quy_trinh      │   │  tai_khoan_tb    │
│ ────────────  │   │   │   ──────────     │   │  ──────────────  │
│ id (PK)      │   │   │   id (PK)        │   │  id (PK)         │
│ device_id(FK)│───┘   │   title           │   │  thiet_bi        │
│ ip_address   │       │   description     │   │  tai_khoan       │
│ status       │       │   file_name       │   │  mat_khau        │
│ latency_ms   │       │   file_path       │   │  ghi_chu         │
│ checked_at   │       │   file_type       │   │  created_at      │
└──────────────┘       │   created_at      │   │  updated_at      │
                       │   updated_at      │   └──────────────────┘
                       └──────────────────┘

┌────────────────────────┐
│   phieu_de_nghi        │
│   ──────────────────   │
│   id (PK, SERIAL)      │
│   nguoi_de_nghi        │
│   phong_ban             │
│   so_pr (VD: IT/PR/26016)  ← Migration v2
│   truong_phong          │    ← Migration v2
│   soat_xet              │    ← Migration v2
│   items (JSONB)         │ ← Mảng vật tư: [{ten, dvt, nhu_cau, can_mua, muc_dich, ngay_can}]
│   ngay_can_su_dung      │
│   noi_dung              │
│   file_path             │
│   trang_thai            │
│   created_at            │
│   updated_at            │
└────────────────────────┘
```

**Triggers:** Tất cả bảng có `updated_at` đều có trigger `update_updated_at()` tự động cập nhật khi UPDATE.

**Indexes:**
- device_it: idban, idmay
- device_card: idban
- device_ip: idban
- ping_history: device_id, checked_at DESC

### 4.2 SQL Server (prod_fremed) — Read-only

Backend kết nối đến SQL Server nội bộ (10.1.11.36:1433) chỉ để **đọc** dữ liệu Qualzen Action Items. Không ghi, không sửa.

Bảng sử dụng:
- `QualZen_ActionPlan.ActionPlanMaster` — danh sách action items
- `QualZen_ActionPlan.ActionPlanHistoryStatus` — lookup trạng thái
- `LIMS.vw_UserDetails` — lookup tên nhân viên

---

## 5. LUỒNG AUTHENTICATION

```
                          ┌──────────────────┐
  User nhập              │                  │
  username/password ────▶│  POST /api/auth/ │
                          │  login           │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │ Query: SELECT *   │
                          │ FROM users        │
                          │ WHERE username=$1 │
                          │ AND block=0       │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │ bcrypt.compare()  │
                          │ password vs hash  │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │ jwt.sign({id,     │
                          │   username},      │
                          │   secret, 8h)     │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
  localStorage.setItem   │  Response:        │
  ('token', token) ◀─────│  { token,         │
  ('username', username)  │    username }     │
                          └──────────────────┘
```

**Mọi API call sau đó:**
1. Axios interceptor tự thêm header: `Authorization: Bearer <token>`
2. Middleware `auth.js` verify token bằng `jwt.verify()`
3. Nếu token hết hạn (401) → Axios interceptor xoá localStorage → redirect `/login`

**Default admin:** username=admin, password=Admin@123

---

## 6. LUỒNG REQUEST — TỪ BROWSER ĐẾN DATABASE

```
Browser (localhost:5173)
    │
    │ User click "Thiết bị" → Component Devices.jsx mount
    │ useEffect() gọi getDevices()
    │
    ▼
Axios Instance (frontend/src/api/index.js)
    │ baseURL: '/api'
    │ Interceptor thêm: Authorization: Bearer <token>
    │ Request: GET /api/devices?page=1&limit=50
    │
    ▼
Vite Dev Server (port 5173)
    │ Proxy config: /api/* → http://backend:3000
    │ (backend là tên container trong Docker network)
    │
    ▼
Express Server (port 3000, backend/src/index.js)
    │ app.use('/api/devices', require('./routes/devices'))
    │
    ▼
Auth Middleware (middleware/auth.js)
    │ Verify JWT token
    │ req.user = { id, username }
    │
    ▼
Route Handler (routes/devices.js)
    │ Parse query params (search, idban, idmay, page, limit)
    │ Build WHERE clause
    │
    ▼
PostgreSQL Pool (db/pool.js)
    │ connectionString: postgresql://fremed:fremed@2025@postgres:5432/fremed_device
    │ pool.query('SELECT d.*, p.name... FROM device_it d LEFT JOIN...')
    │
    ▼
PostgreSQL Container (fremed_db)
    │ Execute query, return rows
    │
    ▼
Response: { data: [...], total: 150, page: 1, limit: 50 }
    │
    ▼
React Component setState(rows) → Re-render table
```

---

## 7. FRONTEND — CHI TIẾT TỪNG LỚP

### 7.1 Entry Point & Routing (App.jsx)

```
main.jsx
  └── <App />
       └── <AuthProvider>              ← Context cung cấp token, login, logout
            └── <BrowserRouter>
                 └── <Routes>
                      ├── /login → <Login />
                      ├── / → <PrivateRoute> → <Layout>     ← Kiểm tra token trước
                      │    ├── / (index) → <Dashboard />
                      │    ├── /devices → <Devices />
                      │    ├── /cards → <Cards />
                      │    ├── /ips → <IPs />
                      │    ├── /quy-trinh → <QuyTrinhIT />
                      │    ├── /tai-khoan → <TaiKhoanIT />
                      │    ├── /phieu-de-nghi → <PhieuDeNghi />
                      │    └── /action-items → <ActionItems />
                      └── * → redirect /
```

### 7.2 Layout Component

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER (h-48px, bg: #1c2b41)                                │
│ ☰  FREMED | IT Manager    [Quy trình][Tài khoản][Phiếu][AI]│
│                                        🔍 Tìm kiếm...  👤 admin│
├────────────┬─────────────────────────────────────────────────┤
│ SIDEBAR    │ MAIN CONTENT (<Outlet />)                       │
│ w-210px    │                                                 │
│            │ Nội dung thay đổi theo route                    │
│ Dashboard  │                                                 │
│ Thiết bị   │                                                 │
│ Thẻ từ     │                                                 │
│ IP tĩnh    │                                                 │
│ Quy trình  │                                                 │
│ Tài khoản  │                                                 │
│ Phiếu ĐN   │                                                 │
│ Action Items│                                                 │
│            │                                                 │
│ v2.0       │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

Header có 2 hệ thống navigation:
- **Sidebar** (bên trái): Đầy đủ tất cả 8 menu items
- **Header tabs** (trên cùng): Chỉ 4 tab: Quy trình, Tài khoản, Phiếu đề nghị, Action Items

### 7.3 API Layer (api/index.js)

Tất cả API calls đi qua 1 Axios instance duy nhất:

- **baseURL:** `/api` (Vite proxy sang backend)
- **timeout:** 10 giây
- **Request interceptor:** Tự thêm JWT token từ localStorage
- **Response interceptor:** Nếu 401 → xoá token → redirect /login

Tổng cộng **36 API functions** chia theo module:
- Auth: 2 (login, changePassword)
- Devices: 5 (CRUD + getById)
- Cards: 4 (CRUD)
- IPs: 4 (CRUD)
- Lookup: 5 (phongban, loaimay, dashboard)
- Ping: 3 (status, ping, history)
- Quy trình: 5 (CRUD + file upload)
- Tài khoản: 5 (CRUD + import)
- Phiếu đề nghị: 6 (CRUD + getById + nextPR)
- Qualzen: 2 (action-items, summary)

### 7.4 Styling System (index.css + Tailwind)

Dùng **Tailwind CSS 3** với custom @layer components:

| Class | Mô tả |
|-------|--------|
| .btn-primary | Nút xanh dương (#0052cc), text trắng |
| .btn-secondary | Nút trắng, border xám |
| .btn-icon | Nút icon 28×28px, hover xám |
| .input-field | Input có border, focus ring xanh |
| .data-table | Table full width, border-collapse |
| .th | Header cell: uppercase, 11px, xám đậm |
| .td | Body cell: 12.5px, border dưới nhạt |
| .badge-* | Badge màu (blue, green, red, yellow, gray, teal) |
| .panel | Card trắng, border xám, shadow nhẹ |
| .nav-item | Menu item sidebar |
| .nav-item-active | Active: nền xanh nhạt, text xanh dương |

**Font:** Inter (Google Fonts) cho toàn app, Be Vietnam Pro cho header.

**Zoom:** `body { zoom: 1.2 }` — phóng to 120% toàn bộ giao diện (cả CSS lẫn index.html).

---

## 8. BACKEND — CHI TIẾT TỪNG ROUTE

### 8.1 Entry Point (index.js)

Express app với middleware: CORS, JSON parser. Không dùng dotenv (env từ Docker).

**Route mounting:**
```
/api/auth           → auth.js
/api/devices        → devices.js
/api/cards, /api/ips → cardsAndIps.js
/api/lookup         → lookup.js
/api/ping           → ping.js
/api/quy-trinh      → quyTrinh.js
/api/tai-khoan      → taiKhoan.js
/api/phieu-de-nghi  → phieuDeNghi.js
/api/qualzen        → qualzen.js
/health             → { status: 'ok' }
```

### 8.2 Chi tiết từng Route

**auth.js (61 dòng):**
- `POST /login` — Kiểm tra username + block=0 → bcrypt compare → trả JWT
- `POST /change-password` — Verify old password → hash new → update

**devices.js (113 dòng):**
- `GET /` — Tìm kiếm + phân trang (page/limit) + filter theo phòng ban, loại máy
- `GET /:id` — Chi tiết 1 thiết bị (JOIN phongban + loaimay)
- `POST /` — Tạo mới
- `PUT /:id` — Cập nhật
- `DELETE /:id` — Xoá

**cardsAndIps.js (122 dòng):**
- 4 endpoint CRUD cho thẻ từ (/cards)
- 4 endpoint CRUD cho IP tĩnh (/ips) — sort theo vlan, ip

**lookup.js (99 dòng):**
- `GET /phongban` — Danh sách phòng ban
- `POST /phongban` — Thêm phòng ban
- `DELETE /phongban/:id` — Xoá phòng ban
- `GET /loaimay` — Danh sách loại máy
- `POST /loaimay` — Thêm loại máy
- `DELETE /loaimay/:id` — Xoá loại máy
- `GET /dashboard` — Thống kê: tổng thiết bị/thẻ/IP, top 10 phòng ban, top 10 loại máy, phân bố tình trạng

**ping.js (15 dòng):**
- `POST /:id` — Ping 1 thiết bị (4 ICMP packets) → trả alive, latency, packetLoss

**pingService.js:** Dùng module `ping` (npm), gửi 4 gói ICMP, timeout 5s.

**quyTrinh.js (136 dòng):**
- CRUD quy trình + file upload (multer, max 20MB)
- `GET /download/:filename` — Download file gốc
- `GET /preview/:filename` — Preview online: DOCX→HTML (mammoth), PDF stream, image, txt→HTML

**taiKhoan.js (138 dòng):**
- CRUD tài khoản thiết bị
- `POST /import` — Import từ CSV/Excel (hỗ trợ nhiều tên cột tiếng Việt/Anh)

**phieuDeNghi.js (166 dòng):**
- `GET /next-pr` — Tự tính số PR tiếp theo (lấy so_pr cuối + 1)
- `GET /` — Danh sách phiếu + tự tính lan_trong_thang (đếm theo tháng/năm)
- CRUD phiếu đề nghị

**qualzen.js (58 dòng):**
- `GET /action-items` — Query SQL Server: join ActionPlanMaster + Status + UserDetails, filter DeptID=6 (IT)
- `GET /action-items/summary` — Đếm total, open, overdue, dueSoon, onTrack, closed

### 8.3 Database Connections

**PostgreSQL (pool.js):**
```javascript
new Pool({ connectionString: process.env.DATABASE_URL })
// Connection pool tự quản lý, tái sử dụng connections
```

**SQL Server (mssqlPool.js):**
```javascript
// Singleton pattern: tạo 1 lần, reuse
// Server: 10.1.11.36:1433, DB: prod_fremed, User: sa
// Pool: max 5, idle timeout 30s, request timeout 30s
```

---

## 9. TÍNH NĂNG PHIẾU ĐỀ NGHỊ — CHI TIẾT

### 9.1 Luồng tạo phiếu

```
User bấm "Tạo phiếu mới"
    │
    ▼
Frontend gọi GET /api/phieu-de-nghi/next-pr
    │ Backend: Tìm so_pr cuối cùng → tách số → +1
    │ VD: "IT/PR/26016" → trả về "IT/PR/26017"
    │
    ▼
Modal mở, auto-fill:
    ├── Số PR: IT/PR/26017 (có thể sửa)
    ├── Người đề nghị: (nhập tay)
    └── Bảng vật tư (mỗi dòng):
         ├── Tên sản phẩm
         ├── ĐVT (đơn vị tính)
         ├── Nhu cầu (số lượng cần)
         ├── Cần mua (số lượng mua)
         ├── Mục đích sử dụng
         └── Ngày cần sử dụng
    │
    ▼ Bấm "Tạo phiếu"
    │
Frontend gọi POST /api/phieu-de-nghi
    │ Payload auto-fill:
    │   phong_ban: "IT"
    │   truong_phong: "Văn Tấn Bửu"
    │   soat_xet: "Hoàng Thị Hà"
    │
    ▼
Backend INSERT vào PostgreSQL
    │ items lưu dạng JSONB
    │
    ▼
Reload danh sách, phiếu mới hiện đầu tiên
```

### 9.2 Tính "Lần trong tháng"

Backend GET / tự tính:
1. Sort tất cả phiếu theo created_at ASC
2. Group theo tháng/năm
3. Đếm thứ tự trong mỗi group
4. Gán `lan_trong_thang` cho mỗi phiếu

VD: Tháng 5/2026 có 3 phiếu → Lần 01, Lần 02, Lần 03

### 9.3 Preview & In phiếu

Bấm icon preview → Component `PrintPreview` render full-screen:
- Nền xám, giấy trắng A4 ngang (297mm × 210mm)
- Toolbar: nút "Quay lại" + "In phiếu"
- Nội dung đúng mẫu Excel IT_PR_26016 (đầy đủ cột)
- Bấm "In phiếu" → `window.open()` trang mới → `window.print()` sau 400ms

---

## 10. MIGRATIONS

### Thứ tự chạy migrations:

1. **init.sql** — Chạy tự động bởi Docker lần đầu. Tạo tất cả bảng cơ bản + trigger + admin user.

2. **migrate_new_tabs.sql** — Đã được merge vào init.sql. Tạo 3 bảng: quy_trinh, tai_khoan_tb, phieu_de_nghi.

3. **migrate_phieu_de_nghi_v2.sql** — Chạy thủ công:
```bash
docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/migrate_phieu_de_nghi_v2.sql
```
Thêm 3 cột: so_pr, truong_phong, soat_xet. Dùng `IF NOT EXISTS` nên chạy lại nhiều lần an toàn.

---

## 11. CÁC LỆNH DOCKER THƯỜNG DÙNG

```bash
# Start/Stop
docker-compose up -d              # Start tất cả containers
docker-compose down                # Stop (giữ data)
docker-compose down -v             # Stop + XOÁ DATA (cẩn thận!)

# Restart từng container
docker restart fremed_backend      # Restart backend (khi sửa route)
docker restart fremed_frontend     # Restart frontend (nếu HMR không hoạt động)

# Xem logs
docker logs fremed_backend -f      # Xem log backend (realtime)
docker logs fremed_db -f           # Xem log database

# Vào container
docker exec -it fremed_db psql -U fremed -d fremed_device    # Vào PostgreSQL
docker exec -it fremed_backend sh                             # Vào shell backend

# Chạy migration
docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/migrate_phieu_de_nghi_v2.sql

# Rebuild (khi thay đổi Dockerfile hoặc package.json)
docker-compose up -d --build backend    # Rebuild backend
docker-compose up -d --build frontend   # Rebuild frontend

# Tools
docker-compose --profile tools up -d pgadmin   # Bật pgAdmin (localhost:5050)
```

---

## 12. GHI CHÚ VỀ OPTIMIZATION

**Hiện tại (Development mode):**
- Frontend chạy Vite dev server (không build, không minify)
- Backend chạy nodemon (auto-restart khi code thay đổi)
- Zoom 1.2 trong cả CSS lẫn HTML (bị zoom kép nếu không cẩn thận)
- Không có rate limiting, không có compression, không có caching
- CORS mở toàn bộ (cors() không config)
- SQL Server credentials hardcode trong mssqlPool.js

**Nếu muốn chuyển Production:**
- Frontend: `vite build` → serve static files qua Nginx
- Backend: `node src/index.js` thay vì nodemon
- Thêm Nginx reverse proxy (gộp frontend + backend vào 1 domain)
- Thêm rate limiting (express-rate-limit)
- Thêm helmet (security headers)
- Chuyển credentials sang biến môi trường / secrets
- Thêm compression (gzip)
- Bỏ zoom kép, chỉ giữ 1 chỗ
