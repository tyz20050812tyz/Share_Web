# 以史为鉴，凝聚力量 - 红色文化教育平台

一个集成了智能问答、互动学习、创作竞赛、趣味射击游戏等功能的综合性红色文化教育网站。采用响应式设计，支持多用户登录、权限管理、数据持久化等完整功能。

## 🌟 核心功能

### 1. 智能问答系统 (ai.html)
- **AI对话功能**：接入DeepSeek API，支持自定义系统提示词
- **本地Mock模式**：未配置API时可使用演示回答
- **配置状态查询**：`GET /api/config/status` 返回配置状态

### 2. 互动学习中心 (challenge.html)
#### 知识答题挑战
- **2分钟限时答题**：每次会话120秒，连续答题模式
- **150道题库**：与射击游戏共享题库，保证题目不重复
- **不重复机制**：每次会话中同一题目不会出现两次
- **成就系统**：连续答对、累计答对等多种成就徽章
- **错题本**：自动记录错题，支持复习回顾
- **多用户排行榜**：服务端存储，实时更新全站排名

#### AI历史人物对话
- **5位抗日英雄**：杨靖宇、赵一曼、狼牙山五壮士、左权、张自忠
- **真实人物头像**：使用历史照片，增强沉浸感
- **角色扮演AI**：基于真实历史背景的对话系统
- **人物介绍**：详细的生平事迹和历史贡献

### 3. 创作竞赛平台 (contest.html)
- **竞赛主页**：展示所有正在进行的竞赛活动
- **作品投稿** (contest_submit.html)：支持文本、图片、视频等多种形式
- **作品详情** (contest_detail.html)：展示作品内容、投票、评论
- **草稿保存**：支持保存草稿，随时继续编辑
- **投票系统**：用户可为优秀作品投票
- **浏览量统计**：自动记录作品浏览次数
- **成就激励**：首次投稿、获得投票等成就系统

### 4. 趣味射击游戏 (game.html)
- **三种难度**：简单、普通、困难，不同的敌人速度和生成间隔
- **150道题目**：答对题目才能射击敌人
- **音效控制**：独立的音效和背景音乐开关
- **得分系统**：难度越高得分倍数越高
- **成绩统计**：记录各难度最佳成绩

### 5. 3D历史文物展馆 (models.html)
- **6个3D模型**：嵌入式Sketchfab展示
- **交互式浏览**：支持360度旋转、缩放
- **文物介绍**：详细的历史背景说明

### 6. 讨论区 (discuss.html)
- **发帖功能**：登录用户可发表话题
- **评论系统**：支持多级评论回复
- **权限管理**：管理员可置顶、删除帖子
- **作者标识**：自动显示发帖用户名

### 7. 个人中心 (profile.html)
- **四大模块**：讨论区、创作竞赛、趣味射击、互动学习
- **数据统计**：各模块的参与数据和成就展示
- **最近活动**：展示最近的发帖、投稿、答题记录
- **成就展示**：获得的各种成就徽章

### 8. 用户系统
- **登录功能** (login.html)：支持账号/邮箱登录
- **注册功能** (register.html)：新用户注册，默认角色为user
- **找回密码** (forgot.html)：三步式重置流程（账号验证→旧密码验证→新密码设置）
- **在线人数**：实时显示当前在线用户数
- **权限控制**：管理员和普通用户不同权限
- **访问拦截**：未登录自动跳转到登录页

## 📁 项目结构

