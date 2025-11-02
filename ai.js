async function askOnline(question) {
    try {
        const res = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!res.ok) throw new Error('网络错误: ' + res.status);
        const data = await res.json();
        return data; // 返回完整数据，包含 answer 与 raw
    } catch (e) {
        return { answer: '调用后端出错：' + e.message };
    }
}

function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, (s) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[s]);
}

function prettyJSON(obj) {
    try { return escapeHtml(JSON.stringify(obj, null, 2)); }
    catch { return escapeHtml(String(obj)); }
}

const HISTORY_KEY = 'ai_chat_history';
const HISTORY_COLLAPSE_KEY = 'ai_history_open';
function renderMarkdown(md = '') {
    try {
        if (window.marked) {
            const html = window.marked.parse(String(md));
            if (window.DOMPurify) return window.DOMPurify.sanitize(html);
            return html;
        }
        return escapeHtml(md);
    } catch { return escapeHtml(String(md)); }
}
function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
}
function saveHistory(list) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); } catch {} }
function renderHistory(list) {
    const box = document.getElementById('ai-history');
    const title = document.getElementById('history-title');
    if (!box) return;
    if (title) { title.textContent = `历史聊天记录（${(list && list.length) || 0} 条）`; }
    if (!list || !list.length) { box.innerHTML = '<div class="muted">暂无历史记录。</div>'; return; }
    const items = list.slice().reverse().map(it => {
        const time = new Date(it.ts || Date.now()).toLocaleString();
        const q = escapeHtml(it.question || '');
        const a = renderMarkdown(it.answer || '');
        const raw = prettyJSON(it.raw);
        return `<div class="history-item" style="padding:8px 10px;border:1px solid #e2e8f0;background:#fbfdff;border-radius:6px;margin-bottom:8px">
            <div style="font-size:12px;color:#666">${time}</div>
            <div style="font-weight:600">Q: ${q}</div>
            <div>A:</div>
            <div class="history-answer markdown-body">${a}</div>
            <details style="margin-top:6px"><summary>原始数据</summary><pre style="max-height:200px;overflow:auto;background:#f7fafc;padding:8px;border-radius:6px;border:1px solid #e2e8f0">${raw}</pre></details>
        </div>`;
    }).join('');
    box.innerHTML = items;
    if (window.hljs && typeof window.hljs.highlightAll === 'function') { window.hljs.highlightAll(); }
}

