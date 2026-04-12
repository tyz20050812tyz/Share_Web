// ===== 全局状态管理 =====
const AppState = {
    currentMode: null, // 'quiz' or 'dialogue'
    currentCharacter: null,
    quizScore: 0, // 本轮得分
    quizCorrect: 0, // 本轮答对数
    quizTotal: 0, // 本轮总题数
    bestScore: 0, // 历史最高分
    totalGames: 0, // 总局数
    totalCorrect: 0, // 历史累计答对数
    totalQuestions: 0, // 历史累计答题数
    currentQuestion: null,
    currentQuestionIndex: 0,
    timer: 120, // 2分钟总时长
    timerInterval: null,
    sessionStartTime: null, // 本次答题开始时间
    sessionActive: false, // 答题会话是否激活
    mistakes: [],
    achievements: {
        bronze: { unlocked: false, icon: '🥉', title: '理论学习', desc: '答对10题', target: 10 },
        silver: { unlocked: false, icon: '🥈', title: '理论达人', desc: '答对50题', target: 50 },
        gold: { unlocked: false, icon: '🥇', title: '思想先锋', desc: '答对100题', target: 100 },
        speed: { unlocked: false, icon: '⚡', title: '快速反应', desc: '5秒内答对一题', target: 1 },
        perfect: { unlocked: false, icon: '💯', title: '满分答卷', desc: '连续答对10题', target: 10 }
    },
    consecutiveCorrect: 0
};

// ===== 历史人物数据库 =====
const HistoricalCharacters = [{
        id: 'maozedong',
        name: '毛泽东',
        title: '中国共产党主要缔造者、伟大领袖',
        avatar: '时间轴+ai图片/毛泽东.jpeg',
        background: '毛泽东（1893-1976），湖南湘潭人。中国共产党、中国人民解放军和中华人民共和国的主要缔造者和领导人。他将马克思列宁主义基本原理同中国具体实际相结合，创立了毛泽东思想，领导中国人民取得了新民主主义革命的伟大胜利。',
        personality: '思想深邃、意志坚定、善于从实践中总结理论',
        systemPrompt: '你是毛泽东，中国共产党的主要缔造者。你善于将马克思主义与中国实际相结合，提出了农村包围城市的革命道路、新民主主义革命理论等重要思想。请以毛泽东的口吻回答问题，展现你对中国革命和理论创新的深刻思考。'
    },
    {
        id: 'liushaoqi',
        name: '刘少奇',
        title: '七大代表、杰出的马克思主义理论家',
        avatar: '时间轴+ai图片/刘少奇.jpeg',
        background: '刘少奇（1898-1969），湖南花明楼人。杰出的马克思主义理论家，在党的七大上作了《关于修改党章的报告》，系统阐述了毛泽东思想，为确立毛泽东思想的指导地位作出了重要贡献。著有《论共产党员的修养》等重要著作。',
        personality: '理论功底深厚、严谨务实、注重党性修养',
        systemPrompt: '你是刘少奇，在党的七大上作了关于修改党章的报告。你系统阐述了毛泽东思想的科学内涵，为毛泽东思想写入党章做了重要理论准备。请以刘少奇的口吻回答关于党的建设、党员修养和毛泽东思想的问题。'
    },
    {
        id: 'zhude',
        name: '朱德',
        title: '人民军队的主要缔造者',
        avatar: '时间轴+ai图片/朱德.jpeg',
        background: '朱德（1886-1976），四川仪陇人。伟大的马克思主义者、无产阶级革命家、军事家，人民军队的主要缔造者之一。与毛泽东共同开辟了井冈山革命根据地，在七大上当选为中央委员。',
        personality: '忠厚朴实、坚韧不拔、军事才能卓越',
        systemPrompt: '你是朱德，人民军队的主要缔造者。你与毛泽东共同开辟了井冈山革命根据地，深刻理解武装斗争作为三大法宝之一的重要意义。请以朱德的口吻回答关于革命战争、军队建设和毛泽东军事思想的问题。'
    },
    {
        id: 'zhouenlai',
        name: '周恩来',
        title: '伟大的无产阶级革命家',
        avatar: '时间轴+ai图片/周恩来.jpeg',
        background: '周恩来（1898-1976），江苏淮安人。伟大的马克思主义者、无产阶级革命家、政治家、军事家、外交家。在中国革命和建设中发挥了不可替代的作用，是统一战线工作的杰出代表。',
        personality: '温文尔雅、顾全大局、善于团结各方力量',
        systemPrompt: '你是周恩来，伟大的无产阶级革命家。你在统一战线工作中做出了卓越贡献，深刻理解统一战线作为三大法宝之一的重要性。请以周恩来的口吻回答关于统一战线、外交策略和革命实践的问题。'
    },
    {
        id: 'renbishi',
        name: '任弼时',
        title: '党的重要领导人',
        avatar: '时间轴+ai图片/任弼时.jpeg',
        background: '任弼时（1904-1950），湖南湘阴人。中国共产党的重要领导人之一，在延安整风运动和党的七大中发挥了重要作用。他是中共七届一中全会选举的五大书记之一，被誉为"党的骆驼"。',
        personality: '勤恳踏实、任劳任怨、对党忠诚',
        systemPrompt: '你是任弼时，中国共产党的重要领导人。你在延安整风运动和七大筹备中做出了重要贡献，深刻理解延安整风对于思想统一的重要意义。请以任弼时的口吻回答关于整风运动、党的建设和思想统一的问题。'
    }
];

