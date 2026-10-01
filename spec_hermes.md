# Tài Liệu Đặc Tả Kỹ Thuật: Hermes Agent (Nous Research)
**Hệ thống AI Agent Tự Hành, Tự Học & Quản Trị Trạng Thái Toàn Diện**
*Biên soạn chi tiết dựa trên toàn bộ hệ thống tài liệu chính thức (`website/docs`) của Nous Research*

---

## 1. Giới Thiệu Tổng Quan & Tầm Nhìn (Executive Overview & Vision)

**Hermes Agent** là runtime AI agent mã nguồn mở tiên tiến được phát triển bởi **Nous Research** — nhóm nghiên cứu đứng sau dòng mô hình ngôn ngữ Hermes nổi tiếng. Hermes Agent được thiết kế không chỉ như một chatbot hay trợ lý tương tác thông thường, mà là một **hệ điều hành agent tự hành (Autonomous Agent Runtime)** có khả năng giải quyết các bài toán phức tạp dài hạn (long-horizon tasks), tự sửa lỗi, tự tích luỹ kỹ năng mới (continuous self-learning), và duy trì bộ nhớ dài hạn qua nhiều phiên làm việc và nền tảng giao tiếp.

### 1.1. Triết Lý Cốt Lõi (Core Principles)
1. **Local-First & Multi-Platform**: Chạy độc lập trên máy trạm của người dùng (macOS Apple Silicon, Linux/WSL2, Windows native qua MSIX/PowerShell, và Android qua Termux), bảo mật dữ liệu tối đa và không phụ thuộc vào hạ tầng cloud độc quyền.
2. **Open-Weights First, Multi-Provider Agnostic**: Tối ưu hóa sâu cho các mô hình mã nguồn mở mở (Hermes series, DeepSeek, Llama, Qwen chạy qua Ollama/vLLM/OpenRouter) song song với hỗ trợ toàn diện các proprietary API (Anthropic Claude, OpenAI GPT, Google Gemini).
3. **Continuous Skill Learning**: Cơ chế tự động đúc kết kinh nghiệm từ các phiên giải quyết vấn đề thành công thành các đơn vị tri thức tái sử dụng (`SKILL.md`).
4. **Unified Gateway**: Một agent duy nhất có thể lắng nghe, suy luận và phản hồi xuyên suốt trên CLI, Desktop TUI, và hàng loạt nền tảng tin nhắn (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, SMS, Email).
5. **State & Memory Determinism**: Kiến trúc bộ nhớ đa tầng (Working Memory, Episodic Memory, Semantic Vector Search) kết hợp với Git Worktrees và Checkpoints cho phép tua lại (rollback) trạng thái cả về mặt code lẫn bộ nhớ khi gặp lỗi.

---

## 2. Kiến Trúc Runtime & Cài Đặt (Runtime Architecture & Package Management)

### 2.1. Quản Lý Gói & Runtime Độc Lập (`PM`)
Khác với các công cụ phụ thuộc vào môi trường Python toàn cục của hệ điều hành, Hermes Agent sở hữu hệ thống Package Manager nội bộ (`PM`) tự động quản lý các dependencies nhị phân đã ghim phiên bản (pinned):
- **Python Runtime độc lập**: Cài đặt thông qua `uv`, cô lập môi trường ảo mà không xung đột với Python của hệ thống.
- **Node.js & npm**: Phục vụ các tác vụ web sandbox, JavaScript execution và browser automation.
- **Hệ thống CLI Utilities**: Pinned binaries của `ripgrep` (tìm kiếm file siêu tốc) và `FFmpeg` (xử lý âm thanh, giọng nói đa phương tiện).
- **agent-browser & Chromium**: Nhân Chromium thu nhỏ phục vụ tự động hóa duyệt web headless/headed.
- **cua-driver (Computer-Use Agent Driver)**: Trình điều khiển mô phỏng chuột, bàn phím và chụp ảnh màn hình OS mức thấp (hỗ trợ macOS, Windows, Linux glibc).