```
网站/
├── README.md                    # 项目说明文档
├── index.html                   # 网站主页
├── ai.html                      # 智能问答页面
├── ai.js                        # 智能问答逻辑
├── challenge.html               # 互动学习中心
├── challenge.js                 # 互动学习逻辑
├── game.html                    # 趣味射击游戏
├── game.js                      # 游戏逻辑与题库（150题）
├── models.html                  # 3D文物展馆
├── contest.html                 # 创作竞赛主页
├── contest_submit.html          # 作品投稿页
├── contest_detail.html          # 作品详情页
├── contest.js                   # 竞赛逻辑
├── discuss.html                 # 讨论区
├── profile.html                 # 个人中心
├── login.html                   # 登录页面
├── login.js                     # 登录逻辑
├── login.css                    # 登录页样式
├── register.html                # 注册页面
├── register.js                  # 注册逻辑
├── forgot.html                  # 找回密码页面
├── forgot.js                    # 找回密码逻辑
├── knowledge.html               # 知识分享
├── culture.html                 # 文化传播
├── style.css                    # 全局样式
├── main.js                      # 全局脚本（导航、拦截、用户栏）
├── run_website.bat              # Windows一键启动脚本
├── images/                      # 图片资源
│   ├── LOGO.png                 # 网站Logo
│   ├── 杨靖宇.jpg               # 历史人物头像
│   ├── 赵一曼.jpg
│   ├── 狼牙山五壮士.jpg
│   ├── 左权.jpg
│   ├── 张自忠.jpg
│   └── ...
├── 歌曲/                        # 音频资源
└── server/                      # 后端服务
    ├── index.js                 # Express服务入口
    ├── package.json             # 后端依赖配置
    ├── users.json               # 用户数据
    ├── forum.json               # 讨论区数据
    ├── contests.json            # 竞赛数据
    ├── submissions.json         # 投稿数据
    ├── quiz_rankings.json       # 答题排行榜
    └── config.local.json        # 本地配置（可选）
```

## 🚀 快速开始

### 系统要求
- Node.js ≥ 16
- npm 包管理器

### 启动方式

#### 方式 A：Windows 一键启动（推荐）
```bash
双击 run_website.bat
```
- 自动检测Node.js环境
- 自动安装依赖
- 在端口 3001 启动服务
- 自动打开浏览器

#### 方式 B：命令行启动
```bash
cd server
npm install
npm start
```
- 默认端口 3000
- 自动打开登录页 `http://localhost:3000/login.html`

#### 自定义端口
```bash
# PowerShell
$env:PORT=4000; npm start

# Linux/Mac
PORT=4000 npm start
```

## 👤 默认账号

### 管理员账号
- 账号：`佟雨泽`
- 密码：`20050812`
- 权限：可置顶/删除帖子、查看所有用户数据

### 普通用户
- 账号：`admin`
- 密码：`admin`
- 权限：基础功能使用

> 💡 提示：可通过注册页面创建新账号，默认角色为普通用户

## 🔧 配置说明

### DeepSeek API 配置（可选）

在 `server/config.local.json` 中配置：

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

### 配置项说明
- `DEEPSEEK_API_URL`：DeepSeek API 地址
- `DEEPSEEK_API_KEY`：API密钥（**请勿上传到Git**）
- `DEEPSEEK_MODEL`：模型名称
- `ENABLE_MOCK`：未配置API时是否启用Mock回答
- `ONLINE_TIMEOUT_MS`：在线心跳超时时间（毫秒）

> ⚠️ 安全提示：请将 `config.local.json` 添加到 `.gitignore`，避免泄露密钥

## 🛠️ 主要API接口

### 用户认证
- `POST /api/login` - 用户登录
- `POST /api/register` - 用户注册
- `POST /api/check-account` - 检查账号是否存在
- `POST /api/verify-password` - 验证旧密码
- `POST /api/reset-password` - 重置密码

### 在线状态
- `POST /api/online/heartbeat` - 上报心跳
- `POST /api/online/offline` - 下线通知
- `GET /api/online/count` - 获取在线人数

### 智能问答
- `POST /api/ask` - 提交问题
- `GET /api/config/status` - 获取配置状态

### 创作竞赛
- `GET /api/submissions` - 获取投稿列表（支持userId/author/contestId筛选）
- `POST /api/submissions` - 提交作品
- `GET /api/submissions/:id` - 获取作品详情
- `POST /api/submissions/:id/vote` - 投票
- `POST /api/submissions/:id/view` - 增加浏览量

### 答题排行榜
- `GET /api/quiz/rankings` - 获取排行榜
- `POST /api/quiz/submit-score` - 提交成绩

## 📊 数据存储

### 本地存储（localStorage）
- `login_user`：当前登录用户名
- `login_role`：用户角色（admin/user）
- 个人游戏数据、答题统计等

### 服务端存储（JSON文件）
- `users.json`：用户账号信息
- `forum.json`：讨论区帖子
- `contests.json`：竞赛信息
- `submissions.json`：投稿作品
- `quiz_rankings.json`：答题排行榜

## 🎨 主题与样式

