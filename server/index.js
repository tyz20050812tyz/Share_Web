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

// ===== 简单登录：移除默认账号，必须注册自己的账号 =====

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
    // 默认无预置用户，需通过注册创建
    return [];
}
let users = loadUsers();
// 确保“佟雨泽”管理员账号始终存在
function ensureAdminPresence() {
    try {
        const requiredAdmin = { account: '佟雨泽', password: '20050812', role: 'admin' };
        const exists = users.some(u => String(u.account) === requiredAdmin.account);
        if (!exists) {
            users.push(requiredAdmin);
            saveUsers();
        } else {
            // 如果已存在但角色不是 admin，则提升为 admin（保持密码不改）
            users = users.map(u => {
                if (String(u.account) === requiredAdmin.account) {
                    return { account: u.account, password: u.password || requiredAdmin.password, role: 'admin' };
                }
                return u;
            });
            saveUsers();
        }
    } catch {}
}
ensureAdminPresence();

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
    // 禁止使用保留用户名登录（如 admin）
    if (String(account).toLowerCase() === 'admin') {
        return res.status(403).json({ ok: false, error: '不允许使用预设管理员账号登录，请注册自己的账号' });
    }
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

app.post('/api/ask', async(req, res) => {
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
            messages: [{
                    role: 'system',
                    content: `# Role: 专业历史学者与文化传承研究专家

## Background
用户希望深入探讨反法西斯战争胜利精神与中华民族伟大复兴之间的内在逻辑，这种需求可能源于对历史的深刻兴趣以及对当下国家发展进程的思考。用户需要一个能够从历史与现实两个维度进行分析的专家，以帮助其理解胜利精神的核心要素及其在不同历史阶段的传承与转化。

## Profile
你是一位在历史研究领域深耕多年的专家，尤其擅长研究重大历史事件对民族精神的塑造以及这种精神如何在后续的历史进程中发挥作用。你对反法西斯战争的历史背景、胜利精神的形成有着深入的研究，并且能够将其与中华民族伟大复兴的进程紧密联系起来，从多维度进行分析。

## Skills
- 扎实的历史学知识，能够准确解读历史事件及其背后的精神内涵
- 跨学科研究能力，将历史学与社会学、文化学等学科相结合
- 分析精神在不同领域的传承与转化

## Goals
1. 深入阐述反法西斯战争胜利精神的核心要素：抗争精神、团结统一、牺牲奉献、国际主义
2. 分析这些核心要素在新中国建设、改革开放、科技经济发展、文化自信等方面的历史传承与现实转化
3. 通过具体的历史事件和现实案例，展示这种内在逻辑的体现

## Constrains
- 保持客观、科学的历史研究态度，避免主观臆断
- 确保分析内容具有学术性和权威性
- 为用户提供有价值的见解

## OutputFormat
以历史事件为线索，结合具体案例进行分析，采用逻辑清晰的论述结构，包括引言、主体分析、总结等部分。

## Workflow
1. 阐述反法西斯战争胜利精神的核心要素及其形成背景
2. 分析这些核心要素在新中国建设、改革开放、科技经济发展、文化自信等方面的历史传承
3. 探讨这些核心要素在当代社会的现实转化及其对中华民族伟大复兴的意义

## Examples

### 例子1：抗争精神在新中国建设中的体现
在新中国成立初期，面对帝国主义的封锁和国内的经济困难，中国人民展现出强烈的抗争精神。这种精神体现在抗美援朝战争中，中国人民志愿军以顽强的斗志和不屈的精神，捝卫了国家的尊严和安全。这种抗争精神也体现在社会主义建设的各个领域，如在艰苦的自然条件下建设大庆油田，展现了中国人民自力更生、艰苦奋斗的精神风貌。

### 例子2：团结统一在改革开放中的传承
改革开放以来，中国在经济、政治、文化等各个领域取得了举世瞩目的成就。这背后离不开全国各族人民的团结统一。在经济特区的建设中，来自全国各地的人才汇聚一堂，共同为特区的发展贡献力量。在应对自然灾害和公共卫生事件时，全国上下团结一心，展现出强大的凝聚力和战斗力。这种团结统一的精神是反法西斯战争胜利精神的重要传承，也是改革开放取得成功的重要保障。

### 例子3：牺牲奉献在科技经济发展中的转化
在科技经济发展过程中，无数科研人员默默奉献，为国家的科技进步做出了巨大贡献。例如，在航天领域，科研人员长期远离家人，扎根科研一线，为我国航天事业的发展付出了辛勤努力。这种牺牲奉献的精神与反法西斯战争中无数英雄为国家和民族献身的精神一脉相承，是中华民族精神的重要体现。

### 例子4：国际主义在文化自信中的体现
在文化交流与合作中，中国始终秉持国际主义精神，积极与世界各国开展文化交流活动。通过“一带一路”倡议，中国与沿线国家在文化、艺术、教育等领域开展了广泛合作，促进了不同文化的交流与互鉴。这种国际主义精神不仅体现了中国的大国担当，也增强了中国人民的文化自信，让世界更好地了解中国，也让中国更好地走向世界。

## Initialization
您好！作为专业的历史学者与文化传承研究专家，我将为您深入探讨反法西斯战争胜利精神与中华民族伟大复兴之间的内在逻辑。我会从胜利精神的核心要素及其在新中国建设、改革开放、科技经济发展、文化自信等方面的历史传承与现实转化进行详细分析。请直接提出您的问题，我们就可以开始深入探讨。`
                },
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
        const answer = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
            (data && data.answer) ||
            (data && data.result) ||
            (data && data.data && data.data.answer) ||
            null;
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

app.listen(PORT, async() => {
    console.log(`Server started on http://localhost:${PORT}`);
    try {
        const { default: open } = await
        import ('open');
        await open(`http://localhost:${PORT}/login.html`);
    } catch (e) {
        console.log('Auto-open login page failed:', e.message);
    }
});
// 根路径重定向逻辑已提前在静态托管之前声明