### 2.2. Cấu Trúc Thư Mục Dữ Liệu (`HERMES_HOME`)
Mặc định người dùng được cấu hình tập trung tại `~/.hermes/` (POSIX) hoặc `%LOCALAPPDATA%\hermes\` (Windows). Biến môi trường `HERMES_HOME` cho phép di chuyển vị trí dữ liệu này linh hoạt:

```
~/.hermes/ (hoặc $HERMES_HOME)
├── config.yaml          # File cấu hình toàn cục (providers, model routing, gateways)
├── SOUL.md              # [Tối quan trọng] Nhân cách & Danh tính cốt lõi (Slot #1)
├── auth.json            # API keys, tokens của các provider và gateways
├── databases/
│   ├── memory.sqlite    # Cơ sở dữ liệu SQLite & vector embedding lưu trữ ký ức
│   ├── sessions.db      # Lưu trữ lịch sử hội thoại, checkpoints và rollback tree
│   └── kanban.db        # Trạng thái bảng quản lý tác vụ Kanban
├── skills/              # Thư viện kỹ năng tự học và kỹ năng do người dùng định nghĩa
│   ├── web-scraper/
│   │   └── SKILL.md
│   └── code-refactor/
│       └── SKILL.md
├── logs/                # Nhật ký runtime, tool execution logs, install logs
└── profiles/            # Các cấu hình môi trường/tác vụ chuyên biệt (coding, research, creative)
```

---

## 3. Phân Cấp System Prompt & Ngữ Cảnh (Context Hierarchy & Slot Priority)

Điểm đột phá trong kiến trúc của Hermes Agent là **hệ thống phân bổ System Prompt theo 5 tầng nghiêm ngặt (5-Slot Context Hierarchy)**. Cơ chế này đảm bảo agent không bị "loãng" ngữ cảnh, kiểm soát hành vi chặt chẽ và ngăn chặn xung đột giữa quy tắc dự án và bản sắc agent:

```
┌────────────────────────────────────────────────────────────────────────┐
│  SLOT 1: IDENTITY & PERSONALITY (Cốt Lõi Tối Thượng)                   │
│  - Nguồn nạp: ~/.hermes/SOUL.md hoặc Preset từ /personality            │
│  - Ghi đè hoàn toàn danh tính mặc định (Verbatim Replacement)          │
│  - Định hình giọng văn, thái độ, tư duy phản biện, cách xưng hô         │
├────────────────────────────────────────────────────────────────────────┤
│  SLOT 2: AGENT CORE OPERATING INSTRUCTIONS                             │
│  - Quy tắc điều phối Agentic Loop do Nous Research định nghĩa          │
│  - Ràng buộc an toàn, tiêu chuẩn gọi Native Function Calling           │
│  - Hướng dẫn phân tích bước, self-reflection và xử lý lỗi              │
├────────────────────────────────────────────────────────────────────────┤
│  SLOT 3: TOOL DEFINITIONS & SCHEMAS                                    │
│  - JSON Schemas của các tool đang khả dụng (Bash, Browser, CUA, File)  │
│  - Danh sách công cụ mở rộng từ Plugins & MCP Servers                  │
├────────────────────────────────────────────────────────────────────────┤
│  SLOT 4: PROJECT CONTEXT & ACTIVE SKILLS                               │
│  - Quy chuẩn dự án cục bộ: AGENTS.md, CLAUDE.md từ thư mục làm việc    │
│  - Kỹ năng chủ động: Các SKILL.md được kích hoạt theo ngữ cảnh tác vụ   │
├────────────────────────────────────────────────────────────────────────┤
│  SLOT 5: WORKING MEMORY & CONVERSATION HISTORY                         │
│  - Ký ức ngắn hạn (Short-term buffer), Ký ức truy xuất (RAG semantic)  │
│  - Lịch sử đối thoại hiện tại và kết quả thực thi các tool gần nhất    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hệ Thống Tính Cách Chuyên Sâu (`SOUL.md` & `/personality`)

*Nghiên cứu chi tiết theo tài liệu `website/docs/user-guide/features/personality.md`.*

### 4.1. Bản Chất của `SOUL.md`
`SOUL.md` là file markdown chứa bản sắc tinh thần và danh tính nền tảng của Hermes Agent.
- **Vị trí cố định**: Nằm duy nhất tại `$HERMES_HOME/SOUL.md` (mặc định `~/.hermes/SOUL.md`).
- **Nguyên tắc cô lập (Isolation Principle)**: Hermes Agent **tuyệt đối không bao giờ** tự động đọc `SOUL.md` từ thư mục dự án cục bộ (working repository). Điều này nhằm ngăn chặn tình trạng "lạc giọng" (voice drift) hoặc bị mã độc thao túng tính cách khi mở các repo git lạ tải từ internet.
- **Quyền ưu tiên Slot #1**: Nội dung của `SOUL.md` thay thế nguyên văn (verbatim replacement) phần mô tả danh tính mặc định của mô hình sau khi đã qua bước kiểm tra an toàn (security scanning & prompt injection filtering).

