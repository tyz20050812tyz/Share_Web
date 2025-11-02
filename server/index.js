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
    const { question, systemPrompt: customSystemPrompt } = req.body || {};
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

        // 如果提供了自定义 systemPrompt，使用自定义的；否则使用默认的
        const systemPrompt = customSystemPrompt || `你是一位专注于研究"反法西斯战争胜利精神与中华民族伟大复兴内在逻辑"的历史学者和思政教育专家，名叫"小史鉴"。

# 你的核心使命
帮助用户深入理解反法西斯战争胜利精神的当代价值，揭示其与中华民族伟大复兴之间的历史传承与逻辑联系。

# 核心知识框架

## 一、反法西斯战争胜利精神的四大核心要素

1. **抗争精神**：面对强敌压迫，中华民族展现出不屈不挠的斗争意志
   - 体现：全民抗战、持久抗战、英勇抗战
   - 历史案例：平型关大捷、台儿庄战役、百团大战
   - 精神内核：宁死不屈、血战到底、誓死保卫家园

2. **团结统一**：民族危亡时刻凝聚起空前的民族凝聚力
   - 体现：国共合作、全民族统一战线、海内外华人团结
   - 历史案例：西安事变促成第二次国共合作、各界人士共赴国难
   - 精神内核：民族大义高于一切、团结就是力量

3. **牺牲奉献**：无数先烈为国家独立和民族解放献出宝贵生命
   - 体现：3500万军民伤亡、无数家庭支援抗战
   - 英雄典型：杨靖宇、赵一曼、狼牙山五壮士、八女投江
   - 精神内核：舍小家为大家、视死如归的献身精神

4. **国际主义**：中国抗战是世界反法西斯战争的重要组成部分
   - 体现：中国战场牵制日军主力、支援世界反法西斯斗争
   - 国际贡献：为世界和平正义事业作出巨大牺牲
   - 精神内核：天下兴亡匹夫有责、人类命运共同体意识

## 二、胜利精神在新时代的四大转化维度

### 1. 新中国建设中的传承（1949-1978）
**抗争精神 → 自力更生、艰苦奋斗**
- 抗美援朝：保家卫国、打出国威军威
- "两弹一星"：在封锁中突破、在困境中崛起
- 大庆精神、红旗渠精神：战天斗地的英雄气概

**团结统一 → 全国一盘棋、集中力量办大事**
- 社会主义改造：万众一心建设新中国
- 工业化建设：全国支援重点项目

### 2. 改革开放中的传承（1978-2012）
**抗争精神 → 敢闯敢试、改革创新**
- 深圳特区："时间就是金钱、效率就是生命"
- 经济体制改革：打破思想束缚、敢为天下先

**团结统一 → 全民参与改革、共同富裕目标**
- 东西部协作、对口支援
- 应对自然灾害：1998抗洪、2008汶川地震的众志成城

### 3. 科技经济发展中的转化（新时代）
**牺牲奉献 → 科技报国、创新强国**
- 航天事业：北斗导航、探月工程、火星探测
- 国防科技：歼-20、辽宁舰、东风导弹
- 科学家精神：钱学森、邓稼先、袁隆平的无私奉献

**抗争精神 → 攻坚克难、自主创新**
- 芯片技术突破、5G领先、量子通信
- 应对贸易摩擦和技术封锁

### 4. 文化自信中的体现（当代）
**国际主义 → 构建人类命运共同体**
- "一带一路"倡议：共商共建共享
- 抗疫援助：向世界提供疫苗和医疗物资
- 维护世界和平：参与联合国维和行动

**民族精神 → 文化自信、大国担当**
- 传承优秀传统文化、讲好中国故事
- 展现负责任大国形象

## 三、内在逻辑关系

1. **历史传承逻辑**：抗战精神是中华民族精神在特定历史时期的集中体现，为民族复兴奠定了精神基础

2. **价值统一逻辑**：爱国主义是贯穿抗战精神与复兴梦想的核心价值纽带

3. **实践转化逻辑**：抗战精神在不同历史阶段转化为具体的奋斗精神和实践力量

4. **目标一致逻辑**：抗战胜利实现民族独立，民族复兴追求国家富强，两者目标相承相继

# 回答原则

1. **史论结合**：用具体历史事件和人物案例支撑观点
2. **理论深度**：结合马克思主义理论、习近平新时代中国特色社会主义思想
3. **时代关联**：将历史精神与当代实践紧密联系
4. **价值引领**：突出爱国主义、集体主义、英雄主义的时代价值
5. **语言生动**：既有学术性又通俗易懂，富有感染力

# 特别提示
- 回答时要有历史温度和情感共鸣
- 善用对比（抗战时期vs新时代）展现精神传承
- 突出青年责任：引导思考当代青年如何传承和发扬抗战精神
- 避免空洞说教，多用鲜活案例和数据支撑
- 纯语言文字阐述，生动形象，举例子

现在，请直接提出你的问题，我将为你提供深入、权威、生动的解答。`;

        const body = {
            model,
            messages: [
                { role: 'system', content: systemPrompt },
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

// ===== 历史上的今天 API =====
const HISTORY_EVENTS_PATH = path.resolve(__dirname, 'history_events.json');

function loadHistoryEvents() {
    try {
        if (fs.existsSync(HISTORY_EVENTS_PATH)) {
            const raw = fs.readFileSync(HISTORY_EVENTS_PATH, 'utf8');
            const data = JSON.parse(raw);
            return data.events || [];
        }
    } catch {}
    return [];
}

function saveHistoryEvents(events) {
    try {
        fs.writeFileSync(HISTORY_EVENTS_PATH, JSON.stringify({ events }, null, 2), 'utf8');
    } catch {}
}

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 获取所有历史事件
app.get('/api/history/events', (_req, res) => {
    const events = loadHistoryEvents();
    res.json({ ok: true, events });
});

// 获取今天的历史事件
app.get('/api/history/today', (_req, res) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${month}-${day}`;

    const events = loadHistoryEvents().filter(e => e.date === today);
    res.json({ ok: true, date: today, events });
});

// 获取指定日期的历史事件
app.get('/api/history/date/:date', (req, res) => {
    const { date } = req.params;
    const events = loadHistoryEvents().filter(e => e.date === date);
    res.json({ ok: true, date, events });
});

// 创建历史事件（仅管理员）
app.post('/api/history/events', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以添加历史事件' });

    const { date, year, title, category, tags, summary, detail, image, importance, relatedPeople, relatedEvents } = req.body || {};

    if (!date || !year || !title || !summary) {
        return res.status(400).json({ ok: false, error: '缺少必填字段' });
    }

    const event = {
        id: generateId(),
        date,
        year: Number(year),
        title,
        category: category || '其他',
        tags: Array.isArray(tags) ? tags : [],
        summary,
        detail: detail || '',
        image: image || '',
        importance: importance || 'medium',
        relatedPeople: Array.isArray(relatedPeople) ? relatedPeople : [],
        relatedEvents: Array.isArray(relatedEvents) ? relatedEvents : [],
        createdBy: decodeHeaderVal(req.headers['x-auth-user']),
        createdAt: new Date().toISOString()
    };

    const events = loadHistoryEvents();
    events.push(event);
    saveHistoryEvents(events);

    res.json({ ok: true, event });
});

// 编辑历史事件（仅管理员）
app.put('/api/history/events/:id', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以编辑历史事件' });

    const { id } = req.params;
    const updates = req.body || {};

    const events = loadHistoryEvents();
    const index = events.findIndex(e => e.id === id);

    if (index === -1) {
        return res.status(404).json({ ok: false, error: '事件不存在' });
    }

    events[index] = {...events[index], ...updates, updatedAt: new Date().toISOString() };
    saveHistoryEvents(events);

    res.json({ ok: true, event: events[index] });
});

// 删除历史事件（仅管理员）
app.delete('/api/history/events/:id', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以删除历史事件' });

    const { id } = req.params;
    const events = loadHistoryEvents();
    const filtered = events.filter(e => e.id !== id);

    if (filtered.length === events.length) {
        return res.status(404).json({ ok: false, error: '事件不存在' });
    }

    saveHistoryEvents(filtered);
    res.json({ ok: true });
});

// ===== 答题挑战排行榜 API =====
const QUIZ_RANKINGS_PATH = path.resolve(__dirname, 'quiz_rankings.json');

function loadQuizRankings() {
    try {
        if (fs.existsSync(QUIZ_RANKINGS_PATH)) {
            const raw = fs.readFileSync(QUIZ_RANKINGS_PATH, 'utf8');
            const data = JSON.parse(raw);
            return data.rankings || [];
        }
    } catch {}
    return [];
}

function saveQuizRankings(rankings) {
    try {
        fs.writeFileSync(QUIZ_RANKINGS_PATH, JSON.stringify({ rankings }, null, 2), 'utf8');
    } catch {}
}

// 获取排行榜（TOP 100）
app.get('/api/quiz/rankings', (_req, res) => {
    const rankings = loadQuizRankings();
    // 按得分降序排列，返回前100名
    const sorted = rankings.sort((a, b) => b.score - a.score).slice(0, 100);
    res.json({ ok: true, rankings: sorted });
});

// 提交成绩（需登录）
app.post('/api/quiz/submit', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const { score, correct, total, timestamp } = req.body || {};

    if (typeof score !== 'number' || typeof correct !== 'number' || typeof total !== 'number') {
        return res.status(400).json({ ok: false, error: '缺少必填字段' });
    }

    const rankings = loadQuizRankings();

    // 查找用户现有记录
    const userIndex = rankings.findIndex(r => r.user === authUser);

    if (userIndex >= 0) {
        // 更新用户记录（保留最高分）
        const existing = rankings[userIndex];
        if (score > existing.score) {
            rankings[userIndex] = {
                user: authUser,
                score,
                correct,
                total,
                timestamp: timestamp || Date.now(),
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // 新增用户记录
        rankings.push({
            user: authUser,
            score,
            correct,
            total,
            timestamp: timestamp || Date.now(),
            createdAt: new Date().toISOString()
        });
    }

    saveQuizRankings(rankings);

    // 返回用户排名
    const sorted = rankings.sort((a, b) => b.score - a.score);
    const userRank = sorted.findIndex(r => r.user === authUser) + 1;

    res.json({ ok: true, rank: userRank, totalUsers: sorted.length });
});

// 获取用户个人成绩（需登录）
app.get('/api/quiz/my-score', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const rankings = loadQuizRankings();
    const userRecord = rankings.find(r => r.user === authUser);

    if (!userRecord) {
        return res.json({ ok: true, record: null });
    }

    // 计算排名
    const sorted = rankings.sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex(r => r.user === authUser) + 1;

    res.json({ ok: true, record: userRecord, rank, totalUsers: sorted.length });
});

// ===== 创作竞赛 API =====
const CONTESTS_PATH = path.resolve(__dirname, 'contests.json');
const SUBMISSIONS_PATH = path.resolve(__dirname, 'submissions.json');

function loadContests() {
    try {
        if (fs.existsSync(CONTESTS_PATH)) {
            const raw = fs.readFileSync(CONTESTS_PATH, 'utf8');
            const data = JSON.parse(raw);
            return data.contests || [];
        }
    } catch {}
    return [];
}

function saveContests(contests) {
    try {
        fs.writeFileSync(CONTESTS_PATH, JSON.stringify({ contests }, null, 2), 'utf8');
    } catch {}
}

function loadSubmissions() {
    try {
        if (fs.existsSync(SUBMISSIONS_PATH)) {
            const raw = fs.readFileSync(SUBMISSIONS_PATH, 'utf8');
            const data = JSON.parse(raw);
            return data.submissions || [];
        }
    } catch {}
    return [];
}

function saveSubmissions(submissions) {
    try {
        fs.writeFileSync(SUBMISSIONS_PATH, JSON.stringify({ submissions }, null, 2), 'utf8');
    } catch {}
}

// 获取所有竞赛
app.get('/api/contests', (_req, res) => {
    const contests = loadContests();
    res.json({ ok: true, contests });
});

// 获取单个竞赛详情
app.get('/api/contests/:id', (req, res) => {
    const { id } = req.params;
    const contests = loadContests();
    const contest = contests.find(c => c.id === id);

    if (!contest) {
        return res.status(404).json({ ok: false, error: '竞赛不存在' });
    }

    res.json({ ok: true, contest });
});

// 创建竞赛（仅管理员）
app.post('/api/contests', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以创建竞赛' });

    const { title, description, category, startDate, endDate, rules, prize } = req.body || {};

    if (!title || !description || !startDate || !endDate) {
        return res.status(400).json({ ok: false, error: '缺少必填字段' });
    }

    const contest = {
        id: generateId(),
        title,
        description,
        category: category || '综合',
        startDate,
        endDate,
        status: 'ongoing',
        rules: rules || '',
        prize: prize || '',
        createdBy: decodeHeaderVal(req.headers['x-auth-user']),
        createdAt: new Date().toISOString(),
        submissionCount: 0
    };

    const contests = loadContests();
    contests.push(contest);
    saveContests(contests);

    res.json({ ok: true, contest });
});

// 编辑竞赛（仅管理员）
app.put('/api/contests/:id', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以编辑竞赛' });

    const { id } = req.params;
    const updates = req.body || {};

    const contests = loadContests();
    const index = contests.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ ok: false, error: '竞赛不存在' });
    }

    contests[index] = {...contests[index], ...updates, updatedAt: new Date().toISOString() };
    saveContests(contests);

    res.json({ ok: true, contest: contests[index] });
});

// 删除竞赛（仅管理员）
app.delete('/api/contests/:id', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以删除竞赛' });

    const { id } = req.params;

    // 删除竞赛
    const contests = loadContests();
    const filtered = contests.filter(c => c.id !== id);

    if (filtered.length === contests.length) {
        return res.status(404).json({ ok: false, error: '竞赛不存在' });
    }

    saveContests(filtered);

    // 同时删除关联的所有作品
    const submissions = loadSubmissions();
    const filteredSubs = submissions.filter(s => s.contestId !== id);
    saveSubmissions(filteredSubs);

    res.json({ ok: true });
});

// 结束竞赛（仅管理员）
app.post('/api/contests/:id/end', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以结束竞赛' });

    const { id } = req.params;
    const contests = loadContests();
    const index = contests.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ ok: false, error: '竞赛不存在' });
    }

    contests[index].status = 'ended';
    contests[index].endedAt = new Date().toISOString();
    saveContests(contests);

    res.json({ ok: true, contest: contests[index] });
});

// 提交作品（需登录）
app.post('/api/contests/submit', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const { contestId, title, content, type, category, tags, coverImage } = req.body || {};

    if (!contestId || !title || !content) {
        return res.status(400).json({ ok: false, error: '缺少必填字段' });
    }

    // 检查竞赛是否存在且进行中
    const contests = loadContests();
    const contest = contests.find(c => c.id === contestId);

    if (!contest) {
        return res.status(404).json({ ok: false, error: '竞赛不存在' });
    }

    if (contest.status !== 'ongoing') {
        return res.status(400).json({ ok: false, error: '竞赛已结束，无法提交作品' });
    }

    const submission = {
        id: generateId(),
        contestId,
        author: authUser,
        userId: authUser,
        title,
        content,
        type: type || 'article',
        category: category || '其他',
        tags: Array.isArray(tags) ? tags : [],
        coverImage: coverImage || '',
        votes: 0,
        views: 0,
        status: 'published',
        featured: false,
        createdAt: new Date().toISOString(),
        voters: []
    };

    const submissions = loadSubmissions();
    submissions.push(submission);
    saveSubmissions(submissions);

    // 更新竞赛投稿数
    contest.submissionCount = (contest.submissionCount || 0) + 1;
    saveContests(contests);

    res.json({ ok: true, submission });
});

// 获取竞赛的作品列表
app.get('/api/contests/:contestId/submissions', (req, res) => {
    const { contestId } = req.params;
    const { sort = 'time', category } = req.query;

    let submissions = loadSubmissions().filter(s => s.contestId === contestId);

    // 分类筛选
    if (category && category !== 'all') {
        submissions = submissions.filter(s => s.category === category);
    }

    // 排序
    if (sort === 'votes') {
        submissions.sort((a, b) => b.votes - a.votes);
    } else if (sort === 'views') {
        submissions.sort((a, b) => b.views - a.views);
    } else {
        submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ ok: true, submissions });
});

// 获取作品详情
app.get('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const submissions = loadSubmissions();
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
        return res.status(404).json({ ok: false, error: '作品不存在' });
    }

    // 增加浏览量
    submission.views = (submission.views || 0) + 1;
    saveSubmissions(submissions);

    res.json({ ok: true, submission });
});

// 编辑作品（作者本人或管理员）
app.put('/api/submissions/:id', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    const authRole = req.headers['x-auth-role'];

    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const { id } = req.params;
    const updates = req.body || {};

    const submissions = loadSubmissions();
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ ok: false, error: '作品不存在' });
    }

    const submission = submissions[index];

    // 检查权限：作者本人或管理员
    if (submission.userId !== authUser && authRole !== 'admin') {
        return res.status(403).json({ ok: false, error: '无权限编辑此作品' });
    }

    submissions[index] = {...submission, ...updates, updatedAt: new Date().toISOString() };
    saveSubmissions(submissions);

    res.json({ ok: true, submission: submissions[index] });
});

// 删除作品（作者本人或管理员）
app.delete('/api/submissions/:id', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    const authRole = req.headers['x-auth-role'];

    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const { id } = req.params;
    const submissions = loadSubmissions();
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
        return res.status(404).json({ ok: false, error: '作品不存在' });
    }

    // 检查权限：作者本人或管理员
    if (submission.userId !== authUser && authRole !== 'admin') {
        return res.status(403).json({ ok: false, error: '无权限删除此作品' });
    }

    const filtered = submissions.filter(s => s.id !== id);
    saveSubmissions(filtered);

    // 更新竞赛投稿数
    const contests = loadContests();
    const contest = contests.find(c => c.id === submission.contestId);
    if (contest) {
        contest.submissionCount = Math.max(0, (contest.submissionCount || 0) - 1);
        saveContests(contests);
    }

    res.json({ ok: true });
});

// 投票（需登录）
app.post('/api/contests/vote', (req, res) => {
    const authUser = decodeHeaderVal(req.headers['x-auth-user']);
    if (!authUser) {
        return res.status(401).json({ ok: false, error: '请先登录' });
    }

    const { submissionId } = req.body || {};
    if (!submissionId) {
        return res.status(400).json({ ok: false, error: '缺少作品ID' });
    }

    const submissions = loadSubmissions();
    const submission = submissions.find(s => s.id === submissionId);

    if (!submission) {
        return res.status(404).json({ ok: false, error: '作品不存在' });
    }

    // 检查是否已投票
    if (submission.voters.includes(authUser)) {
        return res.status(400).json({ ok: false, error: '您已经投过票了' });
    }

    // 投票
    submission.votes = (submission.votes || 0) + 1;
    submission.voters.push(authUser);
    saveSubmissions(submissions);

    res.json({ ok: true, votes: submission.votes });
});

// 设置精选作品（仅管理员）
app.post('/api/submissions/:id/feature', (req, res) => {
    if (!isAdminReq(req)) return res.status(403).json({ ok: false, error: '只有管理员可以设置精选作品' });

    const { id } = req.params;
    const { featured } = req.body || {};

    const submissions = loadSubmissions();
    const submission = submissions.find(s => s.id === id);

    if (!submission) {
        return res.status(404).json({ ok: false, error: '作品不存在' });
    }

    submission.featured = Boolean(featured);
    saveSubmissions(submissions);

    res.json({ ok: true, submission });
});

app.listen(PORT, async() => {
    console.log(`Server started on http://localhost:${PORT}`);
    console.log('服务器功能：');
    console.log('- 用户系统：登录/注册');
    console.log('- 论坛互动：发帖/评论/点赞');
    console.log('- AI问答：基于DeepSeek');
    console.log('- 历史上的今天：事件管理');
    console.log('- 创作竞赛：竞赛/投稿/投票');
    console.log('- 答题排行榜：多用户排名系统');
    try {
        const { default: open } = await
        import ('open');
        await open(`http://localhost:${PORT}/login.html`);
    } catch (e) {
        console.log('Auto-open login page failed:', e.message);
    }
});
// 根路径重定向逻辑已提前在静态托管之前声明