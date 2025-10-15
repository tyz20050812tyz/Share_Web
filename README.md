# 以史为鉴，凝聚力量 — README（完善版）

一个简洁、响应式的中文网站，包含主页、智能问答、知识分享、文化传播、讨论区等页面，并配套登录/忘记密码流程与基础权限控制。后端使用 Node.js + Express 提供静态资源与演示 API（含 DeepSeek 代理示例）。

## 功能亮点
- 响应式设计：桌面与移动端均有良好体验（统一 `style.css` 主题变量）。
- 统一视觉语言：按钮、卡片、网格、导航等组件样式一致。
- 登录与权限：
  - 已接入后端 `/api/login` 接口，验证默认账号。
  - 全局访问拦截：未登录用户仅可访问 `/login.html`、`/forgot.html` 与 `/`；其他页面自动重定向到登录页（由 `main.js` 实现）。
  - 服务器根路径优先重定向到登录页（路由顺序已优化，避免直接返回 `index.html`）。
  - 页面顶部自动显示“当前用户”与“退出登录”按钮（登录后）。
- 讨论区权限：管理员可见“置顶”“删除”按钮，普通用户不可见；发帖作者默认取当前登录用户名。
- 智能问答：可配置 DeepSeek API；未配置时可启用本地 Mock 演示。
- 一键启动：Windows 下提供 `run_website.bat`，或使用 Node 命令快速启动。
 - 注册功能：提供注册页与接口，默认角色 `user`，持久化到 `server/users.json`（演示版为明文存储）。
 - 在线人数：登录页与登录后顶部显示在线人数，每 20 秒刷新；未登录仅显示统计，不参与心跳。

## 目录结构
```
网站/
├── README.md                # 本说明文档
├── index.html               # 主页
├── ai.html                  # 智能问答页面
├── ai.js                    # 智能问答前端脚本
├── knowledge.html           # 知识分享
├── culture.html             # 文化传播
├── discuss.html             # 讨论区
├── login.html               # 登录页（无顶部导航）
├── login.css                # 登录页专用样式（与全站变量一致）
├── login.js                 # 登录页交互脚本（校验/显隐/提示）
├── forgot.html              # 忘记密码占位页
├── forgot.js                # 忘记密码交互脚本
├── register.html            # 注册页
├── register.js              # 注册页交互脚本
├── style.css                # 全站样式与主题变量
├── main.js                  # 通用交互脚本
├── run_website.bat          # Windows 快捷启动脚本
├── images/                  # 站点图片资源
├── 歌曲/                    # 音频资源（后端提供 /songs 别名）
└── server/                  # 后端服务（Express）
    ├── index.js             # 服务入口（静态托管、API、自动打开登录页）
    ├── package.json         # 后端依赖与启动命令
    ├── package-lock.json
    ├── README.md            # 后端说明
    └── config.local.json    # 可选：本地配置（DeepSeek 等）
```

## 快速开始
- 系统要求：建议 Node.js ≥ 16 与 npm。
- 启动方式 A（Windows 一键脚本）：双击 `run_website.bat`
  - 将在端口 `3001` 启动后端，并自动打开 `http://localhost:3001/index.html`
  - 如未登录，前端会将主页自动重定向到 `login.html`
- 启动方式 B（Node 命令行）：
  1) `cd server`
  2) `npm install`
  3) `npm start`
  - 默认端口 `3000`，自动打开 `http://localhost:3000/login.html`
  - 根路径 `http://localhost:3000/` 会重定向到登录页
  - 静态资源从网站根目录托管，`/songs` 指向中文目录 `歌曲`

提示：如自动打开失败，请手动访问登录页，例如 `http://localhost:3000/login.html` 或脚本的端口 `3001`。

## 登录与访问控制
- 登录页：用户名/邮箱输入、密码输入、登录按钮、“忘记密码”链接；支持前端基础校验与密码显隐。
- 验证接口：调用后端 `/api/login` 验证默认账号，成功后跳转至 `index.html`。
- 会话存储：登录成功后写入 `localStorage`：
  - `login_user`（当前用户名）
  - `login_role`（`admin` 或 `user`）
