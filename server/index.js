const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// 根路径重定向到登录页面（优先于静态托管）
app.get('/', (_req, res) => { res.redirect('/login.html'); });
// 静态托管父目录（让前端文件可以直接从 / 访问）
app.use('/', express.static(path.resolve(__dirname, '..')));
// 为中文目录“歌曲”提供 ASCII 路径别名，避免编码兼容问题
app.use('/songs', express.static(path.resolve(__dirname, '..', '歌曲')));

// ===== 配置加载：支持环境变量与本地配置文件 =====
function loadLocalConfig() {
    try {
        const cfgPath = path.resolve(__dirname, 'config.local.json');
        if (fs.existsSync(cfgPath)) {
            const raw = fs.readFileSync(cfgPath, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        // 忽略本地配置解析错误
    }
    return {};
}

const localCfg = loadLocalConfig();
const deepseekUrl = process.env.DEEPSEEK_API_URL || localCfg.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const deepseekKey = process.env.DEEPSEEK_API_KEY || localCfg.DEEPSEEK_API_KEY || '';
const deepseekKeyHeader = process.env.DEEPSEEK_API_KEY_HEADER || localCfg.DEEPSEEK_API_KEY_HEADER || 'Authorization';
const model = process.env.DEEPSEEK_MODEL || localCfg.DEEPSEEK_MODEL || 'deepseek-chat';
const enableMock = String(process.env.ENABLE_MOCK || localCfg.ENABLE_MOCK || 'false').toLowerCase() === 'true';

// ===== 在线人数（心跳 + 统计） =====
const ONLINE_TIMEOUT_MS = Number(process.env.ONLINE_TIMEOUT_MS || localCfg.ONLINE_TIMEOUT_MS || 120000);
const onlineMap = new Map(); // clientId -> { user, role, lastSeen }
function getClientIp(req) {
  try {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.trim()) {
      const first = xf.split(',')[0].trim();
      if (first) return first;
    }
    const ip = (req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || req.ip;
    return String(ip || '').replace('::ffff:', '');
  } catch {
    return '';
  }
}
function pruneOnline() {
  const now = Date.now();
  for (const [id, info] of onlineMap.entries()) {
    if (!info || (now - (info.lastSeen || 0)) > ONLINE_TIMEOUT_MS) {
      onlineMap.delete(id);
    }
  }
}
setInterval(pruneOnline, Math.min(ONLINE_TIMEOUT_MS, 60000));

// ===== 简单登录：默认账号与密码（演示用） =====
const defaultAccounts = [
  { account: 'admin', password: 'admin', role: 'user' },
  { account: '佟雨泽', password: '20050812', role: 'admin' },
];

// ===== 用户存储（演示持久化到 server/users.json） =====
const USERS_PATH = path.resolve(__dirname, 'users.json');
function loadUsers() {
  try {
    if (fs.existsSync(USERS_PATH)) {
      const raw = fs.readFileSync(USERS_PATH, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  return defaultAccounts.slice();
}
let users = loadUsers();
function saveUsers() {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch {}
}

function decodeHeaderVal(v) {
  try {
    return decodeURIComponent(String(v || ''));
  } catch {
    return String(v || '');
  }
}

// 配置状态查询（不泄露密钥）
app.get('/api/config/status', (_req, res) => {
    res.json({
        deepseekUrl,
        model,
        keyHeader: deepseekKeyHeader,
        keyProvided: Boolean(deepseekKey && deepseekKey !== 'YOUR_API_KEY_HERE'),
        mockEnabled: enableMock,
    });
});

// 登录接口：校验用户存储中的账号与密码
app.post('/api/login', (req, res) => {
  const { account, password } = req.body || {};
  if (!account || !password) return res.status(400).json({ ok: false, error: '缺少账号或密码' });
  const found = users.find(u => String(u.account) === String(account) && String(u.password) === String(password));
  if (!found) return res.status(401).json({ ok: false, error: '账号或密码不正确' });
  return res.json({ ok: true, role: found.role, user: { name: found.account } });
});

// 调试：查看当前用户存储（仅本地开发用）
app.get('/api/debug/users', (_req, res) => {
  try {
    res.json({ ok: true, users });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 调试：查看请求头（便于核对管理员头是否传入）
app.get('/api/debug/headers', (req, res) => {
  try {
    res.json({ ok: true, headers: req.headers });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 注册接口：创建新用户（演示用途，不做加密）
app.post('/api/register', (req, res) => {
  const { account, password } = req.body || {};
  const name = String(account || '').trim();
  const pwd = String(password || '').trim();
  if (!name || !pwd) return res.status(400).json({ ok: false, error: '缺少账号或密码' });
  if (name.length < 2) return res.status(400).json({ ok: false, error: '账号长度至少 2 个字符' });
  if (pwd.length < 6) return res.status(400).json({ ok: false, error: '密码长度至少 6 位' });
  const exists = users.some(u => String(u.account) === name);
  if (exists) return res.status(409).json({ ok: false, error: '账号已存在' });
  const newUser = { account: name, password: pwd, role: 'user' };
  users.push(newUser);
  saveUsers();
  return res.json({ ok: true, role: newUser.role, user: { name: newUser.account } });
});

app.post('/api/ask', async (req, res) => {
    const { question } = req.body || {};
    if (!question) return res.status(400).json({ error: '缺少 question 字段' });

    // 未配置时走本地 mock（可开关）
    if (!deepseekKey || deepseekKey === 'YOUR_API_KEY_HERE') {
        if (enableMock) {
            return res.json({
                source: 'mock',
                answer: `【本地演示】你问的是：${question}\n这是演示模式返回的占位回答。请配置 DEEPSEEK_API_KEY 以启用真实回答。`,
            });
        }
        return res.status(500).json({ error: '后端未配置 DeepSeek（请设置环境变量或 server/config.local.json）' });
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (deepseekKeyHeader.toLowerCase() === 'authorization') headers['Authorization'] = `Bearer ${deepseekKey}`;
        else headers[deepseekKeyHeader] = deepseekKey;

        const body = {
            model,
            messages: [
                { role: 'system', content: `直接回答用户问题，简洁，人性化，有人情味，直接输出回答，不要输出其他无关内容”` },
                { role: 'user', content: question }
            ]
        };

        const resp = await fetch(deepseekUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const txt = await resp.text();
            return res.status(502).json({ error: 'DeepSeek 返回错误', details: txt });
        }

        const data = await resp.json();
        const answer = data?.choices?.[0]?.message?.content
            || data?.answer
            || data?.result
            || (data?.data && data.data.answer)
            || null;
        res.json({ source: 'deepseek', answer: answer || JSON.stringify(data), raw: data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 心跳：记录（或更新）客户端在线状态
app.post('/api/online/heartbeat', (req, res) => {
  const { clientId, user, role } = req.body || {};
  if (!clientId || !user) return res.status(400).json({ ok: false, error: '缺少 clientId 或 user' });
  const ip = getClientIp(req);
  onlineMap.set(String(clientId), { user: String(user), role: String(role || 'user'), ip, lastSeen: Date.now() });
  pruneOnline();
  res.json({ ok: true });
});

// 下线：主动移除客户端记录（可选）
app.post('/api/online/offline', (req, res) => {
  const { clientId } = req.body || {};
  if (clientId) onlineMap.delete(String(clientId));
  pruneOnline();
  res.json({ ok: true });
});

// 统计：返回当前在线的唯一用户数（按用户名去重）
app.get('/api/online/count', (_req, res) => {
  pruneOnline();
  const now = Date.now();
  const users = new Set();
  for (const info of onlineMap.values()) {
    if (info && (now - (info.lastSeen || 0)) <= ONLINE_TIMEOUT_MS) {
      users.add(info.user);
    }
  }
  res.json({ ok: true, count: users.size });
});

// 管理员查看在线列表（含 IP）
app.get('/api/online/list', (req, res) => {
  pruneOnline();
  const authUser = String(req.headers['x-auth-user'] || '');
  const authRole = String(req.headers['x-auth-role'] || '');
  const authUserDec = decodeHeaderVal(authUser);
  const isAdmin = authUserDec && authRole === 'admin' && users.some(u => String(u.account) === authUserDec && String(u.role) === 'admin');
  if (!isAdmin) return res.status(403).json({ ok: false, error: '仅管理员可访问在线列表' });

  const now = Date.now();
  const sessions = [];
  for (const [clientId, info] of onlineMap.entries()) {
    if (info && (now - (info.lastSeen || 0)) <= ONLINE_TIMEOUT_MS) {
      sessions.push({ clientId, user: info.user, role: info.role, ip: info.ip || '', lastSeen: info.lastSeen });
    }
  }
  res.json({ ok: true, count: sessions.length, sessions });
});

// ===== 论坛持久化（帖子与评论） =====
const FORUM_PATH = path.resolve(__dirname, 'forum.json');
function loadForum() {
  try {
    if (fs.existsSync(FORUM_PATH)) {
      const raw = fs.readFileSync(FORUM_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.posts)) return data;
      if (Array.isArray(data)) return { posts: data }; // 兼容旧格式
    }
  } catch {}
  return { posts: [] };
}
function saveForum(data) {
  try { fs.writeFileSync(FORUM_PATH, JSON.stringify({ posts: data.posts || [] }, null, 2), 'utf8'); } catch {}
}
function findPostById(posts, id) {
  return posts.find(p => String(p.id) === String(id));
}
function isAdminReq(req) {
  const authUser = String(req.headers['x-auth-user'] || '');
  const authRole = String(req.headers['x-auth-role'] || '');
  const authUserDec = decodeHeaderVal(authUser);
  return authUserDec && authRole === 'admin' && users.some(u => String(u.account) === authUserDec && String(u.role) === 'admin');
}

// 获取帖子列表
app.get('/api/forum/posts', (_req, res) => {
  const forum = loadForum();
  return res.json({ ok: true, posts: forum.posts });
});

// 发表新帖
app.post('/api/forum/post', (req, res) => {
  const { id, author, content, ts, likes, comments, tags, reactions, pinned, images } = req.body || {};
  const text = String(content || '').trim();
  if (!text) return res.status(400).json({ ok: false, error: '内容不能为空' });
  const now = Date.now();
  const forum = loadForum();
  const newPost = {
    id: id || now,
    author: String(author || '匿名'),
    content: text,
    ts: ts || now,
    likes: Number(likes || 0),
    comments: Array.isArray(comments) ? comments : [],
    tags: Array.isArray(tags) ? tags : [],
    reactions: reactions && typeof reactions === 'object' ? reactions : {},
    pinned: Boolean(pinned),
    images: Array.isArray(images) ? images : [],
  };
  forum.posts.push(newPost);
  saveForum(forum);
  return res.json({ ok: true, post: newPost });
});

// 新增评论
app.post('/api/forum/comment', (req, res) => {
  const { id, author, content, images } = req.body || {};
  const text = String(content || '').trim();
  if (!id || !text) return res.status(400).json({ ok: false, error: '缺少帖子ID或评论内容' });
  const forum = loadForum();
  const p = findPostById(forum.posts, id);
  if (!p) return res.status(404).json({ ok: false, error: '帖子不存在' });
  p.comments = p.comments || [];
  p.comments.push({ author: String(author || '匿名'), content: text, ts: Date.now(), images: Array.isArray(images) ? images : [] });
  saveForum(forum);
  return res.json({ ok: true });
});

// 点赞
app.post('/api/forum/like', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: '缺少帖子ID' });
  const forum = loadForum();
  const p = findPostById(forum.posts, id);
  if (!p) return res.status(404).json({ ok: false, error: '帖子不存在' });
  p.likes = Number(p.likes || 0) + 1;
  saveForum(forum);
  return res.json({ ok: true, likes: p.likes });
});

// 置顶/取消置顶（管理员）
app.post('/api/forum/pin', (req, res) => {
  if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以置顶' });
  const { id, pinned } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: '缺少帖子ID' });
  const forum = loadForum();
  const p = findPostById(forum.posts, id);
  if (!p) return res.status(404).json({ ok: false, error: '帖子不存在' });
  p.pinned = Boolean(pinned);
  saveForum(forum);
  return res.json({ ok: true, pinned: p.pinned });
});

// 删除帖子（管理员）
app.post('/api/forum/delete', (req, res) => {
  if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以删除' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: '缺少帖子ID' });
  const forum = loadForum();
  const before = forum.posts.length;
  forum.posts = forum.posts.filter(p => String(p.id) !== String(id));
  if (forum.posts.length === before) return res.status(404).json({ ok: false, error: '帖子不存在或已删除' });
  saveForum(forum);
  return res.json({ ok: true });
});

app.listen(PORT, async () => {
  console.log(`Server started on http://localhost:${PORT}`);
  try {
    const { default: open } = await import('open');
    await open(`http://localhost:${PORT}/login.html`);
  } catch (e) {
    console.log('Auto-open login page failed:', e.message);
  }
});
// 根路径重定向逻辑已提前在静态托管之前声明