### 主题变量（style.css）
```css
--accent: #c62828;          /* 主强调色（红色） */
--bg: #f5f5f5;              /* 页面背景 */
--surface: #ffffff;         /* 卡片背景 */
--text: #333333;            /* 正文颜色 */
--border: #e0e0e0;          /* 边框颜色 */
--radius: 12px;             /* 圆角半径 */
--shadow: 0 2px 8px rgba(0,0,0,0.1);  /* 阴影 */
```

### 响应式设计
- 桌面端：完整功能和布局
- 平板端：优化的网格布局
- 移动端：单列布局，触摸友好

## 🔐 权限系统

### 管理员权限
- 置顶/删除讨论区帖子
- 查看所有用户数据
- 管理竞赛作品

### 普通用户权限
- 发帖、评论
- 投稿作品、投票
- 参与答题、游戏
- 查看个人数据

### 访问控制
- 未登录用户只能访问：登录页、注册页、找回密码页、主页
- 其他页面自动重定向到登录页（由 `main.js` 实现）

## 🎯 特色功能

### 1. 题库共享机制
- 互动学习和射击游戏共享150道题库
- 动态加载，避免代码重复
- 题目涵盖反法西斯战争、抗战历史、英雄事迹等

### 2. 不重复答题算法
- 使用 `usedQuestions` 数组追踪已出现题目
- 从未使用的题目中随机选择
- 答完所有题后自动重置

### 3. 多用户排行榜
- 服务端统一存储
- 实时更新排名
- 显示得分、答对题数、总题数

### 4. 成就系统
- 答题成就：青铜/白银/黄金勋章、满分达人
- 竞赛成就：首次投稿、人气作品
- 游戏成就：高分记录、难度挑战

### 5. AI角色扮演
- 基于真实历史人物背景
- 使用systemPrompt定制角色性格
- 真实人物头像增强代入感

## ❓ 常见问题

### Q: 自动打开浏览器失败？
A: 手动访问 `http://localhost:3000/login.html`（或端口3001）

### Q: DeepSeek未配置怎么办？
A: 启用Mock模式（`ENABLE_MOCK: "true"`），使用演示回答

### Q: 如何清除登录状态？
A: 点击页面顶部"退出登录"按钮，或清除localStorage

### Q: 注册失败（账号已存在）？
A: 更换用户名，或编辑 `server/users.json` 删除重复账号

### Q: 在线人数不更新？
A: 确保后端运行中，等待20秒刷新周期，或重新登录

### Q: 端口被占用？
A: 使用自定义端口启动：`$env:PORT=4000; npm start`

### Q: 题目重复出现？
A: 检查浏览器控制台是否有加载错误，确保 `game.js` 正确加载

## 📝 开发规范

### 页面结构
所有页面必须包含：
- `<header class="site-header">` - 统一的顶部导航
- `<main class="wrap">` - 主要内容区域
- `<footer class="site-footer">` - 页脚信息

### 导航栏
- 使用 `<nav class="main-nav">`
- 保持所有页面链接内容、顺序一致

### 版本号控制
- script标签添加版本号：`?v=5.0`
- 强制浏览器加载最新文件
- 修改代码后记得更新版本号

### 数据加载
- 优先使用服务端API加载数据
- 避免硬编码静态数据
- 异步加载使用 async/await

## 🔄 更新日志

### v5.0 (2025-11-02)
- ✨ AI历史人物对话使用真实头像
- ✨ 优化头像显示样式（圆形+边框）
- 🎨 统一人物卡片和消息头像样式

### v4.0
- ✨ 答题题库扩展到150题
- ✨ 实现题目不重复机制
- 🔧 题库与射击游戏共享

### v3.0
- ✨ 找回密码功能（三步式验证）
- 🐛 修复forgot.js语法错误
- 🔧 个人中心创作记录从服务器加载

### v2.0
- ✨ 个人中心完整版（四大模块）
- ✨ 创作竞赛平台上线
- ✨ 互动学习中心（答题+AI对话）
- ✨ 3D文物展馆

### v1.0
- 🎉 项目初始版本
- ✨ 基础页面和导航
- ✨ 用户登录注册系统
- ✨ 讨论区功能

## 📄 许可证

本项目仅用于教育学习目的。

## 👥 贡献者

- 项目开发：佟雨泽
- 指导老师：[您的老师姓名]

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- Email: [您的邮箱]
- GitHub: [您的GitHub]

---

**以史为鉴，凝聚力量** - 让红色文化在新时代焕发光彩 🇨🇳
