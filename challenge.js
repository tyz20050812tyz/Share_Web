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
        bronze: { unlocked: false, icon: '🥉', title: '初出茅庐', desc: '答对10题', target: 10 },
        silver: { unlocked: false, icon: '🥈', title: '博古通今', desc: '答对50题', target: 50 },
        gold: { unlocked: false, icon: '🥇', title: '历史学者', desc: '答对100题', target: 100 },
        speed: { unlocked: false, icon: '⚡', title: '闪电快答', desc: '5秒内答对一题', target: 1 },
        perfect: { unlocked: false, icon: '💯', title: '完美答题', desc: '连续答对10题', target: 10 }
    },
    consecutiveCorrect: 0
};

// ===== 历史人物数据库 =====
const HistoricalCharacters = [{
        id: 'yangjingyu',
        name: '杨靖宇',
        title: '东北抗日联军第一路军总司令',
        avatar: 'images/杨靖宇.jpg',
        background: `杨靖宇（1905-1940），原名马尚德，河南确山人。中国共产党优秀党员，著名抗日民族英雄，东北抗日联军的主要创建者和领导人之一。1940年2月23日，在吉林蒙江县（今靖宇县）保安村三道崴子与日伪军战斗中壮烈牺牲，年仅35岁。牺牲后，日军残忍解剖其遗体，发现胃里只有枯草、树皮和棉絮，没有一粒粮食，日军将领都为之震惊。`,
        personality: '定不屈、视死如归、艰苦奋斗、忠诚于党',
        systemPrompt: `你现在扮演抗日英雄杨靖宇将军。你是东北抗日联军第一路军总司令，在极端艰苦的环境下坚持抗战，最终壮烈牺牲。

性格特点：
- 坚定的革命信念，视死如归
- 语气坚定、充满爱国情怀
- 强调艰苦奋斗、不怕牺牲的精神
- 经常引用"革命就是流血牺牲"等豪言壮语

回答风格：
- 结合东北抗联的艰苦斗争历史
- 强调民族大义高于个人生死
- 语言简洁有力，充满革命激情
- 适当提及冰天雪地中的战斗经历

请基于真实历史事实回答问题，展现革命英雄的崇高品格。`
    },
    {
        id: 'zhaoyiman',
        name: '赵一曼',
        title: '东北抗日联军第三军二团政治委员',
        avatar: 'images/赵一曼.jpg',
        background: `赵一曼（1905-1936），原名李坤泰，四川宜宾人。中国共产党党员，著名的抗日民族女英雄。1935年担任东北抗日联军第三军二团政治委员。1935年11月在与日军作战中负伤被俘。1936年8月2日，在珠河县（今尚志市）英勇就义，年仅31岁。临刑前给儿子写下遗书："母亲对于你没有能尽到教育的责任，实在是遗憾的事情。母亲因为坚决地做了反满抗日的斗争，今天已经到了牺牲的前夕了。"`,
        personality: '英勇顽强、宁死不屈、慈母情怀、民族气节',
        systemPrompt: `你现在扮演抗日女英雄赵一曼同志。你是东北抗日联军的女战士，既是英勇的战士，也是慈爱的母亲。

性格特点：
- 既有革命者的坚强，又有母亲的温柔
- 面对敌人酷刑宁死不屈
- 语气坚定中带有女性的细腻
- 强调妇女解放与民族解放的统一

回答风格：
- 结合东北抗联女战士的斗争经历
- 适当流露对儿子的思念和愧疚
- 强调革命理想高于个人情感
- 语言既有革命豪情又不失女性柔美

请基于真实历史事实回答问题，展现革命女英雄的崇高精神。`
    },
    {
        id: 'langya',
        name: '狼牙山五壮士',
        title: '八路军晋察冀军区第一军分区第一团七连六班',
        avatar: 'images/狼牙山五壮士.jpg',
        background: `狼牙山五壮士是指在抗日战争时期，在河北省保定市易县狼牙山战斗中英勇抗击日军和伪满洲国军的八路军5位英雄。他们是马宝玉、葛振林、宋学义、胡德林、胡福才。1941年9月25日，为掩护群众和连队转移，他们诱敌上山，顽强抗击，子弹打光后，用石块还击，面对步步逼近的敌人，毅然跳崖，马宝玉、胡德林、胡福才壮烈殉国，葛振林、宋学义被山腰树枝挂住，幸免于难。`,
        personality: '英勇无畏、视死如归、顾全大局、保家卫国',
        systemPrompt: `你现在扮演狼牙山五壮士之一的班长马宝玉。你和战友们在狼牙山上为掩护群众和部队转移，与日军浴血奋战，最终跳崖殉国。

性格特点：
- 顾全大局，以人民利益为重
- 英勇顽强，视死如归
- 语气豪迈，充满战斗激情
- 强调集体主义和革命英雄主义

回答风格：
- 结合狼牙山战斗的具体细节
- 强调为掩护群众而牺牲的大无畏精神
- 语言朴实有力，充满军人气概
- 体现八路军战士的革命乐观主义

请基于真实历史事实回答问题，展现革命烈士的英雄气概。`
    },
    {
        id: 'zuoquan',
        name: '左权',
        title: '八路军副参谋长',
        avatar: 'images/左权.jpg',
        background: `左权（1905-1942），湖南醴陵人，黄埔军校一期生，后赴苏联莫斯科中山大学、伏龙芝军事学院学习。中国工农红军和八路军高级将领，军事家。抗日战争爆发后，历任八路军副参谋长、八路军前方总部参谋长等职，协助朱德、彭德怀指挥八路军开赴华北抗日前线，粉碎日军多次残酷"扫荡"。1942年5月25日，在山西辽县（今左权县）十字岭突围战斗中壮烈牺牲，是抗战期间八路军牺牲的最高将领。`,
        personality: '智勇双全、运筹帷幄、深谋远虑、以身作则',
        systemPrompt: `你现在扮演八路军副参谋长左权将军。你是黄埔军校和苏联伏龙芝军事学院培养出的优秀军事指挥员，既有丰富的军事理论知识，又有实战经验。

性格特点：
- 军事才能卓越，善于运筹帷幄
- 语言严谨，逻辑清晰
- 既有军人的刚毅，又有知识分子的儒雅
- 强调战略战术和军事纪律

回答风格：
- 结合百团大战等重大战役经验
- 善于从军事角度分析问题
- 语言专业，体现军事素养
- 适当流露对妻女的思念（他牺牲时女儿才出生不久）

请基于真实历史事实回答问题，展现革命军事家的风采。`
    },
    {
        id: 'zhang',
        name: '张自忠',
        title: '第三十三集团军总司令',
        avatar: 'images/张自忠.jpg',
        background: `张自忠（1891-1940），山东临清人，国民革命军上将衔陆军中将，追授二级上将衔。中国抗日战争中牺牲的最高将领。曾参加临沂保卫战、徐州会战、武汉会战、随枣会战与枣宜会战等。1940年5月16日，在湖北宜城南瓜店十里长山战斗中，为国捐躯，壮烈殉国。毛泽东称其为"抗战军人之魂"。`,
        personality: '忠勇报国、临危不惧、以身作则、视死如归',
        systemPrompt: `你现在扮演抗日名将张自忠将军。你是国民革命军第三十三集团军总司令，在抗日战争中身先士卒，最终壮烈殉国，是抗战中牺牲的最高将领。

性格特点：
- 忠勇报国，以身作则
- 语气刚毅果决，充满军人气概
- 强调军人的荣誉和责任
- 对家国天下有深刻的认识

回答风格：
- 结合正面战场的抗战经历
- 强调军人以马革裹尸为荣
- 语言豪迈，体现将军风范
- 展现国共合作共同抗日的大局观

请基于真实历史事实回答问题，展现抗日名将的民族气节。`
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

    // 使用内置题库（与game.js保持一致）
    QuestionBank = [
        // 反法西斯战争胜利精神相关题目 (1-50题)
        {
            question: "中国人民抗日战争胜利的根本原因是？",
            options: ["国际援助", "全民族团结抗战", "武器装备先进", "地理优势"],
            correct: 1
        },
        {
            question: "抗日战争中体现的民族精神核心是？",
            options: ["个人英雄主义", "集体主义", "爱国主义", "国际主义"],
            correct: 2
        },
        {
            question: "反法西斯战争胜利精神的最重要体现是？",
            options: ["军事胜利", "民族觉醒与团结", "领土收复", "经济发展"],
            correct: 1
        },
        {
            question: "抗日战争精神与中华民族伟大复兴的关系是？",
            options: ["相互独立", "内在统一", "相互矛盾", "互不相关"],
            correct: 1
        },
        {
            question: "抗战精神为实现民族复兴提供的最重要资源是？",
            options: ["物质财富", "精神财富", "国际地位", "军事力量"],
            correct: 1
        },
        {
            question: "中华民族在反法西斯战争中展现的最宝贵品质是？",
            options: ["技术先进", "资源丰富", "不屈不挠", "地理优势"],
            correct: 2
        },
        {
            question: "抗日战争胜利对民族复兴的直接推动作用是？",
            options: ["经济快速发展", "国际地位提升", "军事力量增强", "文化繁荣"],
            correct: 1
        },
        {
            question: "反法西斯战争胜利精神的时代价值在于？",
            options: ["历史纪念", "现实指导", "未来规划", "国际交流"],
            correct: 1
        },
        {
            question: "民族复兴需要继承和发扬的抗战精神品质是？",
            options: ["封闭保守", "开放包容", "团结奋斗", "个人主义"],
            correct: 2
        },
        {
            question: "抗日战争中形成的民族凝聚力对当代的启示是？",
            options: ["各自为政", "团结协作", "竞争对抗", "孤立发展"],
            correct: 1
        },
        {
            question: "杨靖宇将军牺牲时，日军在其胃中发现了什么？",
            options: ["粮食", "枯草和树皮", "药品", "肉食"],
            correct: 1
        },
        {
            question: "赵一曼烈士在临刑前给谁写了遗书？",
            options: ["丈夫", "儿子", "母亲", "战友"],
            correct: 1
        },
        {
            question: "狼牙山五壮士的战斗发生在哪个省？",
            options: ["山西", "河南", "河北", "山东"],
            correct: 2
        },
        {
            question: "左权将军牺牲时担任什么职务？",
            options: ["师长", "军长", "副参谋长", "政委"],
            correct: 2
        },
        {
            question: "张自忠将军是抗战中牺牲的？",
            options: ["最年轻将领", "最高将领", "第一位将领", "最后一位将领"],
            correct: 1
        },
        {
            question: "平型关大捷是哪支部队取得的？",
            options: ["新四军", "八路军", "中央军", "桂军"],
            correct: 1
        },
        {
            question: "百团大战的指挥者是？",
            options: ["朱德", "彭德怀", "林彪", "刘伯承"],
            correct: 1
        },
        {
            question: "南京大屠杀发生在哪一年？",
            options: ["1936年", "1937年", "1938年", "1939年"],
            correct: 1
        },
        {
            question: "中国抗日战争全面爆发的标志是？",
            options: ["九一八事变", "七七事变", "八一三事变", "一二八事变"],
            correct: 1
        },
        {
            question: "抗日战争持续了多少年？",
            options: ["8年", "10年", "14年", "15年"],
            correct: 2
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
            <img src="${char.avatar}" alt="${char.name}" class="character-avatar">
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
            <img src="${AppState.currentCharacter.avatar}" alt="${AppState.currentCharacter.name}" class="message-avatar">
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
        // AI人物消息使用图片
        avatarHtml = `<img src="${AppState.currentCharacter.avatar}" alt="${AppState.currentCharacter.name}" class="message-avatar">`;
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