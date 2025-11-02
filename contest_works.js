class ContestWorksApp {
    constructor() {
        this.contests = [];
        this.submissions = [];
        this.filteredSubmissions = [];
        this.currentUser = localStorage.getItem('login_user');
        this.currentRole = localStorage.getItem('user_role');
        this.currentContestId = null;
        this.currentView = 'all';
        this.init();
    }

    async init() {
        if (!this.currentUser) {
            alert('请先登录！');
            location.href = 'login.html';
            return;
        }

        await this.loadContests();
        this.setupContestSelector();
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

    setupContestSelector() {
        const selector = document.getElementById('contestSelect');
        if (this.contests.length === 0) {
            selector.innerHTML = '<option value="">暂无竞赛</option>';
            return;
        }

        selector.innerHTML = this.contests.map(c =>
            `<option value="${c.id}">${c.title} (${c.status === 'ongoing' ? '进行中' : '已结束'})</option>`
        ).join('');

        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const contestIdFromUrl = urlParams.get('contest');

        // 默认选择第一个竞赛或URL指定的竞赛
        if (contestIdFromUrl && this.contests.some(c => c.id === contestIdFromUrl)) {
            this.currentContestId = contestIdFromUrl;
        } else if (this.contests.length > 0) {
            this.currentContestId = this.contests[0].id;
        }

        selector.value = this.currentContestId;
        this.loadWorks();
    }

    async loadWorks() {
        const selector = document.getElementById('contestSelect');
        this.currentContestId = selector.value;

        if (!this.currentContestId) {
            this.submissions = [];
            this.renderWorks();
            return;
        }

        // 获取当前竞赛信息
        const currentContest = this.contests.find(c => c.id === this.currentContestId);
        const statusElement = document.getElementById('contestStatus');

        if (currentContest) {
            if (currentContest.status === 'ongoing') {
                statusElement.innerHTML = '<span style="color: #4caf50;">🔵 投票进行中</span>';
            } else {
                statusElement.innerHTML = '<span style="color: #999;">⚫ 已结束，奖项已公布</span>';
            }
        }

        try {
            const response = await fetch(`/api/contests/${this.currentContestId}/submissions?sort=votes`);
            const data = await response.json();
            if (data.ok) {
                this.submissions = data.submissions || [];
                this.renderWorks();
                this.renderWinners();
            }
        } catch (error) {
            console.error('加载作品失败:', error);
            alert('加载作品失败，请重试');
        }
    }

    renderWorks() {
        const sortBy = document.getElementById('sortBy').value;
        const category = document.getElementById('categoryFilter').value;
        const featuredOnly = document.getElementById('featuredOnly').checked;

        // 筛选
        let filtered = [...this.submissions];

        if (category !== 'all') {
            filtered = filtered.filter(w => w.category === category);
        }

        if (featuredOnly) {
            filtered = filtered.filter(w => w.featured);
        }

        // 排序
        if (sortBy === 'votes') {
            filtered.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        } else if (sortBy === 'time') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'views') {
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        }

        this.filteredSubmissions = filtered;

        // 根据当前视图渲染
        if (this.currentView === 'top') {
            filtered = filtered.slice(0, 10);
        }

        this.renderWorkCards(filtered);
        this.updateCounts();
    }

    renderWorkCards(works) {
        const container = document.getElementById('worksGrid');

        if (works.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <div class="empty-icon">📭</div>
                    <h3>暂无作品</h3>
                    <p>该竞赛还没有作品投稿哦</p>
                </div>
            `;
            return;
        }

        container.innerHTML = works.map((work, index) =>
            this.createWorkCard(work, index + 1)
        ).join('');
    }

    createWorkCard(work, rank) {
            const hasVoted = work.voters && work.voters.includes(this.currentUser);
            const isMyWork = work.author === this.currentUser || work.userId === this.currentUser;
            const canVote = !hasVoted && !isMyWork;

            // 调试信息
            console.log(`作品: ${work.title}`);
            console.log(`  - 当前用户: ${this.currentUser}`);
            console.log(`  - 作品作者: ${work.author}`);
            console.log(`  - 是否已投票: ${hasVoted}`)
            console.log(`  - 是否自己的作品: ${isMyWork}`);
            console.log(`  - 可以投票: ${canVote}`);
            console.log(`  - voters数组:`, work.voters);

            // 获取当前竞赛状态
            const currentContest = this.contests.find(c => c.id === this.currentContestId);
            const isContestEnded = currentContest && currentContest.status === 'ended';
            const sortByVotes = document.getElementById('sortBy').value === 'votes';

            const rankClass = rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : '';
            const rankDisplay = rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : `#${rank}`;

            return `
            <div class="work-card ${work.featured ? 'featured' : ''}">
                ${sortByVotes && isContestEnded ? `
                    <div class="work-rank ${rankClass}">${rankDisplay}</div>
                ` : ''}
                
                <div class="work-content">
                    <h3 class="work-title">${work.title}</h3>
                    
                    <div class="work-meta">
                        <span>👤 ${work.author}</span>
                        <span>📁 ${work.category}</span>
                        <span>📅 ${new Date(work.createdAt).toLocaleDateString()}</span>
                    </div>

                    ${work.tags && work.tags.length > 0 ? `
                        <div style="margin: 10px 0;">
                            ${work.tags.map(tag => 
                                `<span style="padding:3px 10px;background:#f0f0f0;border-radius:12px;font-size:0.85em;margin-right:6px;">#${tag}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="work-excerpt">
                        ${work.content.substring(0, 150)}...
                    </div>
                    
                    <div class="work-stats">
                        <div class="stat-group">
                            <div class="stat-item">
                                <span>👍</span>
                                <span>${work.votes || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span>👁️</span>
                                <span>${work.views || 0}</span>
                            </div>
                        </div>
                        
                        ${canVote ? `
                            <button class="vote-button" onclick="worksApp.vote('${work.id}')">
                                <span>👍</span>
                                <span>投票</span>
                            </button>
                        ` : hasVoted ? `
                            <button class="vote-button voted" onclick="worksApp.cancelVote('${work.id}')">
                                <span>✅</span>
                                <span>已投票</span>
                            </button>
                        ` : `
                            <button class="vote-button disabled" disabled title="原因: ${isMyWork ? '不能给自己的作品投票' : '未知原因'}">
                                <span>🚫</span>
                                <span>不可投票</span>
                            </button>
                        `}
                    </div>
                    
                    <div class="work-actions">
                        <button class="btn btn-primary" onclick="worksApp.viewDetail('${work.id}')">
                            📖 查看全文
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWinners() {
        const winnersSection = document.getElementById('winnersSection');
        const winnersGrid = document.getElementById('winnersGrid');

        // 获取当前竞赛信息
        const currentContest = this.contests.find(c => c.id === this.currentContestId);
        
        // 如枟竞赛还在进行中，不显示获奖区域
        if (!currentContest || currentContest.status === 'ongoing') {
            winnersSection.style.display = 'none';
            return;
        }

        // 获取前三名
        const topWorks = [...this.submissions]
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .slice(0, 3);

        if (topWorks.length === 0) {
            winnersSection.style.display = 'none';
            return;
        }

        winnersSection.style.display = 'block';

        const medals = ['🥇', '🥈', '🥉'];
        const titles = ['一等奖', '二等奖', '三等奖'];

        // 更新标题说明
        const winnersTitle = winnersSection.querySelector('h2');
        if (winnersTitle) {
            winnersTitle.innerHTML = `🏆 获奖作品 <span style="font-size: 0.6em; color: #666; font-weight: normal;">(竞赛已结束，按票数评选)</span>`;
        }

        winnersGrid.innerHTML = topWorks.map((work, index) => `
            <div class="winner-card">
                <div class="winner-medal">${medals[index]}</div>
                <h3>${titles[index]}</h3>
                <h4 style="margin: 15px 0; color: #2c3e50;">${work.title}</h4>
                <p style="color: #666;">作者: ${work.author}</p>
                <p style="color: #999; margin-top: 10px;">
                    <span style="margin-right: 15px;">👍 ${work.votes || 0}票</span>
                    <span>👁️ ${work.views || 0}浏览</span>
                </p>
                <button class="btn btn-primary" onclick="worksApp.viewDetail('${work.id}')" 
                        style="margin-top: 15px; width: 100%;">
                    查看作品
                </button>
            </div>
        `).join('');
    }

    async vote(workId) {
        try {
            const response = await fetch('/api/contests/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole || 'user'
                },
                body: JSON.stringify({ submissionId: workId })
            });

            const data = await response.json();
            if (data.ok) {
                alert('投票成功！');
                await this.loadWorks();
            } else {
                alert('投票失败: ' + data.error);
            }
        } catch (error) {
            console.error('投票失败:', error);
            alert('投票失败，请重试');
        }
    }

    async cancelVote(workId) {
        if (!confirm('确定要取消投票吗？')) {
            return;
        }

        try {
            const response = await fetch('/api/contests/unvote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-user': encodeURIComponent(this.currentUser),
                    'x-auth-role': this.currentRole || 'user'
                },
                body: JSON.stringify({ submissionId: workId })
            });

            const data = await response.json();
            if (data.ok) {
                alert('已取消投票');
                await this.loadWorks();
            } else {
                alert('取消投票失败: ' + data.error);
            }
        } catch (error) {
            console.error('取消投票失败:', error);
            alert('取消投票失败，请重试');
        }
    }

    async viewDetail(workId) {
        try {
            const response = await fetch(`/api/submissions/${workId}`);
            const data = await response.json();
            if (data.ok) {
                const work = data.submission;
                const hasVoted = work.voters && work.voters.includes(this.currentUser);
                const isMyWork = work.author === this.currentUser || work.userId === this.currentUser;

                const detailHTML = `
                    <div class="modal-header">
                        <h2 class="modal-title">${work.title}</h2>
                        <div class="modal-meta">
                            <span>👤 作者: ${work.author}</span>
                            <span>📁 分类: ${work.category}</span>
                            <span>📅 ${new Date(work.createdAt).toLocaleDateString()}</span>
                        </div>
                        ${work.tags && work.tags.length > 0 ? `
                            <div style="margin-top: 15px;">
                                ${work.tags.map(tag => 
                                    `<span style="padding:4px 12px;background:#f0f0f0;border-radius:15px;font-size:0.9em;margin-right:8px;">#${tag}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="modal-content-body">
                        ${work.content}
                    </div>
                    
                    <div class="modal-footer">
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <span style="font-size: 1.2em; color: #666;">
                                👍 ${work.votes || 0}票
                            </span>
                            <span style="font-size: 1.2em; color: #666;">
                                👁️ ${work.views || 0}浏览
                            </span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            ${!hasVoted && !isMyWork ? `
                                <button class="btn btn-primary" onclick="worksApp.voteFromModal('${work.id}')">
                                    👍 投票
                                </button>
                            ` : hasVoted ? `
                                <button class="btn btn-primary" onclick="worksApp.cancelVoteFromModal('${work.id}')">
                                    ✅ 取消投票
                                </button>
                            ` : ''}
                            <button class="btn btn-secondary" onclick="worksApp.closeModal()" 
                                    style="background: #f0f0f0; color: #333;">
                                关闭
                            </button>
                        </div>
                    </div>
                `;

                document.getElementById('workDetail').innerHTML = detailHTML;
                document.getElementById('workModal').classList.add('show');
            }
        } catch (error) {
            console.error('查看详情失败:', error);
            alert('查看详情失败');
        }
    }

    async voteFromModal(workId) {
        await this.vote(workId);
        this.closeModal();
    }

    async cancelVoteFromModal(workId) {
        await this.cancelVote(workId);
        this.closeModal();
    }

    switchView(view) {
        this.currentView = view;

        // 更新标签样式
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        this.renderWorks();
    }

    updateCounts() {
        document.getElementById('allCount').textContent = this.filteredSubmissions.length;
        document.getElementById('topCount').textContent = Math.min(this.filteredSubmissions.length, 10);
    }

    closeModal() {
        document.getElementById('workModal').classList.remove('show');
    }
}

// 全局实例
let worksApp;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    worksApp = new ContestWorksApp();
});

// 点击弹窗外部关闭
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});