- 全局访问拦截（`main.js`）：未登录用户访问除 `/login.html`、`/forgot.html` 与 `/` 之外的页面时，自动重定向到登录页。
- 用户栏与退出：登录后在页面顶部显示当前用户名与角色标签，并提供“退出登录”按钮（清除本地存储并返回登录页）。
 - 注册页：`/register.html` 支持新用户注册，后端 `POST /api/register` 校验用户名与密码长度并防重名；成功后提示并跳转登录页。
 - 用户存储：演示将用户持久化到 `server/users.json`（明文密码）；默认角色为 `user`，可手动编辑或删除以重置。
 - 在线人数显示：登录页与登录后顶部右侧显示当前在线的唯一用户数。前端每 20 秒轮询 `/api/online/count`；已登录用户还会向 `/api/online/heartbeat` 上报心跳，退出登录时调用 `/api/online/offline`。

### 默认账号（演示）
- 普通用户：`admin / admin`
- 管理员：`佟雨泽 / 20050812`
> 登录成功后将跳转到 `index.html`，并在页面顶部显示统一导航。

提示：以上账号仅用于演示，请勿用于生产环境。若需要自定义账号，请修改后端的默认账户或接入真实认证服务。

## 讨论区（权限与功能）
- 发帖作者默认取当前登录用户名（从 `localStorage` 读取）。
- 管理员可见并可操作：
  - `置顶`：将帖子固定到列表顶部（按钮仅管理员可见与生效）。
  - `删除`：删除指定帖子（按钮仅管理员可见与生效）。
- 普通用户：不可见上述管理员按钮，保留基本浏览与发帖功能。
- 数据存储：帖子保存在浏览器本地（`localStorage`），仅本机可见；请勿上传敏感信息。

## 主题与样式
- 全局样式位于 `style.css`，核心主题变量（示例）：
  - `--accent`（主强调色）、`--bg`（页面背景）、`--surface`（卡片背景）、`--text`（正文颜色）
  - `--border`（边框）、`--radius`（圆角）、`--shadow`/`--shadow-lg`（阴影）、`--transition`（过渡）
- 登录页样式：
  - `login.css` 提供页面专用微样式（如 `.toggle-pwd`、`.forgot-link`），并沿用全站变量保证一致性。
  - `style.css` 中附加了通用表单类（如 `.login-card`、`.form-input`、`.form-actions` 等）与移动端断点优化。

## 页面与脚本概览
- `index.html`：主页入口（有统一导航）。
- `ai.html` + `ai.js`：智能问答页面与前端调用脚本。
- `knowledge.html` / `culture.html` / `discuss.html`：内容与讨论相关页面。
- `login.html` + `login.js`：登录页与交互脚本（已接入后端认证，演示用）。
- `forgot.html` + `forgot.js`：忘记密码说明与占位交互。
- `style.css` / `login.css`：全局 + 登录专用样式。
- `main.js`：通用交互逻辑（导航、访问拦截、用户栏与退出）。

## 后端 API（演示）
- 基础说明：`server/index.js` 使用 Express，静态托管网站根目录，并提供与 DeepSeek 的交互示例接口。
- 路由：
  - `POST /api/login`
    - 请求体：`{ account: string, password: string }`
    - 行为：验证默认账号密码并返回：`{ ok: true, role: 'user' | 'admin', user: { name } }`
    - 失败：返回 `401` 与错误信息（如“账号或密码不正确”）。
  - `POST /api/register`
    - 请求体：`{ account: string, password: string }`
    - 行为：创建新用户（默认角色 `user`），持久化到 `server/users.json`，返回：`{ ok: true, role, user: { name } }`
    - 失败：返回 `400`（参数不合法）或 `409`（账号已存在）。
  - `GET /api/config/status`
    - 返回当前配置状态（不泄露密钥），示例字段：`deepseekUrl`、`model`、`keyHeader`、`keyProvided`、`mockEnabled`。
  - `POST /api/ask`
    - 请求体：`{ question: string }`
    - 行为：
      - 配置了 `DEEPSEEK_API_KEY`：代理请求 DeepSeek 并返回回答。
      - 未配置但启用 `ENABLE_MOCK=true`：返回本地演示回答。
      - 未配置且未启用 Mock：返回错误。
  - 在线人数相关：
    - `POST /api/online/heartbeat`：上报心跳，记录客户端在线状态：`{ clientId, user, role }`
    - `POST /api/online/offline`：主动下线：`{ clientId }`
    - `GET /api/online/count`：返回唯一在线用户名计数：`{ ok: true, count }`