// ===== 题库（从游戏中提取，共150题） =====
// 注：为了避免重复，每次答题会记录已出现的题目索引
let QuestionBank = []; // 将在加载时从 game.js 复制

// 从 game.js 加载题库
function loadQuestionBankFromGame() {
    // 尝试加载 game.js 的题库
    // 如果加载失败，使用默认题库
    try {
        // 检查是否有 window.gameQuestions （从 game.js 导出）
        if (typeof window.gameQuestions !== 'undefined') {
            QuestionBank = window.gameQuestions;
            console.log(`从 game.js加载了 ${QuestionBank.length} 道题目`);
            return;
        }
    } catch (e) {
        console.warn('无法从 game.js加载题库，使用内置题库', e);
    }

    // 使用内置题库（毛泽东思想主题）
    QuestionBank = [
        // 毛泽东思想与党的七大相关题目
        {
            question: "党的七大是在哪一年召开的？",
            options: ["1943年", "1944年", "1945年", "1946年"],
            correct: 2
        },
        {
            question: "毛泽东思想的活的灵魂包括哪三个方面？",
            options: ["实事求是、群众路线、独立自主", "理论联系实际、密切联系群众、批评与自我批评", "武装斗争、统一战线、党的建设", "农村包围城市、武装夺取政权、土地革命"],
            correct: 0
        },
        {
            question: "《新民主主义论》是毛泽东在哪一年发表的？",
            options: ["1938年", "1939年", "1940年", "1941年"],
            correct: 2
        },
        {
            question: "延安整风运动主要反对哪三种不良作风？",
            options: ["官僚主义、形式主义、享乐主义", "主观主义、宗派主义、党八股", "个人主义、分散主义、自由主义", "教条主义、经验主义、本本主义"],
            correct: 1
        },
        {
            question: "三大法宝是指什么？",
            options: ["土地革命、武装斗争、根据地建设", "统一战线、武装斗争、党的建设", "群众路线、实事求是、独立自主", "理论创新、实践创新、制度创新"],
            correct: 1
        },
        {
            question: "毛泽东在哪部著作中提出了'枪杆子里出政权'的著名论断？",
            options: ["《星星之火，可以燎原》", "《井冈山的斗争》", "《中国的红色政权为什么能够存在》", "八七会议"],
            correct: 3
        },
        {
            question: "农村包围城市、武装夺取政权的革命道路是在哪个时期形成的？",
            options: ["大革命时期", "土地革命战争时期", "抗日战争时期", "解放战争时期"],
            correct: 1
        },
        {
            question: "党的七大确立的指导思想是什么？",
            options: ["马克思列宁主义", "毛泽东思想", "邓小平理论", "三个代表重要思想"],
            correct: 1
        },
        {
            question: "《论共产党员的修养》的作者是谁？",
            options: ["毛泽东", "刘少奇", "周恩来", "朱德"],
            correct: 1
        },
        {
            question: "延安整风运动开始于哪一年？",
            options: ["1940年", "1941年", "1942年", "1943年"],
            correct: 2
        },
        {
            question: "毛泽东思想的精髓是什么？",
            options: ["群众路线", "实事求是", "独立自主", "武装斗争"],
            correct: 1
        },
        {
            question: "'没有调查就没有发言权'出自毛泽东的哪篇著作？",
            options: ["《反对本本主义》", "《实践论》", "《矛盾论》", "《改造我们的学习》"],
            correct: 0
        },
        {
            question: "井冈山革命根据地是毛泽东和谁共同开辟的？",
            options: ["周恩来", "刘少奇", "朱德", "任弼时"],
            correct: 2
        },
        {
            question: "党的七届一中全会选举的五大书记不包括谁？",
            options: ["毛泽东", "刘少奇", "周恩来", "陈云"],
            correct: 3
        },
        {
            question: "被誉为'党的骆驼'的是哪位领导人？",
            options: ["刘少奇", "周恩来", "朱德", "任弼时"],
            correct: 3
        },
        {
            question: "毛泽东在哪篇著作中系统论述了新民主主义革命理论？",
            options: ["《中国革命和中国共产党》", "《新民主主义论》", "《论联合政府》", "《论人民民主专政》"],
            correct: 1
        },
        {
            question: "统一战线中的两个联盟是指什么？",
            options: ["工农联盟和民族资产阶级联盟", "工人阶级同农民阶级、广大知识分子及其他劳动者的联盟，工人阶级同非劳动人民的联盟", "国共两党联盟", "国内联盟和国际联盟"],
            correct: 1
        },
        {
            question: "《实践论》和《矛盾论》是毛泽东在哪一年发表的？",
            options: ["1935年", "1936年", "1937年", "1938年"],
            correct: 2
        },
        {
            question: "毛泽东提出的'两个务必'是在什么会议上？",
            options: ["党的七大", "七届二中全会", "党的八大", "遵义会议"],
            correct: 1
        },
        {
            question: "毛泽东思想被确立为党的指导思想是在党的第几次代表大会？",
            options: ["六大", "七大", "八大", "九大"],
            correct: 1
        }
    ];

    console.log(`使用内置题库，共 ${QuestionBank.length} 道题目`);
}