document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('ai-input');
    const aiSubmit = document.getElementById('ai-submit');
    const aiResponse = document.getElementById('ai-response');
    const clearBtn = document.getElementById('clear-history');
    const historyDetails = document.getElementById('history-details');
    // 数字人元素与语音控制
    const dh = document.getElementById('digital-human');
    const dhSpeakBtn = document.getElementById('dh-speak');
    const dhStopBtn = document.getElementById('dh-stop');
    // 语音选择与参数控制
    const voiceSelect = document.getElementById('voice-select');
    const rateInput = document.getElementById('voice-rate');
    const pitchInput = document.getElementById('voice-pitch');
    const VOICE_PREF_KEY = 'ai_voice_pref';
    const RATE_PREF_KEY = 'ai_voice_rate';
    const PITCH_PREF_KEY = 'ai_voice_pitch';
    let lastAnswer = '';

    // 基于回答文本的情绪识别（简易规则）
    function detectMood(text = '') {
        const t = String(text);
        if (/胜利|成功|喜悦|振奋|大捷|光辉|希望/.test(t)) return 'smile';
        if (/牺牲|战争|抗战|纪念|严峻|相持|苦难|伤亡|烈士|困难/.test(t)) return 'serious';
        if (/震惊|突发|首次|重要|意外|惊/.test(t)) return 'surprise';
        return 'serious';
    }

    // 视线跟随鼠标（瞳孔偏移）
    document.addEventListener('mousemove', (e) => {
        if (!dh) return;
        const avatar = dh.querySelector('.dh-avatar');
        if (!avatar) return;
        const r = avatar.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = Math.max(-6, Math.min(6, (e.clientX - cx) / 24));
        const dy = Math.max(-6, Math.min(6, (e.clientY - cy) / 24));
        dh.style.setProperty('--look-x', dx + 'px');
        dh.style.setProperty('--look-y', dy + 'px');
    });

    function speak(text) {
        if (!text) return;
        if (!('speechSynthesis' in window)) { return; }
        try { window.speechSynthesis.cancel(); } catch {}
        const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' '));
        u.lang = 'zh-CN';
        // 应用速率与音高
        const rate = parseFloat(rateInput?.value || localStorage.getItem(RATE_PREF_KEY) || '1.0');
        const pitch = parseFloat(pitchInput?.value || localStorage.getItem(PITCH_PREF_KEY) || '1.0');
        u.rate = !Number.isNaN(rate) ? rate : 1.0;
        u.pitch = !Number.isNaN(pitch) ? pitch : 1.0;
        u.volume = 1.0;
        // 应用选定语音
        try {
            const voices = window.speechSynthesis.getVoices() || [];
            const saved = localStorage.getItem(VOICE_PREF_KEY) || '';
            const voice = voices.find(v => v.name === saved) || voices.find(v => /zh|cmn|ZH|Chinese/i.test(v.lang || '')) || null;
            if (voice) { u.voice = voice; u.lang = voice.lang || u.lang; }
        } catch {}
        u.onstart = () => { if (dh) dh.classList.add('speaking'); };
        // 每个语音边界触发一次“嘴型弹动”，让说话更灵动
        u.onboundary = () => {
            if (!dh) return;
            dh.classList.add('mouth-beat');
            setTimeout(() => dh.classList.remove('mouth-beat'), 120);
        };
        u.onend = () => { if (dh) dh.classList.remove('speaking'); };
        u.onerror = () => { if (dh) dh.classList.remove('speaking'); };
        try { window.speechSynthesis.speak(u); } catch { if (dh) dh.classList.remove('speaking'); }
    }

    if (dhSpeakBtn) dhSpeakBtn.addEventListener('click', () => {
        const txt = lastAnswer || (aiResponse?.textContent || '');
        speak(txt);
    });
    if (dhStopBtn) dhStopBtn.addEventListener('click', () => {
        try { window.speechSynthesis.cancel(); } catch {}
        if (dh) dh.classList.remove('speaking');
    });

    // 初始化折叠状态
    if (historyDetails) {
        const pref = localStorage.getItem(HISTORY_COLLAPSE_KEY);
        if (pref !== null) historyDetails.open = (pref === 'true');
        historyDetails.addEventListener('toggle', () => {
            try { localStorage.setItem(HISTORY_COLLAPSE_KEY, historyDetails.open ? 'true' : 'false'); } catch {}
        });
    }

    renderHistory(loadHistory());
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { saveHistory([]); renderHistory([]); });
    }

    aiSubmit.addEventListener('click', async () => {
        const q = aiInput.value.trim();
        if (!q) { aiResponse.textContent = '请先输入你的问题。'; return }
        aiResponse.textContent = '正在处理，请稍候...';
        aiSubmit.disabled = true;
        const result = await askOnline(q);
        const ans = result && result.answer ? result.answer : '未获得有效回答。';
        const rawData = result && (result.raw || result);
        const rawBlock = `<details style="margin-top:10px"><summary>查看原始数据</summary><pre class="ai-raw" style="max-height:240px;overflow:auto;background:#f7fafc;padding:10px;border-radius:6px;border:1px solid #e2e8f0">${prettyJSON(rawData)}</pre></details>`;
        const mdHtml = renderMarkdown(ans);
        aiResponse.innerHTML = `<div class="ai-answer markdown-body">${mdHtml}</div>${rawBlock}`;
        if (window.hljs && typeof window.hljs.highlightAll === 'function') { window.hljs.highlightAll(); }

        // 记录最新回答并自动朗读（可通过“停止”按钮中断）
        lastAnswer = ans;
        speak(ans);

        // 根据回答内容调整数字人情绪外观
        if (dh) {
            dh.classList.remove('mood-smile', 'mood-serious', 'mood-surprise');
            const mood = detectMood(ans);
            dh.classList.add('mood-' + mood);
        }

        const history = loadHistory();
        history.push({ question: q, answer: ans, raw: rawData, ts: Date.now() });
        saveHistory(history);
        renderHistory(history);

        // 问答完成后，清空输入框并聚焦，便于继续提问
        aiInput.value = '';
        aiInput.focus();
        aiSubmit.disabled = false;
    });
    // 加载与渲染系统可用语音
    function populateVoices() {
        if (!('speechSynthesis' in window)) return;
        const list = window.speechSynthesis.getVoices() || [];
        if (!voiceSelect) return;
        const preferZh = v => /zh|cmn|ZH|Chinese/i.test(v.lang || '') || /中文|华语|普通话/i.test(v.name || '');
        const zhVoices = list.filter(preferZh);
        const otherVoices = list.filter(v => !preferZh(v));
        const sorted = [...zhVoices, ...otherVoices];
        const saved = localStorage.getItem(VOICE_PREF_KEY) || '';
        voiceSelect.innerHTML = '<option value="">系统默认</option>' + sorted.map(v => `<option value="${escapeHtml(v.name)}" ${saved === v.name ? 'selected' : ''}>${escapeHtml(v.name)}${preferZh(v) ? '（中文）' : ''} - ${escapeHtml(v.lang || '')}</option>`).join('');
    }
    if ('speechSynthesis' in window) {
        populateVoices();
        try { window.speechSynthesis.onvoiceschanged = populateVoices; } catch {}
    }

    // 选择与持久化
    if (voiceSelect) voiceSelect.addEventListener('change', () => {
        try { localStorage.setItem(VOICE_PREF_KEY, voiceSelect.value || ''); } catch {}
    });
    if (rateInput) {
        const savedRate = parseFloat(localStorage.getItem(RATE_PREF_KEY) || '1.0');
        if (!Number.isNaN(savedRate)) rateInput.value = String(savedRate);
        rateInput.addEventListener('input', () => {
            try { localStorage.setItem(RATE_PREF_KEY, rateInput.value || '1.0'); } catch {}
        });
    }
    if (pitchInput) {
        const savedPitch = parseFloat(localStorage.getItem(PITCH_PREF_KEY) || '1.0');
        if (!Number.isNaN(savedPitch)) pitchInput.value = String(savedPitch);
        pitchInput.addEventListener('input', () => {
            try { localStorage.setItem(PITCH_PREF_KEY, pitchInput.value || '1.0'); } catch {}
        });
    }
});