### 4.2. Lệnh `/personality` (Dynamic Overlays)
Hermes cung cấp cơ chế chuyển đổi tính cách tức thì ngay trong phiên làm việc thông qua lệnh `/personality`:
- **Built-in Presets**:
  - `/personality default`: Bản sắc tiêu chuẩn của Nous Hermes — sắc bén, trung thực, thẳng thắn, thiên hướng hacker, không lãng phí từ ngữ sáo rỗng.
  - `/personality professional`: Giọng văn trang trọng, chuẩn mực doanh nghiệp, cấu trúc báo cáo rõ ràng.
  - `/personality tutor`: Kiên nhẫn, giải thích bản chất từ gốc rễ (first principles), thường xuyên đặt câu hỏi gợi mở theo phương pháp Socratic.
  - `/personality terse`: Tối giản cực hạn, chỉ trả về code và lệnh cần thiết, không giải thích rườm rà.
- **Custom Presets**: Người dùng có thể tạo các file markdown trong thư mục `~/.hermes/personalities/<name>.md` và kích hoạt bằng lệnh `/personality <name>`.

### 4.3. So Sánh `SOUL.md` vs `AGENTS.md` vs `SKILL.md`
Rất nhiều hệ thống agent bị nhập nhằng giữa quy tắc dự án và bản sắc cá nhân. Hermes Agent phân tách minh bạch:

| Tiêu Chí | `SOUL.md` (Slot 1) | `AGENTS.md` (Slot 4) | `SKILL.md` (Slot 4) |
|---|---|---|---|
| **Mục đích** | Định hình danh tính, thế giới quan, cách ứng xử của Agent. | Định hình cấu trúc dự án, lệnh build/test, đường dẫn code của repo. | Hướng dẫn Agent cách thực thi một nghiệp vụ chuyên môn cụ thể. |
| **Phạm vi** | Toàn cục cho người dùng (`~/.hermes/SOUL.md`). | Riêng biệt cho từng Repository dự án (`./AGENTS.md`). | Thư viện kỹ năng (`~/.hermes/skills/` hoặc `./skills/`). |
| **Ảnh hưởng** | Quyết định phong cách ngôn ngữ, thái độ tranh biện, sự hài hước. | Quyết định cách thức viết code, chuẩn linter, nhánh git, kiến trúc file. | Hướng dẫn từng bước (step-by-step) giải một bài toán thực tế. |

### 4.4. Mẫu Chuẩn Một File `SOUL.md` Tối Ưu
```markdown
# Identity: Hermes Senior Architect & System Hacker

## Core Persona & Attitude
- You are a pragmatic, battle-tested software architect and autonomous problem solver.
- You do not use sycophantic corporate fluff ("Certainly!", "I'd be happy to help!"). You jump straight into analyzing constraints and executing solutions.
- When an architecture decision has major trade-offs or security flaws, challenge the user politely but decisively with first-principles reasoning.

## Cognitive & Execution Style
- Think in systems: Always evaluate edge cases, memory allocations, concurrency safety, and failure recovery.
- Verify through execution: Before declaring a bug fixed, always run tests, inspect logs, or assert states.
- Clean Code: Prefer concise, readable, modern idiomatic constructs over over-engineered patterns.
```

---

## 5. Hệ Thống Công Cụ & Tự Động Hóa (Tooling & Computer Use)

Hermes Agent tích hợp bộ công cụ native mạnh mẽ, được tối ưu riêng biệt cho mô hình Hermes qua native function calling tokens (`<tool_call>`, `<tool_response>`):

### 5.1. Nhóm Công Cụ Cốt Lõi (Core Built-ins)
1. **Terminal / Bash Tool**:
   - Cho phép agent chạy command line trực tiếp trong môi trường của người dùng.
   - Hỗ trợ cả hai chế độ: Chạy đồng bộ (chờ kết quả) và chạy nền (Background Daemon Tasks cho dev servers, web workers, polling cron).
   - Cơ chế phát hiện output dài: Tự động phân trang hoặc tóm tắt log để tránh tràn Context Window.
2. **File Operations**:
   - `read_file` (hỗ trợ đọc phân đoạn dòng lớn, byte offset).
   - `write_file` (tạo mới và ghi đè an toàn).
   - `patch_file` / `replace_file_content` (thay thế khối code chính xác theo diff, giảm thiểu token so với việc viết lại cả file).