// 在页面加载时加载题库
loadQuestionBankFromGame();

// ===== 答题挑战功能 =====
function startQuizChallenge() {
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('quiz-challenge').style.display = 'block';
    AppState.currentMode = 'quiz';

    loadQuizData();
    renderAchievements();
    loadLeaderboard(); // 从服务器加载排行榜
    renderMistakes();

    // 开始新的答题会话
    startQuizSession();
}

function startQuizSession() {
    // 重置本轮会话数据（得分从0开始）
    AppState.quizScore = 0;
    AppState.quizCorrect = 0;
    AppState.quizTotal = 0;
    AppState.consecutiveCorrect = 0;
    AppState.usedQuestions = []; // 重置已使用题目列表，确保每局不重复

    // 设置会话状态
    AppState.sessionActive = true;
    AppState.sessionStartTime = Date.now();
    AppState.timer = 120; // 2分钟

    // 更新显示
    updateQuizStats();

    // 开始第一题
    nextQuestion();

    // 启动总计时器
    startSessionTimer();
}

function startSessionTimer() {
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }

    AppState.timerInterval = setInterval(() => {
        if (!AppState.sessionActive) {
            clearInterval(AppState.timerInterval);
            return;
        }

        AppState.timer--;
        updateTimerDisplay();

        if (AppState.timer <= 0) {
            endQuizSession();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(AppState.timer / 60);
    const seconds = AppState.timer % 60;
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // 时间不足30秒时变红提醒
    if (AppState.timer <= 30) {
        timerElement.style.color = '#f44336';
    } else {
        timerElement.style.color = '#c62828';
    }
}

function endQuizSession() {
    AppState.sessionActive = false;
    clearInterval(AppState.timerInterval);

    // 禁用所有选项按钮
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    // 更新历史统计
    AppState.totalGames++;
    AppState.totalCorrect += AppState.quizCorrect;
    AppState.totalQuestions += AppState.quizTotal;

    // 更新最高分
    if (AppState.quizScore > AppState.bestScore) {
        AppState.bestScore = AppState.quizScore;
    }

    // 检查成就（基于历史累计）
    if (AppState.totalCorrect >= 10) unlockAchievement('bronze');
    if (AppState.totalCorrect >= 50) unlockAchievement('silver');
    if (AppState.totalCorrect >= 100) unlockAchievement('gold');

    // 保存本地数据
    saveQuizData();

    // 提交成绩到服务器
    submitScoreToServer();

    // 显示结束提示
    const message = `⏰ 时间到！

本轮成绩：
答题数：${AppState.quizTotal}题
答对：${AppState.quizCorrect}题
本轮得分：${AppState.quizScore}分

历史统计：
总局数：${AppState.totalGames}局
历史最高分：${AppState.bestScore}分
累计答对：${AppState.totalCorrect}题`;

    alert(message);

    // 询问是否再来一轮
    setTimeout(() => {
        if (confirm('是否开始新的一轮答题？')) {
            startQuizSession();
        } else {
            backToSelection();
        }
    }, 500);
}

function loadQuizData() {
    const saved = localStorage.getItem('quizData');
    if (saved) {
        const data = JSON.parse(saved);
        AppState.bestScore = data.bestScore || 0;
        AppState.totalGames = data.totalGames || 0;
        AppState.totalCorrect = data.totalCorrect || 0;
        AppState.totalQuestions = data.totalQuestions || 0;
        AppState.mistakes = data.mistakes || [];
        AppState.achievements = {...AppState.achievements, ...data.achievements };
    }
    updateQuizStats();
}

function saveQuizData() {
    localStorage.setItem('quizData', JSON.stringify({
        bestScore: AppState.bestScore,
        totalGames: AppState.totalGames,
        totalCorrect: AppState.totalCorrect,
        totalQuestions: AppState.totalQuestions,
        mistakes: AppState.mistakes,
        achievements: AppState.achievements
    }));
}

function updateQuizStats() {
    document.getElementById('quiz-score').textContent = AppState.quizScore;
    document.getElementById('quiz-correct').textContent = AppState.quizCorrect;
    document.getElementById('quiz-total').textContent = AppState.quizTotal;
}

function nextQuestion() {
    // 检查会话是否还在进行
    if (!AppState.sessionActive) {
        return;
    }

    // 不重复选题逻辑：从未使用的题目中随机选择
    if (!AppState.usedQuestions) {
        AppState.usedQuestions = [];
    }

    // 如果所有题目都用过了，重置已用题目列表
    if (AppState.usedQuestions.length >= QuestionBank.length) {
        console.log(`已答完所有 ${QuestionBank.length} 道题，重置题库`);
        AppState.usedQuestions = [];
    }

    // 获取未使用的题目索引
    const availableIndexes = [];
    for (let i = 0; i < QuestionBank.length; i++) {
        if (!AppState.usedQuestions.includes(i)) {
            availableIndexes.push(i);
        }
    }

    // 从未使用的题目中随机选择
    const randomIndex = Math.floor(Math.random() * availableIndexes.length);
    const questionIndex = availableIndexes[randomIndex];

    // 记录已使用的题目
    AppState.usedQuestions.push(questionIndex);
    AppState.currentQuestion = QuestionBank[questionIndex];

    console.log(`第 ${AppState.quizTotal + 1} 题，题库索引 ${questionIndex}，已用 ${AppState.usedQuestions.length}/${QuestionBank.length} 道题`);

    // 显示题目
    document.getElementById('question-text').textContent = AppState.currentQuestion.question;

    // 显示选项
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';
    AppState.currentQuestion.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(index);
        optionsGrid.appendChild(btn);
    });
}

