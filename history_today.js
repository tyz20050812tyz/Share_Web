// 历史上的今天 - JavaScript逻辑

class HistoryToday {
    constructor() {
        this.events = [];
        this.currentDate = this.getTodayDate();
        this.currentUser = localStorage.getItem('login_user');
        this.currentRole = localStorage.getItem('login_role');
        this.init();
    }

    async init() {
        this.showAdminUI();
        this.initializeDateSelectors();
        await this.loadAllEvents();
        this.displayTodayDate();
        this.checkImportantDate();
        this.renderEvents(this.currentDate);
    }

    // 显示管理员UI
    showAdminUI() {
        if (this.currentRole === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    }

    // 获取今天的日期 (MM-DD格式)
    getTodayDate() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    }

    // 获取完整日期显示
    getFullDateText(date) {
        const now = new Date();
        const year = now.getFullYear();
        const [month, day] = date.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    // 显示今天的日期
    displayTodayDate() {
        const dateEl = document.getElementById('todayDate');
        if (dateEl) {
            dateEl.textContent = `今天是 ${this.getFullDateText(this.currentDate)}`;
        }
    }

    // 初始化日期选择器
    initializeDateSelectors() {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');

        // 设置月份
        document.getElementById('monthSelect').value = currentMonth;

        // 生成天数选项
        this.updateDayOptions();

        // 设置日期
        document.getElementById('daySelect').value = currentDay;

        // 监听月份变化
        document.getElementById('monthSelect').addEventListener('change', () => {
            this.updateDayOptions();
        });
    }

    // 更新天数选项
    updateDayOptions() {
        const monthSelect = document.getElementById('monthSelect');
        const daySelect = document.getElementById('daySelect');
        const month = parseInt(monthSelect.value);

        // 计算该月的天数
        const daysInMonth = new Date(2024, month, 0).getDate();

        // 清空并重新生成
        daySelect.innerHTML = '';
        for (let i = 1; i <= daysInMonth; i++) {
            const option = document.createElement('option');
            option.value = String(i).padStart(2, '0');
            option.textContent = `${i}日`;
            daySelect.appendChild(option);
        }
    }

    // 检查重要纪念日
    checkImportantDate() {
        const importantDates = {
            '09-18': '⚠️ 今天是九一八事变纪念日 - 勿忘国耻,振兴中华!',
            '07-07': '⚠️ 今天是七七事变纪念日 - 铭记历史,珍爱和平!',
            '08-15': '🎉 今天是日本宣布无条件投降日 - 纪念抗战胜利!',
            '09-03': '🎉 今天是中国人民抗日战争胜利纪念日!',
            '12-13': '⚠️ 今天是南京大屠杀死难者国家公祭日 - 铭记历史,勿忘国耻!'
        };

        const notice = importantDates[this.currentDate];
        if (notice) {
            const noticeEl = document.getElementById('importantNotice');
            noticeEl.textContent = notice;
            noticeEl.style.display = 'block';
        }
    }

    // 加载所有历史事件
    async loadAllEvents() {
        try {
            const response = await fetch('/api/history/events');
            const data = await response.json();
            if (data.ok) {
                this.events = data.events || [];
            }
        } catch (error) {
            console.error('加载历史事件失败:', error);
        }
    }

    // 获取指定日期的事件
    getEventsByDate(date) {
        return this.events
            .filter(e => e.date === date)
            .sort((a, b) => a.year - b.year);
    }

    // 渲染事件列表
    renderEvents(date) {
        const timeline = document.getElementById('timeline');
        const events = this.getEventsByDate(date);

        if (events.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>这一天暂无记录的历史事件</h3>
                    <p>历史的长河中,每一天都有故事发生...</p>
                </div>
            `;
            return;
        }

        timeline.innerHTML = events.map(event => this.createEventCard(event)).join('');
    }

    // 创建事件卡片
    createEventCard(event) {
            const isAdmin = this.currentRole === 'admin';
            const tags = Array.isArray(event.tags) ? event.tags : [];

            return `
            <div class="event-card ${event.importance}" data-id="${event.id}">
                <div class="event-year">${event.year}年</div>
                <div class="event-title">
                    ${event.title}
                    <span class="event-category">${event.category}</span>
                </div>
                
                ${tags.length > 0 ? `
                    <div class="event-tags">
                        ${tags.map(tag => `<span class="event-tag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="event-summary">${event.summary}</div>
                
                ${event.detail ? `
                    <div class="event-detail" id="detail-${event.id}">
                        ${event.detail}
                    </div>
                ` : ''}
                
                <div class="event-actions">
                    ${event.detail ? `
                        <button class="btn-primary" onclick="historyToday.toggleDetail('${event.id}')">
                            📖 <span id="btn-text-${event.id}">展开详情</span>
                        </button>
                    ` : ''}
                    <button class="btn-primary" onclick="historyToday.askAI('${event.title}')">
                        💬 与AI讨论
                    </button>
                    ${isAdmin ? `
                        <button class="btn-admin admin-only" onclick="historyToday.editEvent('${event.id}')">
                            ✏️ 编辑
                        </button>
                        <button class="btn-admin admin-only" onclick="historyToday.deleteEvent('${event.id}')">
                            🗑️ 删除
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 展开/收起详情
    toggleDetail(eventId) {
        const detailEl = document.getElementById(`detail-${eventId}`);
        const btnTextEl = document.getElementById(`btn-text-${eventId}`);
        
        if (detailEl.classList.contains('show')) {
            detailEl.classList.remove('show');
            btnTextEl.textContent = '展开详情';
        } else {
            detailEl.classList.add('show');
            btnTextEl.textContent = '收起详情';
        }
    }

    // 与AI讨论
    askAI(eventTitle) {
        const question = `请详细介绍一下"${eventTitle}"这个历史事件,它对中华民族伟大复兴有什么重要意义?`;
        localStorage.setItem('ai_pre_question', question);
        window.location.href = 'ai.html';
    }

    // 跳转到指定日期
    jumpToDate() {
        const month = document.getElementById('monthSelect').value;
        const day = document.getElementById('daySelect').value;
        const date = `${month}-${day}`;
        
        this.currentDate = date;
        this.displayTodayDate();
        this.checkImportantDate();
        this.renderEvents(date);
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 返回今天
    backToToday() {
        this.currentDate = this.getTodayDate();
        const [month, day] = this.currentDate.split('-');
        document.getElementById('monthSelect').value = month;
        document.getElementById('daySelect').value = day;
        
        this.displayTodayDate();
        this.checkImportantDate();
        this.renderEvents(this.currentDate);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 显示添加事件弹窗
    showAddEventModal() {
        document.getElementById('modalTitle').textContent = '添加历史事件';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventModal').classList.add('show');
    }

    // 编辑事件
    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        document.getElementById('modalTitle').textContent = '编辑历史事件';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventYear').value = event.year;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('eventTags').value = Array.isArray(event.tags) ? event.tags.join(',') : '';
        document.getElementById('eventSummary').value = event.summary;
        document.getElementById('eventDetail').value = event.detail || '';
        document.getElementById('eventImportance').value = event.importance || 'medium';

        document.getElementById('eventModal').classList.add('show');
    }

    // 保存事件
    async saveEvent() {
        const eventId = document.getElementById('eventId').value;
        const eventData = {
            date: document.getElementById('eventDate').value,
            year: parseInt(document.getElementById('eventYear').value),
            title: document.getElementById('eventTitle').value,
            category: document.getElementById('eventCategory').value,
            tags: document.getElementById('eventTags').value.split(',').map(t => t.trim()).filter(t => t),
            summary: document.getElementById('eventSummary').value,
            detail: document.getElementById('eventDetail').value,
            importance: document.getElementById('eventImportance').value
        };

        try {
            let response;
            if (eventId) {
                // 编辑
                response = await fetch(`/api/history/events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(eventData)
                });
            } else {
                // 新增
                response = await fetch('/api/history/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(eventData)
                });
            }

            const data = await response.json();
            if (data.ok) {
                alert(eventId ? '编辑成功!' : '添加成功!');
                this.closeModal();
                await this.loadAllEvents();
                this.renderEvents(this.currentDate);
            } else {
                alert('操作失败: ' + data.error);
            }
        } catch (error) {
            console.error('保存事件失败:', error);
            alert('操作失败,请重试');
        }
    }

    // 删除事件
    async deleteEvent(eventId) {
        if (!confirm('确认删除此历史事件吗?')) return;

        try {
            const response = await fetch(`/api/history/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                }
            });

            const data = await response.json();
            if (data.ok) {
                alert('删除成功!');
                await this.loadAllEvents();
                this.renderEvents(this.currentDate);
            } else {
                alert('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('删除事件失败:', error);
            alert('删除失败,请重试');
        }
    }

    // 关闭弹窗
    closeModal() {
        document.getElementById('eventModal').classList.remove('show');
    }
}

// 全局实例
let historyToday;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    historyToday = new HistoryToday();
});

// 全局函数 - 给HTML调用
function showAddEventModal() {
    historyToday.showAddEventModal();
}

function jumpToDate() {
    historyToday.jumpToDate();
}

function backToToday() {
    historyToday.backToToday();
}

function saveEvent() {
    historyToday.saveEvent();
}

function closeModal() {
    historyToday.closeModal();
}

// 点击弹窗外部关闭
window.addEventListener('click', (e) => {
    const modal = document.getElementById('eventModal');
    if (e.target === modal) {
        closeModal();
    }
});