3. **Web Search & Extraction**:
   - Tích hợp tìm kiếm thông tin cập nhật thời gian thực (Brave Search, DuckDuckGo, Tavily hoặc Serper).
   - Trình phân tích markdown chuyển đổi trang HTML sạch sẽ không chứa rác CSS/JS.
4. **Browser Automation (`agent-browser`)**:
   - Điều khiển Chromium headless thực hiện thao tác người dùng (click, type, scroll, take screenshot, extract DOM snapshot).
   - Vượt qua các trang web SPA phức tạp đòi hỏi hydrate JavaScript.
5. **Computer-Use Agent (`cua-driver`)**:
   - Khả năng tương tác trực tiếp với giao diện Desktop OS (nhận diện tọa độ pixel màn hình, click, kéo thả, tổ hợp phím).

### 5.2. Cơ Chế An Toàn, Checkpoint & Rollback
- **Safety Levels**: Cho phép cấu hình mức độ tin cậy từ `read-only`, `interactive-ask` (hỏi xác nhận trước các lệnh nguy hiểm như `rm -rf`, `git push --force`, `drop table`), đến `full-autonomous`.
- **Git Worktree Isolation**: Cho phép agent tạo các workspace cô lập qua git worktree để thử nghiệm các refactor lớn mà không ảnh hưởng đến working branch của lập trình viên.
- **Rollback Tree**: Lưu lại checkpoint trước mỗi lần chỉnh sửa file. Nếu agent đi vào ngõ cụt hoặc làm hỏng mã nguồn, người dùng có thể kích hoạt rollback chỉ bằng một lệnh `/rollback`.

---

## 6. Cơ Chế Tự Học & Quản Trị Kỹ Năng (Continuous Learning & Skills)

Một trong những tính năng tiên phong của Hermes Agent là khả năng **tự đúc kết kinh nghiệm** thông qua hệ thống **Curator**:

```
[Người Dùng Ra Lệnh Phức Tạp]
           │
           ▼
[Hermes Thử Nghiệm, Sửa Lỗi, Gọi Nhiều Tool Thành Công]
           │
           ▼
[Agent Curator Phân Tích Lịch Sử Phiên Làm Việc]
  - Lọc bỏ các bước sai lầm, lệnh lỗi (trial-and-error noise)
  - Trích xuất logic giải thuật cốt lõi và các tham số tối ưu
           │
           ▼
[Tổng Hợp Thành File SKILL.md Mới]
  - Lưu vào ~/.hermes/skills/<skill-name>/SKILL.md
           │
           ▼
[Các Phiên Làm Việc Tương Lai Tự Động Kích Hoạt Kỹ Năng Này Khi Gặp Bài Toán Tương Tự]
```

### Cấu Trúc Một File Kỹ Năng (`SKILL.md`)
```markdown
---
name: nextjs-migration-helper
description: Tự động quét và chuyển đổi Next.js Pages Router sang App Router
triggers:
  - "migrate next.js"
  - "convert pages router to app router"
---

# Instructions
1. Quét cây thư mục `pages/` tìm các route tương ứng.
2. Tạo cấu trúc thư mục mới trong `src/app/` với `page.tsx`, `layout.tsx`.
3. Thay thế các hook `useRouter` từ `next/router` sang `next/navigation`.
4. Chạy `npx tsc --noEmit` để xác thực kiểu dữ liệu.
```

---

## 7. Kiến Trúc Bộ Nhớ Đa Tầng (Memory & State Architecture)

Hermes giải quyết triệt để vấn đề mất trí nhớ (context loss) qua 3 tầng:

1. **Working Memory (Bộ nhớ đệm ngắn hạn)**:
   - Lưu trữ các biến, trạng thái file vừa đọc, suy nghĩ tức thời (scratchpad).
2. **Episodic Memory (Bộ nhớ sự kiện theo phiên)**:
   - Ghi lại các tương tác trước đây, các câu hỏi và quyết định kiến trúc đã thống nhất giữa user và agent.
3. **Semantic Long-Term Memory (Bộ nhớ ngữ nghĩa dài hạn)**:
   - Sử dụng SQLite kết hợp với vector extension (`sqlite-vec`).
   - Tự động tóm tắt và index các đoạn hội thoại quan trọng thành embeddings.
   - Hỗ trợ kết nối các nhà cung cấp bên ngoài như **Mem0** hoặc **Zep**.