function checkAnswer(selectedIndex) {
    // 检查会话是否还在进行
    if (!AppState.sessionActive) {
        return;
    }

    const buttons = document.querySelectorAll('.option-btn');
    const isCorrect = selectedIndex === AppState.currentQuestion.correct;

    // 显示正确答案
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === AppState.currentQuestion.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    AppState.quizTotal++;

    if (isCorrect) {
        AppState.quizScore += 10;
        AppState.quizCorrect++;
        AppState.consecutiveCorrect++;

        // 连续答对成就
        if (AppState.consecutiveCorrect >= 10) {
            unlockAchievement('perfect');
        }
    } else {
        AppState.consecutiveCorrect = 0;
        recordMistake();
    }

    updateQuizStats();
    // 不在每题后保存，而是在会话结束时统一保存

    // 继续下一题（如果时间还够）
    setTimeout(() => {
        if (AppState.sessionActive && AppState.timer > 0) {
            nextQuestion();
        }
    }, 1500);
}

function recordMistake() {
    const mistake = {
        question: AppState.currentQuestion.question,
        correctAnswer: AppState.currentQuestion.options[AppState.currentQuestion.correct],
        timestamp: new Date().toLocaleString()
    };

    AppState.mistakes.unshift(mistake);
    if (AppState.mistakes.length > 20) {
        AppState.mistakes = AppState.mistakes.slice(0, 20);
    }

    renderMistakes();
}

