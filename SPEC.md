# TÀI LIỆU ĐẶC TẢ KỸ THUẬT HỆ THỐNG (SYSTEM SPECIFICATION)
## Dự án: AG Proxy — AI Account Manager & Reverse Proxy

---

## 1. TỔNG QUAN DỰ ÁN (EXECUTIVE SUMMARY)

### 1.1. Giới thiệu
**AG Proxy** là hệ thống reverse proxy và quản lý tài khoản AI tự lưu trữ (self-hosted). Hệ thống cung cấp giao diện lập trình ứng dụng tương thích hoàn toàn với định dạng **OpenAI API** (`/v1/chat/completions`) và **Anthropic API** (`/v1/messages`), được vận hành bằng hạ tầng nội bộ của Google Cloud Code (Google AI Studio / Cloud AI Companion).

### 1.2. Mục tiêu hệ thống
- **Tập trung hóa tài khoản**: Quản trị nhiều tài khoản Google AI (Gemini 2.5/3.0/3.1, Claude 3.7/Sonnet/Opus) qua một điểm truy cập duy nhất.
- **Xoay vòng thông minh (Smart Rotation)**: Phân phối tải, theo dõi hạn ngạch (quota), tự động chuyển tài khoản khi gặp giới hạn tốc độ (Rate Limit 429) hoặc lỗi xác thực (401).
- **Tạo đường hầm API (API Tunnels)**: Cấp phát các API Key ảo (`sk-...`) với giới hạn token tùy biến cho các ứng dụng thứ ba (NextChat, LibreChat, Cline, Cursor, Roo-Code, OpenCodeInterpreter,...).
- **Điều phối Proxy mạng (Network Proxies)**: Gán proxy riêng (HTTP/HTTPS/SOCKS5) cho từng tài khoản để chống khóa tài khoản theo IP địa lý.
- **Chuyển đổi tài khoản IDE (AG Switch Extension)**: Tích hợp extension VS Code để đổi tài khoản trực tiếp trong Antigravity IDE thông qua can thiệp SQLite Database (`state.vscdb`) cục bộ.

---

## 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```
+-------------------------------------------------------------------------------+
|                                 CLIENT APPS                                   |
|   (Cursor, Cline, Roo-Code, NextChat, LibreChat, Custom HTTP Clients, etc.)   |
+-------------------------------------------------------------------------------+
                                      |
                      [Authorization: Bearer sk-...]
                                      v