---

## 8. Hệ Thống Multi-Platform Gateways (Nhắn Tin Đa Kênh)

Hermes Agent có thể hoạt động như một dịch vụ nền (Daemon) kết nối với mọi ứng dụng chat thông dụng:

- **Telegram Gateway**: Tương tác qua bot Telegram (hỗ trợ voice message, tự động transcribe âm thanh qua Whisper, gửi file, chạy terminal).
- **Discord Gateway**: Bot tham gia máy chủ, phản hồi theo thread, phân quyền theo role.
- **Slack Gateway**: Tích hợp cho đội ngũ kỹ thuật doanh nghiệp, trả lời trong channel hoặc direct message.
- **WhatsApp & Signal**: Hỗ trợ giao tiếp bảo mật cá nhân qua số điện thoại.
- **Matrix & Mattermost**: Hỗ trợ hạ tầng chat tự host hoàn toàn phi tập trung.
- **Email & SMS (Twilio)**: Tự động hóa tác vụ nhận và phản hồi email/tin nhắn khẩn cấp.

---

## 9. Hỗ Trợ Mô Hình & Providers

Hermes Agent hoàn toàn linh hoạt trong việc cấu hình Model:
- **Nous Portal**: Cổng truy cập chính thức của Nous Research với các mô hình Hermes mới nhất được finetune đặc biệt.
- **OpenRouter**: Truy cập hàng trăm mô hình mã nguồn mở và thương mại.
- **Local Models (Ollama, vLLM, SGLang, llama.cpp)**: Chạy hoàn toàn offline trên GPU nội bộ (RTX 4090, Mac Studio M2/M3/M4 Ultra) mà không rò rỉ dữ liệu.
- **Commercial APIs**: Anthropic (Claude 3.7 Sonnet / Opus), OpenAI (GPT-4o, o3-mini), Google Gemini (Gemini 2.5 Flash / Pro).

---

## 10. Chiến Lược Tích Hợp Hermes Agent Với AG-Proxy (AG Proxy Integration Strategy)

Hệ thống **AG-Proxy** hiện tại của chúng ta hoàn toàn có thể trở thành **hạ tầng trung tâm (Central Intelligence Gateway)** quản lý các instance của Hermes Agent:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AG PROXY CONTROL PLANE                          │
│   (Dashboard: Quản lý Quota, Token, Multi-Account, Routing, Analytics) │
└──────────────────┬──────────────────────────────────┬──────────────────┘
                   │                                  │
                   ▼                                  ▼
      ┌─────────────────────────┐        ┌─────────────────────────┐
      │   Hermes Agent Pool A   │        │   Hermes Agent Pool B   │
      │   (Coding & Terminal)   │        │   (Telegram Gateway)    │
      └────────────┬────────────┘        └────────────┬────────────┘
                   │                                  │
                   ▼                                  ▼
       ┌──────────────────────────────────────────────────┐
       │   Smart Load Balancer & Provider Failover Pool   │
       │   (Antigravity / Nous / OpenAI / Claude / Local) │
       └──────────────────────────────────────────────────┘
```

### Các Tính Năng Hợp Lực Giữa AG-Proxy & Hermes Agent:
1. **Dynamic Quota & Account Rotation cho Hermes**:
   - Khi Hermes Agent chạy các tác vụ duyệt web hay code execution tiêu tốn hàng triệu token, AG-Proxy tự động luân phiên giữa các tài khoản và API keys nhằm tối ưu chi phí và tránh rate-limit (429 Too Many Requests).
2. **Fallback Tự Động (Smart Failover)**:
   - Nếu mô hình chính gặp sự cố, AG-Proxy điều hướng prompt của Hermes sang mô hình dự phòng mà không làm gián đoạn Agentic Loop.
3. **Giám Sát Chi Phí & Token Realtime**:
   - Mọi tool call, token vào/ra của các phiên Hermes Agent sẽ hiển thị trực quan trên giao diện Dashboard shadcn của AG-Proxy.
4. **Đồng Bộ Hoá Kỹ Năng & `SOUL.md` Tập Trung**:
   - AG-Proxy có thể cung cấp API chia sẻ các bản sắc (`SOUL.md`) và thư viện kỹ năng (`SKILL.md`) giữa các máy trong toàn bộ team phát triển.

---
*Tài liệu được biên soạn đồng bộ với phiên bản kiến trúc mới nhất của Hermes Agent và chuẩn hoá cho hệ thống AG-Proxy.*
