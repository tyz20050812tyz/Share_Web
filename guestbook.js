// 留言箱前端逻辑
(function() {
        'use strict';

        // 应用状态
        const AppState = {
            currentUser: null,
            currentRole: null,
            messages: [],
            isSubmitting: false
        };

        // DOM 元素
        const elements = {
            messageForm: null,
            titleInput: null,
            contentInput: null,
            charCount: null,
            submitBtn: null,
            messagesList: null,
            messageCount: null
        };

        // ===== 初始化 =====
        function init() {
            // 获取DOM元素
            elements.messageForm = document.getElementById('messageForm');
            elements.titleInput = document.getElementById('messageTitle');
            elements.contentInput = document.getElementById('messageContent');
            elements.charCount = document.getElementById('charCount');
            elements.submitBtn = document.getElementById('submitBtn');
            elements.messagesList = document.getElementById('messagesList');
            elements.messageCount = document.getElementById('messageCount');

            // 获取用户信息
            AppState.currentUser = localStorage.getItem('login_user');
            AppState.currentRole = localStorage.getItem('login_role');

            // 检查登录状态
            if (!AppState.currentUser) {
                showLoginPrompt();
                return;
            }

            // 绑定事件
            bindEvents();

            // 加载留言列表
            loadMessages();
        }

        // ===== 事件绑定 =====
        function bindEvents() {
            // 表单提交
            elements.messageForm.addEventListener('submit', handleSubmit);

            // 字符计数
            elements.contentInput.addEventListener('input', updateCharCount);

            // 回车键提交（Ctrl+Enter）
            elements.contentInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    handleSubmit(e);
                }
            });
        }

        // ===== 显示登录提示 =====
        function showLoginPrompt() {
            elements.messagesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <div class="empty-text">请先登录后再发表留言</div>
                <br>
                <button onclick="location.href='login.html'" style="
                    background: linear-gradient(135deg, #c62828, #e53935);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                ">前往登录</button>
            </div>
        `;

            // 禁用表单
            elements.messageForm.style.display = 'none';
        }

        // ===== 字符计数更新 =====
        function updateCharCount() {
            const length = elements.contentInput.value.length;
            elements.charCount.textContent = length;

            // 超过限制时变红
            if (length > 450) {
                elements.charCount.style.color = '#f44336';
            } else {
                elements.charCount.style.color = '#999';
            }
        }

        // ===== 表单提交 =====
        async function handleSubmit(e) {
            e.preventDefault();

            // 防止重复提交
            if (AppState.isSubmitting) {
                return;
            }

            // 获取表单数据
            const title = elements.titleInput.value.trim();
            const content = elements.contentInput.value.trim();

            // 验证
            if (!title) {
                alert('请输入留言标题！');
                elements.titleInput.focus();
                return;
            }

            if (!content) {
                alert('请输入留言内容！');
                elements.contentInput.focus();
                return;
            }

            if (title.length > 50) {
                alert('留言标题不能超过50字！');
                return;
            }

            if (content.length > 500) {
                alert('留言内容不能超过500字！');
                return;
            }

            // 提交留言
            AppState.isSubmitting = true;
            elements.submitBtn.disabled = true;
            elements.submitBtn.textContent = '提交中...';

            try {
                const response = await fetch('/api/guestbook/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        content,
                        author: AppState.currentUser,
                        role: AppState.currentRole
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    // 提交成功
                    alert('✅ 留言发表成功！');

                    // 清空表单
                    elements.titleInput.value = '';
                    elements.contentInput.value = '';
                    updateCharCount();

                    // 重新加载留言列表
                    await loadMessages();
                } else {
                    alert('❌ 提交失败：' + (data.error || '未知错误'));
                }
            } catch (error) {
                console.error('提交留言失败：', error);
                alert('❌ 提交失败：网络错误或服务器异常');
            } finally {
                AppState.isSubmitting = false;
                elements.submitBtn.disabled = false;
                elements.submitBtn.textContent = '📮 提交留言';
            }
        }

        // ===== 加载留言列表 =====
        async function loadMessages() {
            try {
                // 显示加载状态
                elements.messagesList.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div>加载中...</div>
                </div>
            `;

                const response = await fetch('/api/guestbook/list');
                const data = await response.json();

                if (data.ok) {
                    AppState.messages = data.messages || [];
                    renderMessages();
                } else {
                    throw new Error(data.error || '加载失败');
                }
            } catch (error) {
                console.error('加载留言失败：', error);
                elements.messagesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败，请刷新页面重试</div>
                </div>
            `;
            }
        }

        // ===== 渲染留言列表 =====
        function renderMessages() {
            // 更新计数
            elements.messageCount.textContent = AppState.messages.length;

            // 空状态
            if (AppState.messages.length === 0) {
                elements.messagesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">暂无留言，快来发表第一条留言吧！</div>
                </div>
            `;
                return;
            }

            // 渲染留言卡片
            elements.messagesList.innerHTML = AppState.messages.map(msg => {
                        const isAdmin = msg.role === 'admin';
                        const isAuthor = msg.author === AppState.currentUser;
                        const canDelete = AppState.currentRole === 'admin' || isAuthor;

                        return `
                <div class="message-card" data-id="${msg.id}">
                    <div class="message-header">
                        <div class="message-info">
                            <div class="message-title">${escapeHtml(msg.title)}</div>
                            <div class="message-meta">
                                <span class="meta-item">
                                    👤 <span class="user-badge ${isAdmin ? 'admin-badge' : ''}">${escapeHtml(msg.author)}</span>
                                </span>
                                <span class="meta-item">
                                    🕒 ${formatTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                        <div class="message-actions">
                            ${canDelete ? `
                                <button class="delete-btn" onclick="deleteMessage('${msg.id}')">
                                    🗑️ 删除
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                </div>
            `;
        }).join('');
    }

    // ===== 删除留言 =====
    window.deleteMessage = async function(messageId) {
        if (!confirm('确定要删除这条留言吗？')) {
            return;
        }

        try {
            const response = await fetch(`/api/guestbook/delete/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: AppState.currentUser,
                    role: AppState.currentRole
                })
            });

            const data = await response.json();

            if (data.ok) {
                alert('✅ 删除成功！');
                await loadMessages();
            } else {
                alert('❌ 删除失败：' + (data.error || '未知错误'));
            }
        } catch (error) {
            console.error('删除留言失败：', error);
            alert('❌ 删除失败：网络错误或服务器异常');
        }
    };

    // ===== 工具函数 =====
    
    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 时间格式化
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // 1分钟内
        if (diff < 60000) {
            return '刚刚';
        }

        // 1小时内
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}分钟前`;
        }

        // 24小时内
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}小时前`;
        }

        // 7天内
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}天前`;
        }

        // 超过7天，显示完整日期
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ===== 页面加载时初始化 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();