function renderMistakes() {
    const list = document.getElementById('mistakes-list');
    if (!AppState.mistakes || AppState.mistakes.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #666;">暂无错题记录</p>';
        return;
    }

    list.innerHTML = AppState.mistakes.map(m => `
        <div class="mistake-item">
            <div style="font-weight: bold; margin-bottom: 10px;">❌ ${m.question}</div>
            <div style="color: #4caf50;">✅ 正确答案：${m.correctAnswer}</div>
            <div style="color: #999; font-size: 14px; margin-top: 5px;">⏰ ${m.timestamp}</div>
        </div>
    `).join('');
}

function unlockAchievement(key) {
    if (AppState.achievements[key].unlocked) return;

    AppState.achievements[key].unlocked = true;

    // 显示成就通知
    alert(`🎉 恭喜解锁成就：${AppState.achievements[key].title}\n${AppState.achievements[key].desc}`);

    renderAchievements();
    saveQuizData();
}

function renderAchievements() {
    const container = document.getElementById('quiz-achievements');
    container.innerHTML = Object.entries(AppState.achievements).map(([key, ach]) => `
        <div class="achievement-badge ${ach.unlocked ? 'unlocked' : ''}">
            <div class="badge-icon">${ach.icon}</div>
            <div class="badge-title">${ach.title}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${ach.unlocked ? '✅ 已解锁' : '🔒 未解锁'}
            </div>
        </div>
    `).join('');
}

// 提交成绩到服务器
async function submitScoreToServer() {
    const currentUser = localStorage.getItem('login_user');
    const currentRole = localStorage.getItem('user_role');

    if (!currentUser) {
        console.log('用户未登录，跳过服务器提交');
        return;
    }

    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-User': encodeURIComponent(currentUser),
                'X-Auth-Role': currentRole || 'user'
            },
            body: JSON.stringify({
                score: AppState.bestScore, // 提交历史最高分
                correct: AppState.quizCorrect,
                total: AppState.quizTotal,
                timestamp: Date.now()
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`成绩已提交！排名：${data.rank}/${data.totalUsers}`);
            // 刷新排行榜
            await loadLeaderboard();
        }
    } catch (error) {
        console.error('提交成绩失败：', error);
    }
}

// 从服务器加载排行榜
async function loadLeaderboard() {
    try {
        const response = await fetch('/api/quiz/rankings');
        if (response.ok) {
            const data = await response.json();
            renderLeaderboard(data.rankings);
        }
    } catch (error) {
        console.error('加载排行榜失败：', error);
        // 如果服务器加载失败，使用本地数据
        renderLeaderboard();
    }
}

function renderLeaderboard(serverRankings) {
    const currentUser = localStorage.getItem('login_user') || '游客';
    const container = document.getElementById('quiz-leaderboard');

    // 优先使用服务器数据，否则使用本地数据
    let rankings = serverRankings;
    if (!rankings || rankings.length === 0) {
        rankings = JSON.parse(localStorage.getItem('quizRankings') || '[]');
    }

    if (rankings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">暂无排名数据</p>';
        return;
    }

    container.innerHTML = rankings.map((r, index) => {
        const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        const userName = r.user || r.name || '匿名';
        const highlight = userName === currentUser ? 'style="font-weight: bold; color: #c62828;"' : '';

        return `
            <div class="leaderboard-item ${rankClass}">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="rank-badge">${medal}</span>
                    <span ${highlight}>${userName}</span>
                </div>
                <div style="font-size: 20px; font-weight: bold;">${r.score} 分</div>
            </div>
        `;
    }).join('');
}

