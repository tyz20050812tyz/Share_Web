// 创作竞赛系统 - JavaScript逻辑

class ContestApp {
    constructor() {
        this.contests = [];
        this.submissions = [];
        this.currentUser = localStorage.getItem('login_user');
        this.currentRole = localStorage.getItem('login_role');
        this.currentTab = 'ongoing';
        this.init();
    }

    async init() {
        if (!this.currentUser) {
            alert('请先登录!');
            location.href = 'login.html';
            return;
        }

        this.showAdminUI();
        this.setupEventListeners();
        await this.loadContests();
        await this.loadSubmissions();
        this.renderAll();
    }

    showAdminUI() {
        if (this.currentRole === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
            });
        }
    }

    setupEventListeners() {
        // 字数统计
        const contentInput = document.getElementById('submitContent');
        if (contentInput) {
            contentInput.addEventListener('input', () => {
                const count = contentInput.value.length;
                document.getElementById('charCount').textContent = count;
            });
        }
    }

    async loadContests() {
        try {
            const response = await fetch('/api/contests');
            const data = await response.json();
            if (data.ok) {
                this.contests = data.contests || [];
            }
        } catch (error) {
            console.error('加载竞赛失败:', error);
        }
    }

    async loadSubmissions() {
        try {
            const response = await fetch('/api/contests');
            const data = await response.json();
            if (data.ok) {
                const contests = data.contests || [];
                let allSubmissions = [];

                for (const contest of contests) {
                    const subResp = await fetch(`/api/contests/${contest.id}/submissions`);
                    const subData = await subResp.json();
                    if (subData.ok) {
                        allSubmissions = allSubmissions.concat(subData.submissions || []);
                    }
                }

                this.submissions = allSubmissions;
            }
        } catch (error) {
            console.error('加载作品失败:', error);
        }
    }

    renderAll() {
        this.renderContests('ongoing');
        this.renderContests('ended');
        this.renderMySubmissions();
        this.updateCounts();
    }

    updateCounts() {
        const ongoing = this.contests.filter(c => c.status === 'ongoing').length;
        const ended = this.contests.filter(c => c.status === 'ended').length;
        const my = this.submissions.filter(s => s.author === this.currentUser).length;

        document.getElementById('ongoingCount').textContent = ongoing;
        document.getElementById('endedCount').textContent = ended;
        document.getElementById('myCount').textContent = my;
    }

    switchTab(tab) {
        this.currentTab = tab;

        // 更新标签样式
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
    }

    renderContests(status) {
        const containerId = status === 'ongoing' ? 'ongoingContests' : 'endedContests';
        const container = document.getElementById(containerId);
        const contestList = this.contests.filter(c => c.status === status);

        if (contestList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>暂无${status === 'ongoing' ? '进行中' : '已结束'}的竞赛</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = contestList.map(c => this.createContestCard(c)).join('');
    }

    createContestCard(contest) {
            const isAdmin = this.currentRole === 'admin';
            const isOngoing = contest.status === 'ongoing';

            return `
            <div class="contest-card">
                <span class="contest-status status-${contest.status}">
                    ${isOngoing ? '🟢 进行中' : '⚫ 已结束'}
                </span>
                
                <h3 class="contest-title">${contest.title}</h3>
                <p class="contest-desc">${contest.description}</p>
                
                <div class="contest-meta">
                    <span>📅 ${contest.startDate} ~ ${contest.endDate}</span>
                    <span>📝 ${contest.submissionCount || 0}篇投稿</span>
                </div>
                
                <div class="contest-actions">
                    ${isOngoing ? `
                        <button class="btn btn-primary" onclick="contestApp.showSubmitModal('${contest.id}')">
                            ✍️ 参与投稿
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="contestApp.viewSubmissions('${contest.id}')">
                        📋 查看作品
                    </button>
                    ${isAdmin ? `
                        <button class="btn btn-secondary admin-only" onclick="contestApp.editContest('${contest.id}')">
                            ✏️ 编辑
                        </button>
                        ${isOngoing ? `
                            <button class="btn btn-danger admin-only" onclick="contestApp.endContest('${contest.id}')">
                                🏁 结束
                            </button>
                        ` : ''}
                        <button class="btn btn-danger admin-only" onclick="contestApp.deleteContest('${contest.id}')">
                            🗑️ 删除
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderMySubmissions() {
        const container = document.getElementById('mySubmissions');
        const myWorks = this.submissions.filter(s => s.author === this.currentUser);

        if (myWorks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✍️</div>
                    <h3>您还没有投稿作品</h3>
                    <p>快去参加竞赛,展现你的才华吧!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myWorks.map(s => this.createSubmissionCard(s, true)).join('');
    }

    createSubmissionCard(submission, isMyWork = false) {
        const isAdmin = this.currentRole === 'admin';
        const canEdit = isMyWork || isAdmin;
        const hasVoted = submission.voters && submission.voters.includes(this.currentUser);

        return `
            <div class="submission-card">
                <div class="submission-header">
                    <h4 class="submission-title">${submission.title}</h4>
                    ${submission.featured ? '<span class="featured-badge">⭐ 精选作品</span>' : ''}
                </div>
                
                <div class="submission-meta">
                    <span>👤 ${submission.author}</span>
                    <span>📁 ${submission.category}</span>
                    <span>📅 ${new Date(submission.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="submission-content">
                    ${submission.content.substring(0, 150)}...
                </div>
                
                <div class="submission-stats">
                    <div class="stat-item">
                        <span>👍</span>
                        <span>${submission.votes || 0}票</span>
                    </div>
                    <div class="stat-item">
                        <span>👁️</span>
                        <span>${submission.views || 0}浏览</span>
                    </div>
                </div>
                
                <div class="submission-actions">
                    <button class="btn btn-primary" onclick="contestApp.viewDetail('${submission.id}')">
                        📖 查看详情
                    </button>
                    ${!hasVoted && !isMyWork ? `
                        <button class="btn btn-primary" onclick="contestApp.vote('${submission.id}')">
                            👍 投票
                        </button>
                    ` : ''}
                    ${canEdit ? `
                        <button class="btn btn-secondary" onclick="contestApp.editSubmission('${submission.id}')">
                            ✏️ 编辑
                        </button>
                        <button class="btn btn-danger" onclick="contestApp.deleteSubmission('${submission.id}')">
                            🗑️ 删除
                        </button>
                    ` : ''}
                    ${isAdmin ? `
                        <button class="btn btn-secondary admin-only" onclick="contestApp.toggleFeatured('${submission.id}', ${!submission.featured})">
                            ${submission.featured ? '取消精选' : '⭐ 设为精选'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 显示创建竞赛弹窗
    showCreateContestModal() {
        document.getElementById('contestModalTitle').textContent = '创建新竞赛';
        document.getElementById('contestForm').reset();
        document.getElementById('contestId').value = '';
        document.getElementById('contestModal').classList.add('show');
    }

    // 编辑竞赛
    editContest(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;

        document.getElementById('contestModalTitle').textContent = '编辑竞赛';
        document.getElementById('contestId').value = contest.id;
        document.getElementById('contestTitle').value = contest.title;
        document.getElementById('contestDescription').value = contest.description;
        document.getElementById('contestCategory').value = contest.category;
        document.getElementById('contestStartDate').value = contest.startDate;
        document.getElementById('contestEndDate').value = contest.endDate;
        document.getElementById('contestRules').value = contest.rules || '';
        document.getElementById('contestPrize').value = contest.prize || '';

        document.getElementById('contestModal').classList.add('show');
    }

    // 保存竞赛
    async saveContest() {
        const contestId = document.getElementById('contestId').value;
        const contestData = {
            title: document.getElementById('contestTitle').value,
            description: document.getElementById('contestDescription').value,
            category: document.getElementById('contestCategory').value,
            startDate: document.getElementById('contestStartDate').value,
            endDate: document.getElementById('contestEndDate').value,
            rules: document.getElementById('contestRules').value,
            prize: document.getElementById('contestPrize').value
        };

        try {
            let response;
            if (contestId) {
                response = await fetch(`/api/contests/${contestId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(contestData)
                });
            } else {
                response = await fetch('/api/contests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(contestData)
                });
            }

            const data = await response.json();
            if (data.ok) {
                alert(contestId ? '编辑成功!' : '创建成功!');
                this.closeModal('contestModal');
                await this.loadContests();
                this.renderAll();
            } else {
                alert('操作失败: ' + data.error);
            }
        } catch (error) {
            console.error('保存竞赛失败:', error);
            alert('操作失败,请重试');
        }
    }

    // 删除竞赛
    async deleteContest(contestId) {
        if (!confirm('确认删除此竞赛吗?这将同时删除所有关联的投稿作品!')) return;

        try {
            const response = await fetch(`/api/contests/${contestId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                }
            });

            const data = await response.json();
            if (data.ok) {
                alert('删除成功!');
                await this.loadContests();
                await this.loadSubmissions();
                this.renderAll();
            } else {
                alert('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('删除竞赛失败:', error);
            alert('删除失败,请重试');
        }
    }

    // 结束竞赛
    async endContest(contestId) {
        if (!confirm('确认结束此竞赛吗?结束后将无法继续投稿')) return;

        try {
            const response = await fetch(`/api/contests/${contestId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                }
            });

            const data = await response.json();
            if (data.ok) {
                alert('竞赛已结束!');
                await this.loadContests();
                this.renderAll();
            } else {
                alert('操作失败: ' + data.error);
            }
        } catch (error) {
            console.error('结束竞赛失败:', error);
            alert('操作失败,请重试');
        }
    }

    // 显示投稿弹窗
    showSubmitModal(contestId) {
        const contest = this.contests.find(c => c.id === contestId);
        if (!contest) return;

        document.getElementById('submitModalTitle').textContent = '投稿作品';
        document.getElementById('contestInfo').innerHTML = `
            <strong>竞赛主题:</strong> ${contest.title}<br>
            <strong>截止日期:</strong> ${contest.endDate}
        `;
        document.getElementById('submitForm').reset();
        document.getElementById('submitContestId').value = contestId;
        document.getElementById('submitId').value = '';
        document.getElementById('charCount').textContent = '0';
        
        document.getElementById('submitModal').classList.add('show');
    }

    // 提交作品
    async submitWork() {
        const submitId = document.getElementById('submitId').value;
        const workData = {
            contestId: document.getElementById('submitContestId').value,
            title: document.getElementById('submitTitle').value,
            content: document.getElementById('submitContent').value,
            category: document.getElementById('submitCategory').value,
            tags: document.getElementById('submitTags').value.split(',').map(t => t.trim()).filter(t => t)
        };

        // 验证字数
        if (workData.content.length < 1000 || workData.content.length > 3000) {
            alert('作品内容需要在1000-3000字之间!');
            return;
        }

        try {
            let response;
            if (submitId) {
                response = await fetch(`/api/submissions/${submitId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(workData)
                });
            } else {
                response = await fetch('/api/contests/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-user': encodeURIComponent(this.currentUser),
                        'x-auth-role': this.currentRole
                    },
                    body: JSON.stringify(workData)
                });
            }

            const data = await response.json();
            if (data.ok) {
                alert(submitId ? '编辑成功!' : '投稿成功!');
                this.closeModal('submitModal');
                await this.loadSubmissions();
                await this.loadContests();
                this.renderAll();
            } else {
                alert('操作失败: ' + data.error);
            }
        } catch (error) {
            console.error('提交作品失败:', error);
            alert('操作失败,请重试');
        }
    }

    // 编辑作品
    editSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        const contest = this.contests.find(c => c.id === submission.contestId);
        if (!contest) return;

        document.getElementById('submitModalTitle').textContent = '编辑作品';
        document.getElementById('contestInfo').innerHTML = `
            <strong>竞赛主题:</strong> ${contest.title}
        `;
        document.getElementById('submitId').value = submission.id;
        document.getElementById('submitContestId').value = submission.contestId;
        document.getElementById('submitTitle').value = submission.title;
        document.getElementById('submitContent').value = submission.content;
        document.getElementById('submitCategory').value = submission.category;
        document.getElementById('submitTags').value = (submission.tags || []).join(',');
        document.getElementById('charCount').textContent = submission.content.length;

        document.getElementById('submitModal').classList.add('show');
    }

    // 删除作品
    async deleteSubmission(submissionId) {
        if (!confirm('确认删除此作品吗?')) return;

        try {
            const response = await fetch(`/api/submissions/${submissionId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                }
            });

            const data = await response.json();
            if (data.ok) {
                alert('删除成功!');
                await this.loadSubmissions();
                await this.loadContests();
                this.renderAll();
            } else {
                alert('删除失败: ' + data.error);
            }
        } catch (error) {
            console.error('删除作品失败:', error);
            alert('删除失败,请重试');
        }
    }

    // 投票
    async vote(submissionId) {
        try {
            const response = await fetch('/api/contests/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                },
                body: JSON.stringify({ submissionId })
            });

            const data = await response.json();
            if (data.ok) {
                alert('投票成功!');
                await this.loadSubmissions();
                this.renderAll();
            } else {
                alert('投票失败: ' + data.error);
            }
        } catch (error) {
            console.error('投票失败:', error);
            alert('投票失败,请重试');
        }
    }

    // 查看作品详情
    async viewDetail(submissionId) {
        try {
            const response = await fetch(`/api/submissions/${submissionId}`);
            const data = await response.json();
            
            if (data.ok) {
                const submission = data.submission;
                const detailHTML = `
                    <h2>${submission.title}</h2>
                    <div style="color:#999;margin:10px 0;padding:10px 0;border-bottom:1px solid #eee;">
                        <span>👤 ${submission.author}</span> · 
                        <span>📁 ${submission.category}</span> · 
                        <span>📅 ${new Date(submission.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${submission.tags && submission.tags.length > 0 ? `
                        <div style="margin:15px 0;">
                            ${submission.tags.map(tag => `<span style="padding:4px 12px;background:#f0f0f0;border-radius:15px;font-size:0.9em;margin-right:8px;">#${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="line-height:1.8;color:#666;margin:20px 0;white-space:pre-wrap;">
                        ${submission.content}
                    </div>
                    <div style="padding:15px 0;border-top:1px solid #eee;color:#999;">
                        <span style="margin-right:20px;">👍 ${submission.votes || 0}票</span>
                        <span>👁️ ${submission.views || 0}浏览</span>
                    </div>
                `;
                
                document.getElementById('submissionDetail').innerHTML = detailHTML;
                document.getElementById('detailModal').classList.add('show');
            }
        } catch (error) {
            console.error('查看详情失败:', error);
            alert('查看详情失败');
        }
    }

    // 查看竞赛的所有作品
    async viewSubmissions(contestId) {
        // 跳转到作品展示页面，并自动选择该竞赛
        location.href = `contest_works.html?contest=${contestId}`;
    }

    // 切换精选状态
    async toggleFeatured(submissionId, featured) {
        try {
            const response = await fetch(`/api/submissions/${submissionId}/feature`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole
                },
                body: JSON.stringify({ featured })
            });

            const data = await response.json();
            if (data.ok) {
                alert(featured ? '已设为精选!' : '已取消精选!');
                await this.loadSubmissions();
                this.renderAll();
            } else {
                alert('操作失败: ' + data.error);
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败,请重试');
        }
    }

    // 保存草稿
    saveDraft() {
        const draft = {
            contestId: document.getElementById('submitContestId').value,
            title: document.getElementById('submitTitle').value,
            content: document.getElementById('submitContent').value,
            category: document.getElementById('submitCategory').value,
            tags: document.getElementById('submitTags').value,
            savedAt: new Date().toISOString()
        };

        const drafts = JSON.parse(localStorage.getItem('contestDrafts') || '[]');
        drafts.push(draft);
        localStorage.setItem('contestDrafts', JSON.stringify(drafts));

        alert('草稿已保存!');
    }

    // 显示统计数据
    showStatistics() {
        const totalContests = this.contests.length;
        const ongoingContests = this.contests.filter(c => c.status === 'ongoing').length;
        const totalSubmissions = this.submissions.length;
        const totalVotes = this.submissions.reduce((sum, s) => sum + (s.votes || 0), 0);

        alert(`
📊 竞赛统计数据

总竞赛数: ${totalContests}
进行中: ${ongoingContests}
已结束: ${totalContests - ongoingContests}

总投稿数: ${totalSubmissions}
总投票数: ${totalVotes}
        `);
    }

    // 关闭弹窗
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
}

// 全局实例
let contestApp;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    contestApp = new ContestApp();
});

// 点击弹窗外部关闭
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});