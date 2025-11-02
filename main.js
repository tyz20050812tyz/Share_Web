// 访问拦截：未登录禁止进入除登录/忘记密码外的页面
(function() {
    try {
        const path = (window.location && window.location.pathname) || '/';
        const allow = new Set(['/', '/login.html', '/forgot.html', '/register.html']);
        const hasUser = !!localStorage.getItem('login_user');
        const hasRole = !!localStorage.getItem('login_role');
        const loggedIn = hasUser && hasRole;
        if (!loggedIn && !allow.has(path)) {
            // 使用 replace 避免返回历史导致再次进入受限页
            window.location.replace('/login.html');
        }
    } catch {}
})();

// 简单离线问答示例：基于关键词匹配返回预设答案
document.addEventListener('DOMContentLoaded', function() {
    // main.js 保留全站通用交互（例如返回主页），AI 局部逻辑移至 ai.js

    // 为情节页面添加返回主页的快捷链接（如果页面存在 .back-home 占位）
    const backEls = document.querySelectorAll('.back-home');
    backEls.forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            // 跳回根目录下的 index.html，使用绝对路径更可靠
            window.location.href = '/index.html';
        });
    });

    // 显示当前用户与退出登录按钮（若已登录）
    try {
        const name = localStorage.getItem('login_user') || '';
        const role = localStorage.getItem('login_role') || '';
        if (name) {
            const headerWrap = document.querySelector('.site-header .wrap');
            if (headerWrap) {
                let bar = document.getElementById('user-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.id = 'user-bar';
                    bar.style.marginTop = '6px';
                    bar.style.textAlign = 'right';
                    bar.style.fontSize = '12px';
                    headerWrap.appendChild(bar);
                }
                const roleLabel = role === 'admin' ? '管理员' : '用户';
                bar.innerHTML = '';
                const info = document.createElement('span');
                info.textContent = '当前用户：';
                const strong = document.createElement('strong');
                strong.textContent = name;
                strong.style.margin = '0 4px';
                const roleSpan = document.createElement('span');
                roleSpan.textContent = `（${roleLabel}）`;
                const onlineSpan = document.createElement('span');
                onlineSpan.id = 'online-count';
                onlineSpan.style.marginLeft = '12px';
                onlineSpan.textContent = '在线人数：…';
                const btn = document.createElement('button');
                btn.className = 'btn btn-secondary';
                btn.textContent = '退出登录';
                btn.style.marginLeft = '8px';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    try {
                        localStorage.removeItem('login_user');
                        localStorage.removeItem('login_role');
                        localStorage.removeItem('forum_my_name');
                        const cid = localStorage.getItem('client_id');
                        if (cid) {
                            fetch('/api/online/offline', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ clientId: cid })
                            }).catch(() => {});
                        }
                    } catch {}
                    window.location.href = '/login.html';
                });
                bar.appendChild(info);
                bar.appendChild(strong);
                bar.appendChild(roleSpan);
                bar.appendChild(onlineSpan);
                bar.appendChild(btn);

                // 在线人数：心跳与轮询
                function getClientId() {
                    let cid = localStorage.getItem('client_id');
                    if (!cid) {
                        cid = 'c_' + Math.random().toString(36).slice(2) + Date.now();
                        try { localStorage.setItem('client_id', cid); } catch {}
                    }
                    return cid;
                }
                const clientId = getClientId();
                async function heartbeat() {
                    try {
                        await fetch('/api/online/heartbeat', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ clientId, user: name, role })
                        });
                    } catch {}
                }
                async function refreshCount() {
                    try {
                        const resp = await fetch('/api/online/count');
                        const data = await resp.json();
                        if (data && data.ok && typeof data.count === 'number') {
                            onlineSpan.textContent = `在线人数：${data.count}`;
                        }
                    } catch {}
                }
                // 立即上报与刷新，然后周期性执行
                heartbeat();
                refreshCount();
                const INTERVAL = 20000; // 20s 心跳与刷新
                setInterval(heartbeat, INTERVAL);
                setInterval(refreshCount, INTERVAL);

                // 管理员：在线详情按钮 + 列表面板
                if (role === 'admin') {
                    const detailBtn = document.createElement('button');
                    detailBtn.className = 'btn btn-secondary';
                    detailBtn.textContent = '在线详情';
                    detailBtn.style.marginLeft = '8px';
                    bar.appendChild(detailBtn);

                    const panel = document.createElement('div');
                    panel.id = 'online-panel';
                    panel.style.marginTop = '8px';
                    panel.style.padding = '8px';
                    panel.style.background = 'var(--surface)';
                    panel.style.border = '1px solid var(--border)';
                    panel.style.borderRadius = 'var(--radius)';
                    panel.style.display = 'none';
                    headerWrap.appendChild(panel);

                    async function loadList() {
                        try {
                            const resp = await fetch('/api/online/list', {
                                headers: { 'X-Auth-User': encodeURIComponent(name || ''), 'X-Auth-Role': role }
                            });
                            const data = await resp.json();
                            if (!resp.ok || !data?.ok) {
                                panel.innerHTML = `<div style="color:#e5484d">${data?.error || '获取失败'}</div>`;
                                return;
                            }
                            const sessions = Array.isArray(data.sessions) ? data.sessions : [];
                            const items = sessions.map(s => {
                                const sec = Math.max(0, Math.round((Date.now() - (s.lastSeen || 0)) / 1000));
                                return `<li>${s.user} — ${s.ip || '未知IP'} — 最近 ${sec} 秒</li>`;
                            }).join('');
                            panel.innerHTML = `<div style="font-weight:600; margin-bottom:6px">在线会话（${sessions.length}）</div><ul style="padding-left:18px">${items || '<li>暂无在线会话</li>'}</ul>`;
                        } catch (e) {
                            panel.innerHTML = `<div style="color:#e5484d">网络异常</div>`;
                        }
                    }

                    detailBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (panel.style.display === 'none') {
                            panel.style.display = 'block';
                            await loadList();
                        } else {
                            panel.style.display = 'none';
                        }
                    });
                }
            }
        }
        // 未登录：仍显示在线人数（仅统计，不上报心跳）
        if (!name) {
            const headerWrap = document.querySelector('.site-header .wrap');
            if (headerWrap) {
                let bar = document.getElementById('user-bar');
                if (!bar) {
                    bar = document.createElement('div');
                    bar.id = 'user-bar';
                    bar.style.marginTop = '6px';
                    bar.style.textAlign = 'right';
                    bar.style.fontSize = '12px';
                    headerWrap.appendChild(bar);
                }
                bar.innerHTML = '';
                const onlineSpan = document.createElement('span');
                onlineSpan.id = 'online-count';
                onlineSpan.style.marginLeft = '12px';
                onlineSpan.textContent = '在线人数：…';
                bar.appendChild(onlineSpan);
                async function refreshCount() {
                    try {
                        const resp = await fetch('/api/online/count');
                        const data = await resp.json();
                        if (data && data.ok && typeof data.count === 'number') {
                            onlineSpan.textContent = `在线人数：${data.count}`;
                        }
                    } catch {}
                }
                refreshCount();
                setInterval(refreshCount, 20000);
            }
        }
    } catch {}

    // （已移除）情景体验相关逻辑
});