+-------------------------------------------------------------------------------+
|                            AG PROXY (Next.js 16)                              |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                           Security & Middleware                         |  |
|  |  - JWT Session Auth (Dashboard)     - Tunnel API Key Verification      |  |
|  |  - Token Limit Enforcement           - Anti-Detection Fingerprinting    |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                            API Routing Layer                            |  |
|  |  - /v1/chat/completions (OpenAI compatible)                             |  |
|  |  - /v1/messages (Anthropic Claude compatible)                           |  |
|  |  - /v1/models (Model listing)                                           |  |
|  |  - /api/* (Management REST API: Accounts, Proxies, Tunnels, Users)       |  |
|  +-------------------------------------------------------------------------+  |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                       Core Business Logic & Engine                      |  |
|  |  - Smart Account Rotation Engine      - Quota Tracker & Sync            |  |
|  |  - Google OAuth2 Token Manager        - Schema Sanitizer (Tools)        |  |
|  |  - SSE Stream Parser & Formatter      - Upstream Failover / Retry (3x)  |  |
|  +-------------------------------------------------------------------------+  |
|                                     |                                         |
|                                     v                                         |
|  +-------------------------------------------------------------------------+  |
|  |                    Storage Layer (MongoDB + Mongoose)                   |  |
|  |  - Collections: accounts, tunnels, proxies, users                       |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
         |                                                        |
         v (via Outbound Proxy if configured)                     v (Port 45123)
+------------------------------------+          +-------------------------------+
|      UPSTREAM GOOGLE SERVICES      |          |    VS CODE EXTENSION ENGINE   |
| - daily-cloudcode-pa.googleapis    |          | - AG Switch Extension         |
| - cloudcode-pa.googleapis.com      |          | - SQLite (state.vscdb) inject |
|   (v1internal:streamGenerateContent|          | - Auto-reload window          |
|    loadCodeAssist, fetchModels)    |          +-------------------------------+
+------------------------------------+
```

### 2.1. Công nghệ sử dụng (Tech Stack)
- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.
- **Styling & UI:** Tailwind CSS v4, shadcn/ui (Radix UI), Lucide Icons, Sonner.
- **Cơ sở dữ liệu:** MongoDB với ODM Mongoose.
- **Bảo mật & Mã hóa:** `jose` (JWT signing/verification), `bcryptjs` (password hashing), `crypto` (fingerprint, token generation).
- **Quản lý đa ngôn ngữ:** Tích hợp sẵn bộ từ điển i18n (Tiếng Anh, Tiếng Việt, Tiếng Trung).
- **Extension:** VS Code API, `sql.js` (WebAssembly SQLite) thao tác trực tiếp trên file `state.vscdb`.

---

## 3. CƠ SỞ DỮ LIỆU & DATA MODELS (DATABASE SCHEMAS)

Hệ thống định nghĩa 4 thực thể chính lưu trữ trong MongoDB:

### 3.1. Collection: `users` (Người dùng quản trị & thành viên)
- Quản lý phiên làm việc và quyền truy cập Dashboard.
```typescript
interface IUser {
  _id: ObjectId;
  username: string;          // Tên đăng nhập (unique)
  password: string;          // Mật khẩu đã hash bằng bcrypt
  role: "admin" | "user";    // Phân quyền (admin toàn quyền, user chỉ xem)
  createdAt: Date;
}
```

### 3.2. Collection: `accounts` (Tài khoản Google / Anthropic)
- Lưu thông tin kết nối và chỉ số hạn ngạch của tài khoản Cloud Code.
```typescript
interface IAccount {
  _id: ObjectId;
  email: string;             // Email tài khoản
  name: string;              // Tên hiển thị
  avatar: string;            // Ảnh đại diện
  tier: "free" | "pro" | "ultra";
  type: "google" | "anthropic";
  accessToken: string;       // OAuth2 Access Token
  refreshToken: string;      // OAuth2 Refresh Token
  tokenExpiresAt: Date;      // Thời điểm hết hạn Access Token
  projectId: string;         // cloudaicompanionProject ID từ Google
  quotas: Record<string, number>;      // Hạn ngạch còn lại theo model (%: 0 - 100)
  quotaResets: Record<string, string>; // Thời điểm reset quota theo model (ISO string)
  tokensUsed: number;        // Tổng số token đã tiêu thụ qua proxy
  rotationPriority: number;  // Độ ưu tiên xoay vòng (số càng lớn ưu tiên chọn trước)
  rotationEnabled: boolean;  // Bật/tắt tham gia luân chuyển
  proxyId?: ObjectId;        // Liên kết tới proxy mạng riêng (nếu có)
  status: "active" | "suspended" | "expired";
  lastSyncAt: Date;
  createdAt: Date;
}
```

### 3.3. Collection: `tunnels` (Đường hầm phân phối API Key)
- Quản lý API Key cấp cho bên ngoài và cấu hình định tuyến.
```typescript
interface ITunnel {
  _id: ObjectId;
  name: string;              // Tên định danh Tunnel
  model: string;             // Model mặc định gắn với tunnel
  apiKey: string;            // Key xác thực (format: sk-...)
  tokenLimit: number;        // Hạn mức token cho phép (0 = không giới hạn)
  tokensUsed: number;        // Lượng token đã tiêu thụ qua tunnel này
  accountMode: "pool" | "tied"; // Chế độ: 'pool' (xoay vòng) hoặc 'tied' (tài khoản cố định)
  tiedAccountId?: ObjectId;  // Tài khoản được gán cứng (nếu mode = tied)
  enabled: boolean;          // Trạng thái bật/tắt
  createdAt: Date;
}
```

### 3.4. Collection: `proxies` (Máy chủ Forward Proxy)
- Cấu hình Proxy trung gian cho các tài khoản Google.
```typescript
interface IProxy {
  _id: ObjectId;
  name: string;
  host: string;
  port: number;
  protocol: "http" | "https" | "socks5";
  username?: string;
  password?: string;
  enabled: boolean;
  createdAt: Date;
}
```

---

## 4. CƠ CHẾ BẢO MẬT & XÁC THỰC (AUTHENTICATION & AUTHORIZATION)

### 4.1. Dashboard Session Management
- **Setup lần đầu:** Khi hệ thống khởi chạy với DB rỗng (`hasAnyUsers() === false`), trang `/login` sẽ kích hoạt chế độ **Setup Admin**. Người dùng khởi tạo tài khoản đầu tiên sẽ được cấp quyền `admin`.
- **JWT Cookie:** Khi đăng nhập thành công, máy chủ cấp phát cookie `session` với cờ `HttpOnly`, `SameSite=lax`, thời hạn 7 ngày.
- **Dev Mode Bypass:** Trong môi trường phát triển (hoặc khi chưa kết nối được DB), hệ thống hỗ trợ tài khoản dev khẩn cấp `admin` / `123`.

### 4.2. API Tunnel Authentication
- Tất cả request gọi vào `/v1/chat/completions` và `/v1/messages` bắt buộc gửi header:
  ```http
  Authorization: Bearer sk-<64_hex_chars>
  ```
- Hệ thống tra cứu Tunnel hợp lệ trong MongoDB và kiểm tra hạn mức (`tokensUsed < tokenLimit`). Nếu vượt ngưỡng, trả về HTTP 429 (`rate_limit_error`).

---

## 5. ĐẶC TẢ CHI TIẾT CÁC TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 5.1. Thuật toán Xoay vòng tài khoản (Smart Account Rotation)
1. **Lọc tài khoản ứng viên:**
   - Điều kiện: `status === "active"` VÀ `rotationEnabled === true`.
   - Loại trừ các tài khoản đã thử thất bại trong request hiện tại (`triedAccountIds`).
   - Sắp xếp theo `rotationPriority` giảm dần.
2. **Kiểm tra Quota:**
   - Nếu `quotas[model] <= 0` và `quotaResets[model] > now`: bỏ qua tài khoản.
   - Nếu đã tới thời điểm reset (`quotaResets[model] <= now`): tự động làm mới quota về 100%.
3. **Phân bổ tải (Load Balancing):**
   - Chọn tài khoản có `tokensUsed` thấp nhất trong nhóm ưu tiên cao nhất.
4. **Cơ chế Thử lại & Chuyển giao lỗi (Failover & Retry):**
   - Tối đa **3 lần thử** (`MAX_ACCOUNT_RETRIES = 3`).
   - Nếu gặp **HTTP 401** (Token hết hạn): Thử refresh Access Token tự động và gọi lại upstream. Nếu vẫn lỗi, chuyển sang tài khoản kế tiếp.
   - Nếu gặp **HTTP 429** (Bị rate limit): Bất đồng bộ gọi `fetchQuotas` cập nhật lại hạn ngạch cho tài khoản đó, sau đó thử tài khoản khác trong pool.
   - Nếu gặp **HTTP 5xx**: Tự động chuyển fallback sang các baseUrl dự phòng:
     - `https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal`
     - `https://daily-cloudcode-pa.googleapis.com/v1internal`
     - `https://cloudcode-pa.googleapis.com/v1internal`

### 5.2. Cơ chế Giả lập Fingerprint (Anti-Detection)
Để tránh bị hệ thống upstream nhận diện là request tự động bất thường, AG Proxy giả lập môi trường Antigravity IDE:
- **Headers giả lập:**
  - `User-Agent`: Phiên bản VS Code/Antigravity chính thức.
  - `x-client-name`: `antigravity`
  - `x-goog-api-client`: `gl-node/18.18.2 fire/0.8.6 grpc/1.10.x`
  - `anthropic-beta`: `claude-code-20250219` (đối với các request gọi Claude)
- **Machine & Session Fingerprinting:**
  - Mỗi tài khoản (dựa trên hash của Email) được cấp một `machineId` cố định (định dạng UUID chuẩn phần cứng).
  - Khởi tạo `sessionId` duy nhất với chu kỳ đổi mới 1 giờ (`sessionTs < 3600_000`).

### 5.3. Xử lý Chuyển đổi định dạng API (Protocol Translation)
- **OpenAI sang Cloud Code:**
  - Chuyển `messages` (role: user/assistant/system) sang định dạng `contents` (role: user/model) và `systemInstruction`.
  - Tắt toàn bộ các bộ lọc an toàn mặc định (`HARM_CATEGORY_*` -> `OFF`).
  - Hỗ trợ giải mã Server-Sent Events (`streamGenerateContent?alt=sse`) và đóng gói lại thành định dạng chuẩn OpenAI `chat.completion` kèm usage token thực tế.
- **Anthropic sang Cloud Code:**
  - Hỗ trợ công cụ (Tools / Function Calling).
  - Chuẩn hóa Schema (`sanitizeSchema`): loại bỏ các từ khóa không được hỗ trợ như `const`, ép kiểu về JSON Schema chuẩn của Gemini.
  - Hỗ trợ endpoint đếm token: `/v1/messages/count_tokens`.

### 5.4. Extension VS Code: "AG Switch"
- Cung cấp một HTTP Server cục bộ lắng nghe tại cổng `http://127.0.0.1:45123`.
- Khi người dùng bấm **Switch** trên Dashboard:
  1. Dashboard gửi token và Device Profile tới cổng 45123.
  2. Extension đọc file SQLite `state.vscdb` của Antigravity IDE (bằng `sql.js`).
  3. Mã hóa Access/Refresh Token thành định dạng **Protobuf** (`antigravityUnifiedStateSync.oauthToken`).
  4. Ghi đè vào bảng `ItemTable` và cập nhật thông tin thiết bị vào `storage.json`.
  5. Kích hoạt lệnh `workbench.action.reloadWindow` để áp dụng tài khoản mới ngay lập tức.

---

## 6. ĐẶC TẢ CHI TIẾT CÁC API ENDPOINTS

### 6.1. Nhóm Proxy AI (Public / Tunnel Authenticated)

#### `POST /v1/chat/completions`
- **Mục đích:** Gửi prompt trò chuyện theo định dạng OpenAI.
- **Headers:** `Authorization: Bearer <TUNNEL_API_KEY>`
- **Request Body:**
  ```json
  {
    "messages": [
      { "role": "system", "content": "You are a helpful assistant" },
      { "role": "user", "content": "Hello!" }
    ],
    "temperature": 0.7,
    "max_tokens": 4096,
    "stream": false
  }
  ```
- **Response (200 OK):** Định dạng OpenAI Chat Completion.

#### `POST /v1/messages`
- **Mục đích:** Gửi prompt trò chuyện theo định dạng Anthropic Claude.
- **Headers:** `Authorization: Bearer <TUNNEL_API_KEY>`
- **Hỗ trợ:** `messages`, `system`, `tools`, `stream: true/false`.

#### `POST /v1/messages/count_tokens`
- **Mục đích:** Tính toán lượng token của payload trước khi gửi.

#### `GET /v1/models` & `GET /v1/models/:model`
- **Mục đích:** Liệt kê danh sách các model đang được cấp phép và khả dụng từ upstream.

---

### 6.2. Nhóm Quản trị (Dashboard - Session Authenticated)

| Endpoint | Method | Mô tả chức năng | Quyền hạn |
|---|---|---|---|
| `/api/setup/status` | `GET` | Kiểm tra hệ thống có cần khởi tạo admin ban đầu hay không | Public |
| `/api/auth` | `POST` | Thực hiện `login`, `register`, `logout` | Public |
| `/api/auth/me` | `GET` | Lấy thông tin user đăng nhập hiện tại | Authenticated |
| `/api/accounts` | `GET` / `POST` | Lấy danh sách hoặc tạo mới tài khoản | Authenticated |
| `/api/accounts/:id` | `GET` / `PATCH` / `DELETE` | Xem chi tiết, chỉnh sửa hoặc xóa tài khoản | Authenticated |
| `/api/accounts/sync` | `POST` | Đồng bộ thủ công Quota và Tier từ Google | Authenticated |
| `/api/accounts/switch` | `POST` | Phát tín hiệu chuyển tài khoản sang VS Code extension | Authenticated |
| `/api/accounts/import` | `POST` | Nhập danh sách tài khoản hàng loạt qua file JSON | Authenticated |
| `/api/accounts/export` | `GET` | Xuất danh sách tài khoản ra file JSON sao lưu | Authenticated |
| `/api/tunnels` | `GET` / `POST` | Xem danh sách hoặc tạo mới API Tunnel | Authenticated |
| `/api/tunnels/:id` | `PATCH` / `DELETE` | Cập nhật cấu hình hoặc xóa Tunnel | Authenticated |
| `/api/proxies` | `GET` / `POST` | Danh sách proxy hoặc thêm proxy mới | Authenticated |
| `/api/proxies/:id` | `PATCH` / `DELETE` | Chỉnh sửa hoặc xóa proxy | Authenticated |
| `/api/proxies/ping` | `POST` | Kiểm tra độ trễ và tính kết nối của proxy | Authenticated |
| `/api/proxies/import` | `POST` | Import danh sách proxy hàng loạt (hỗ trợ kéo thả cột) | Authenticated |
| `/api/users` | `GET` / `POST` | Danh sách người dùng hoặc thêm người dùng mới | Admin only |
| `/api/users/:id` | `PATCH` / `DELETE` | Đổi mật khẩu, quyền hoặc xóa user | Admin only |

---

## 7. BIẾN MÔI TRƯỜNG & CẤU HÌNH (ENVIRONMENT VARIABLES)

Các biến cấu hình trong `.env` / `.env.local`:

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|
| `MONGODB_URI` | Có | `mongodb://localhost:27017/ag-proxy` | Đường dẫn kết nối CSDL MongoDB |
| `JWT_SECRET` | Có | Chuỗi ngẫu nhiên >= 32 ký tự | Khóa bí mật ký mã hóa JWT token |
| `GOOGLE_CLIENT_ID` | Tùy chọn | (OAuth Google) | Dùng nếu liên kết tài khoản qua Google OAuth trực tiếp |
| `GOOGLE_CLIENT_SECRET`| Tùy chọn | (OAuth Google) | Secret OAuth Google |
| `PORT` | Không | `3001` | Cổng dịch vụ lắng nghe |

---

## 8. HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH (DEPLOYMENT GUIDE)

### 8.1. Môi trường phát triển cục bộ (Local Development)
```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file môi trường
cp .env.example .env.local

# 3. Khởi chạy dev server (Webpack bundler)
npm run dev
```
Truy cập giao diện tại: `http://localhost:3001`.

### 8.2. Triển khai Production với Docker
```bash
# Build Docker image
docker build -t ag-proxy:latest .

# Khởi chạy container kết hợp MongoDB
docker run -d \
  --name ag-proxy \
  -p 3000:3000 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/ag-proxy" \
  -e JWT_SECRET="your-production-ultra-secure-jwt-secret-string" \
  ag-proxy:latest
```

---

## 9. ĐÁNH GIÁ VÀ HƯỚNG MỞ RỘNG (FUTURE ENHANCEMENTS)
1. **Fallback Offline Mock Database:** Tự động fallback sang Local File Storage (JSON/NeDB) nếu MongoDB bị mất kết nối, giúp hệ thống không bị gián đoạn.
2. **Streaming Full Response:** Nâng cấp hoàn thiện tính năng Server-Sent Events (SSE) passthrough trực tiếp cho endpoint `/v1/chat/completions` khi client yêu cầu `stream: true`.
3. **Thống kê chuyên sâu (Analytics Dashboard):** Biểu đồ đo lường chi phí, token tiêu thụ theo ngày/tuần/tháng theo từng tài khoản và tunnel.