// 更新排行榜（保留用于兼容）
function updateLeaderboard() {
    // 不再使用本地localStorage，改为调用loadLeaderboard
    loadLeaderboard();
}

// ===== AI对话功能 =====
function startAIDialogue() {
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('ai-dialogue').style.display = 'block';
    AppState.currentMode = 'dialogue';

    renderCharacters();
}

function renderCharacters() {
    const container = document.getElementById('character-selector');
    container.innerHTML = HistoricalCharacters.map(char => `
        <div class="character-card" onclick="selectCharacter('${char.id}')">
            <img class="character-avatar" src="${char.avatar}" alt="${char.name}" onerror="this.src='images/LOGO.png'">
            <div class="character-name">${char.name}</div>
            <div class="character-title">${char.title}</div>
        </div>
    `).join('');
}

function selectCharacter(characterId) {
    AppState.currentCharacter = HistoricalCharacters.find(c => c.id === characterId);

    // 更新选中状态
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.character-card').classList.add('active');

    // 清空聊天记录
    const chatArea = document.getElementById('chat-area');
    chatArea.innerHTML = `
        <div class="message character">
            <img class="message-avatar" src="${AppState.currentCharacter.avatar}" alt="${AppState.currentCharacter.name}" onerror="this.src='images/LOGO.png'" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(198, 40, 40, 0.3);">
            <div class="message-content">
                我是${AppState.currentCharacter.name}，${AppState.currentCharacter.title}。${AppState.currentCharacter.background.substring(0, 100)}...<br><br>
                有什么问题，尽管问我吧！
            </div>
        </div>
    `;

    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
}

async function sendMessage() {
    if (!AppState.currentCharacter) {
        alert('请先选择一个历史人物！');
        return;
    }

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // 显示用户消息
    addMessage('user', message);
    input.value = '';

    // 禁用输入
    document.getElementById('send-btn').disabled = true;
    input.disabled = true;

    // 显示"正在思考"
    const thinkingMsg = addMessage('character', '正在思考中...', true);

    try {
        // 调用AI API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: message,
                systemPrompt: AppState.currentCharacter.systemPrompt
            })
        });

        const data = await response.json();

        // 移除"正在思考"
        thinkingMsg.remove();

        // 显示AI回复
        addMessage('character', data.answer || '抱歉，我现在无法回答。请稍后再试。');

    } catch (error) {
        console.error('AI对话错误：', error);
        thinkingMsg.remove();
        addMessage('character', '抱歉，出现了一些问题。可能是网络连接或服务器问题。');
    }

    // 恢复输入
    document.getElementById('send-btn').disabled = false;
    input.disabled = false;
    input.focus();
}

function addMessage(type, content, isTemporary = false) {
    const chatArea = document.getElementById('chat-area');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;

    let avatarHtml;
    if (type === 'user') {
        // 用户消息使用emoji
        avatarHtml = '<div class="message-avatar emoji">👤</div>';
    } else {
        // AI人物消息使用真实头像
        const avatarSrc = AppState.currentCharacter ? AppState.currentCharacter.avatar : 'images/LOGO.png';
        avatarHtml = `<img class="message-avatar" src="${avatarSrc}" alt="头像" onerror="this.src='images/LOGO.png'" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(198, 40, 40, 0.3);">`;
    }

    msgDiv.innerHTML = `
        ${avatarHtml}
        <div class="message-content">${content}</div>
    `;

    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;

    return msgDiv;
}

// ===== 通用功能 =====
function backToSelection() {
    document.getElementById('mode-selection').style.display = 'block';
    document.getElementById('quiz-challenge').style.display = 'none';
    document.getElementById('ai-dialogue').style.display = 'none';

    // 清理计时器和会话状态
    AppState.sessionActive = false;
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }
}

// ===== 页面加载时初始化 =====
window.addEventListener('load', () => {
    console.log('互动学习中心已加载');
});