## 配置（可选）
可在 `server/config.local.json` 中设置下列键（或使用环境变量）：
```json
{
  "DEEPSEEK_API_URL": "https://api.deepseek.com/v1/chat/completions",
  "DEEPSEEK_API_KEY": "YOUR_API_KEY_HERE",
  "DEEPSEEK_API_KEY_HEADER": "Authorization",
  "DEEPSEEK_MODEL": "deepseek-chat",
  "ENABLE_MOCK": "true",
  "ONLINE_TIMEOUT_MS": 120000
}
```
- 环境变量优先级高于本地配置，所有键均可通过环境变量设置。
- `ENABLE_MOCK` 为演示开关；为便于兼容，后端以字符串形式读取（"true" → 开启）。
 - `ONLINE_TIMEOUT_MS`：在线心跳过期时间（毫秒），用于统计在线人数。

> 安全提示：请不要在仓库中保存真实密钥。推荐使用环境变量或在本地未提交的 `config.local.json` 中配置，并确保 `.gitignore` 排除敏感文件。

## 端口与启动行为
- 默认端口：`3000`（Node 命令行启动）。
- 一键脚本端口：`3001`（`run_website.bat`）。
- 修改端口（PowerShell）：
  - `\$env:PORT=4000; npm start`
- 启动后：
  - 自动打开登录页（或主页，未登录将被前端重定向至登录页）。
  - 服务器根路径 `/` 优先重定向到登录页，避免直接返回 `index.html`。

## 常见问题
- 自动打开浏览器失败：
  - 原因：系统默认浏览器调用失败或依赖未安装。
  - 处理：手动访问 `http://localhost:3000/login.html`。
- DeepSeek 未配置：
  - 现象：`POST /api/ask` 返回错误或使用演示回答。
  - 处理：按“配置”章节设置 `DEEPSEEK_API_KEY`。
- 中文资源路径：
  - 后端提供 `/songs` 别名映射到 `歌曲/`，避免路径编码问题。
- 访问主页跳转到登录：
  - 说明：前端访问拦截与后端根路径重定向共同生效；这是预期行为，用于保护非登录用户不进入站内页面。
- 端口占用或连接失败：
  - 说明：浏览器显示 `ERR_CONNECTION_REFUSED` 多为后端未启动或端口冲突。
  - 处理：确认终端中后端已成功启动；或修改端口后重试。
- 清除登录状态：
  - 操作：点击页面顶部“退出登录”按钮，或手动清理浏览器 `localStorage` 中的 `login_user` 与 `login_role`。
 - 注册失败（409 账号已存在）：
   - 处理：更换用户名或编辑/清理 `server/users.json` 中的对应条目。
 - 在线人数不更新：
   - 说明：前端每 20 秒刷新统计，已登录用户会上报心跳。
   - 处理：确保后端正在运行；等待刷新周期；或重新登录触发心跳与离线标记。

## 备注
- 已实现基础登录接口 `/api/login`（演示版），用于验证默认账号与密码并返回角色。
- 欢迎按实际需求扩展页面与交互：
  - 将“清空所有帖子”等敏感操作改为仅管理员可见并校验后端。
  - 登录后根据角色跳转到不同首页或展示不同导航。
  - 为讨论区引入后端持久化与权限校验，替代浏览器本地存储。
  - 深入定制 AI 接口（模型、系统提示、输出格式等）。