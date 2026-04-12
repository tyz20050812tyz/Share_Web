// 游戏主逻辑
class ShootingGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.crosshair = document.getElementById('crosshair');

        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 游戏状态
        this.score = 0;
        this.health = 100;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.gameRunning = false;
        this.gamePaused = false;
        this.animationId = null;

        // 难度设置
        this.difficulty = 'normal'; // 'easy', 'normal', 'hard'
        this.difficultyMultiplier = 1.5;
        this.difficultySettings = {
            easy: {
                enemySpeed: 0.15,
                spawnRate: 3500,
                scoreMultiplier: 1,
                maxEnemies: 2
            },
            normal: {
                enemySpeed: 0.3,
                spawnRate: 2500,
                scoreMultiplier: 1.5,
                maxEnemies: 3
            },
            hard: {
                enemySpeed: 0.5,
                spawnRate: 1500,
                scoreMultiplier: 2,
                maxEnemies: 5
            }
        };

        // 目标生成配置
        this.enemySpawnRate = 2500; // 初始生成间隔
        this.lastSpawnTime = 0;
        this.maxEnemies = 3;

        // 游戏统计数据
        this.gamesPlayed = this.loadGameStats().gamesPlayed || 0;
        this.totalScore = this.loadGameStats().totalScore || 0;

        // 连杀系统
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeout = 3000; // 3秒内没有击杀，连杀重置
        this.lastComboLevel = 0;

        // 历史名言库
        this.historicalQuotes = [
            "实事求是，群众路线，独立自主！",
            "没有调查，就没有发言权！",
            "为人民服务！",
            "星星之火，可以燎原！",
            "枪杆子里出政权！",
            "一切反动派都是纸老虎！",
            "自己动手，丰衣足食！",
            "理论联系实际，密切联系群众！",
            "惩前毖后，治病救人！",
            "谦虚谨慎，戒骄戒躁！"
        ];

        // 成就系统
        this.achievements = {
            firstKill: { unlocked: false, title: "首杀建功", desc: "击杀第一个目标", icon: "🎯" },
            score50: { unlocked: false, title: "学习标兵", desc: "达到50分", icon: "🎖️" },
            score100: { unlocked: false, title: "理论先锋", desc: "达到100分", icon: "🏅" },
            score200: { unlocked: false, title: "思想巨人", desc: "达到200分", icon: "⭐" },
            combo3: { unlocked: false, title: "精准射击", desc: "连杀3次", icon: "🎯" },
            combo5: { unlocked: false, title: "百步穿杨", desc: "连杀5次", icon: "🏹" },
            combo10: { unlocked: false, title: "神枪手", desc: "连杀10次", icon: "🔫" },
            survive3min: { unlocked: false, title: "坚守阵地", desc: "存活3分钟", icon: "🛡️" },
            survive5min: { unlocked: false, title: "钢铁意志", desc: "存活5分钟", icon: "🏰" },
            perfectDefense: { unlocked: false, title: "完美防守", desc: "零失误击杀20个目标", icon: "💎" },
            eventSurvivor: { unlocked: false, title: "历史见证者", desc: "完成一次历史事件", icon: "📜" }
        };
        this.perfectKills = 0; // 零失误击杀计数
        this.surviveTime = 0; // 存活时间

        // 历史事件系统
        this.eventActive = false;
        this.eventTimer = 0;
        this.eventDuration = 0;
        this.nextEventTime = 60000; // 60秒后第一次事件
        this.eventTimeSinceStart = 0;
        this.events = [{
                name: "整风运动",
                desc: "大量目标来袭！限时清除！",
                duration: 20000,
                effect: () => {
                    this.maxEnemies = 8;
                    this.enemySpawnRate = 1000;
                }
            },
            {
                name: "夜战训练",
                desc: "夜幕降临，视野受限！",
                duration: 15000,
                effect: () => {
                    this.nightMode = true;
                }
            },
            {
                name: "理论攻坚",
                desc: "目标加速出现！提高警惕！",
                duration: 18000,
                effect: () => {
                    this.enemies.forEach(e => e.speed *= 1.5);
                }
            }
        ];
        this.nightMode = false;

        // 目标图像（预留，可以设置图像路径）
        this.enemyImage = "./images/enemy.png";
        this.loadEnemyImage(); // 尝试加载目标图像

        // 音频系统
        this.sounds = {
            bgm: null, // 当前播放的背景音乐
            shoot: null, // 射击音效
            hit: null, // 击中音效
            explosion: null, // 爆炸音效
            damage: null, // 受伤音效
            achievement: null, // 成就解锁音效
            combo: null, // 连杀音效
            gameOver: null, // 游戏结束音效
            buttonClick: null // 按钮点击音效
        };

        // 背景音乐播放列表
        this.bgmPlaylist = [
            './歌曲/1家园不再.mp3',
            './歌曲/2黄河在呐喊.mp3',
            './歌曲/3星星之火.mp3',
            './歌曲/4长城下的誓言.mp3',
            './歌曲/5向着光辉的彼岸.mp3',
            './歌曲/6百年回响.mp3'
        ];
        this.bgmTitles = [
            '家园不再',
            '黄河在呐喊',
            '星星之火',
            '长城下的誓言',
            '向着光辉的彼岸',
            '百年回响'
        ];
        this.currentBgmIndex = 0; // 当前播放的音乐索引

        this.soundEnabled = true; // 音效开关
        this.musicEnabled = true; // 音乐开关
        this.initAudio(); // 初始化音频

        // 题库
        this.quizQuestions = [
            // 七大历史知识 (1-5题)
            {
                question: "中共七大于哪一年在哪里召开？",
                options: ["1945年，延安", "1945年，西柏坡", "1949年，延安", "1942年，延安"],
                correct: 0
            },
            {
                question: "七大的政治报告题目是什么？",
                options: ["《论持久战》", "《论联合政府》", "《新民主主义论》", "《论人民民主专政》"],
                correct: 1
            },
            {
                question: "七大党章的最大贡献是什么？",
                options: ["确立马克思列宁主义为指导思想", "确立毛泽东思想为指导思想", "确立邓小平理论为指导思想", "确立三个代表重要思想为指导思想"],
                correct: 1
            },
            {
                question: "谁在七大上作了关于修改党章的报告？",
                options: ["毛泽东", "周恩来", "刘少奇", "朱德"],
                correct: 2
            },
            {
                question: "七大确定的党的政治路线核心内容是什么？",
                options: ["打倒日本帝国主义，建立新中国", "放手发动群众，壮大人民力量", "解放全中国，实现共产主义", "建立统一战线，团结一切力量"],
                correct: 1
            },

            // 新民主主义革命理论 (6-10题)
            {
                question: "新民主主义革命的领导力量是谁？",
                options: ["资产阶级", "农民阶级", "无产阶级", "小资产阶级"],
                correct: 2
            },
            {
                question: "新民主主义革命的对象是什么？",
                options: ["帝国主义、封建主义、资本主义", "帝国主义、封建主义、官僚资本主义", "帝国主义、资本主义、封建主义", "封建主义、资本主义、帝国主义"],
                correct: 1
            },
            {
                question: "《新民主主义论》发表于哪一年？",
                options: ["1938年", "1940年", "1942年", "1945年"],
                correct: 1
            },
            {
                question: "新民主主义革命的性质是什么？",
                options: ["无产阶级社会主义革命", "资产阶级民主革命", "农民阶级革命", "新式的资产阶级民主革命"],
                correct: 3
            },
            {
                question: "中国革命的道路是什么？",
                options: ["城市中心论", "农村包围城市，武装夺取政权", "和平议会道路", "工人武装起义"],
                correct: 1
            },

            // 三大法宝与三大作风 (11-14题)
            {
                question: "三大法宝是指什么？",
                options: ["土地革命、武装斗争、根据地建设", "统一战线、武装斗争、党的建设", "群众路线、实事求是、独立自主", "理论联系实际、密切联系群众、批评与自我批评"],
                correct: 1
            },
            {
                question: "三大作风是什么？",
                options: ["统一战线、武装斗争、党的建设", "理论联系实际、密切联系群众、批评与自我批评", "实事求是、群众路线、独立自主", "解放思想、实事求是、与时俱进"],
                correct: 1
            },
            {
                question: "毛泽东在哪篇文章中提出三大法宝？",
                options: ["《〈共产党人〉发刊词》", "《论联合政府》", "《新民主主义论》", "《论持久战》"],
                correct: 0
            },
            {
                question: "党的建设的核心是什么？",
                options: ["组织建设", "作风建设", "思想建设", "制度建设"],
                correct: 2
            },

            // 马克思主义中国化历程 (15-18题)
            {
                question: "马克思主义中国化的第一次历史性飞跃的理论成果是什么？",
                options: ["邓小平理论", "毛泽东思想", "三个代表重要思想", "科学发展观"],
                correct: 1
            },
            {
                question: "最早提出'马克思主义中国化'命题的是谁？",
                options: ["李大钊", "陈独秀", "毛泽东", "周恩来"],
                correct: 2
            },
            {
                question: "毛泽东思想活的灵魂的三个方面是什么？",
                options: ["统一战线、武装斗争、党的建设", "实事求是、群众路线、独立自主", "理论联系实际、密切联系群众、批评与自我批评", "解放思想、实事求是、与时俱进"],
                correct: 1
            },
            {
                question: "实事求是的思想路线是在什么运动中确立的？",
                options: ["五四运动", "延安整风运动", "土地革命", "抗日战争"],
                correct: 1
            },

            // 延安整风运动 (19-22题)
            {
                question: "延安整风运动开始于哪一年？",
                options: ["1940年", "1941年", "1942年", "1945年"],
                correct: 2
            },
            {
                question: "整风运动主要反对哪三种不良作风？",
                options: ["官僚主义、宗派主义、党八股", "主观主义、宗派主义、党八股", "形式主义、官僚主义、享乐主义", "教条主义、经验主义、宗派主义"],
                correct: 1
            },
            {
                question: "整风运动的方针是什么？",
                options: ["惩前毖后、治病救人", "批评与自我批评", "团结-批评-团结", "有则改之、无则加勉"],
                correct: 0
            },
            {
                question: "整风运动学习的主要文件包括哪些？",
                options: ["《改造我们的学习》《整顿党的作风》《反对党八股》", "《论持久战》《论联合政府》《新民主主义论》", "《实践论》《矛盾论》《论十大关系》", "《为人民服务》《纪念白求恩》《愚公移山》"],
                correct: 0
            },

            // 毛泽东重要著作 (23-30题)
            {
                question: "《论持久战》发表于哪一年？",
                options: ["1936年", "1937年", "1938年", "1940年"],
                correct: 2
            },
            {
                question: "《矛盾论》的核心思想是什么？",
                options: ["质量互变规律", "对立统一规律", "否定之否定规律", "实践是认识的基础"],
                correct: 1
            },
            {
                question: "《实践论》的主要观点是什么？",
                options: ["矛盾是事物发展的动力", "实践是认识的基础", "人民群众是历史的创造者", "统一战线的重要性"],
                correct: 1
            },
            {
                question: "《论人民民主专政》发表于哪一年？",
                options: ["1945年", "1947年", "1949年", "1950年"],
                correct: 2
            },
            {
                question: "《星星之火，可以燎原》的核心思想是什么？",
                options: ["农村包围城市，武装夺取政权", "建立抗日民族统一战线", "坚持持久战", "建立人民民主专政"],
                correct: 0
            },
            {
                question: "毛泽东在哪篇文章中首次系统阐述新民主主义理论？",
                options: ["《论持久战》", "《新民主主义论》", "《论联合政府》", "《论人民民主专政》"],
                correct: 1
            },
            {
                question: "《改造我们的学习》的主旨是什么？",
                options: ["反对主观主义", "反对宗派主义", "反对党八股", "反对教条主义"],
                correct: 0
            },
            {
                question: "《为人民服务》是在什么场合发表的？",
                options: ["党的七大", "张思德追悼会", "延安文艺座谈会", "瓦窑堡会议"],
                correct: 1
            },

            // 扩展题目 (31-40题)
            {
                question: "毛泽东思想的精髓是什么？",
                options: ["群众路线", "独立自主", "实事求是", "统一战线"],
                correct: 2
            },
            {
                question: "《在延安文艺座谈会上的讲话》发表于哪一年？",
                options: ["1940年", "1942年", "1945年", "1949年"],
                correct: 1
            },
            {
                question: "'没有调查，就没有发言权'出自毛泽东的哪篇文章？",
                options: ["《反对本本主义》", "《实践论》", "《改造我们的学习》", "《整顿党的作风》"],
                correct: 0
            },
            {
                question: "《论十大关系》发表于哪一年？",
                options: ["1949年", "1953年", "1956年", "1957年"],
                correct: 2
            },
            {
                question: "'枪杆子里出政权'的著名论断是在哪次会议上提出的？",
                options: ["八七会议", "古田会议", "遵义会议", "瓦窑堡会议"],
                correct: 0
            },
            {
                question: "《湖南农民运动考察报告》发表于哪一年？",
                options: ["1925年", "1926年", "1927年", "1928年"],
                correct: 2
            },
            {
                question: "'工农武装割据'思想的核心内容是什么？",
                options: ["土地革命、武装斗争、根据地建设", "统一战线、武装斗争、党的建设", "农村包围城市、武装夺取政权", "群众路线、实事求是、独立自主"],
                correct: 0
            },
            {
                question: "《关于正确处理人民内部矛盾的问题》发表于哪一年？",
                options: ["1956年", "1957年", "1958年", "1960年"],
                correct: 1
            },
            {
                question: "'两个务必'是在哪次会议上提出的？",
                options: ["党的七大", "七届二中全会", "党的八大", "十一届三中全会"],
                correct: 1
            },
            {
                question: "《纪念白求恩》一文赞扬了白求恩的什么精神？",
                options: ["爱国主义精神", "国际主义精神和共产主义精神", "革命英雄主义精神", "集体主义精神"],
                correct: 1
            }
        ];

        this.setupEventListeners();
        this.loadRankings();
    }

    // 加载游戏统计数据
    loadGameStats() {
        const stats = localStorage.getItem('gameStats');
        return stats ? JSON.parse(stats) : { gamesPlayed: 0, totalScore: 0 };
    }

    // 保存游戏统计数据
    saveGameStats() {
        const stats = {
            gamesPlayed: this.gamesPlayed,
            totalScore: this.totalScore
        };
        localStorage.setItem('gameStats', JSON.stringify(stats));
    }

    // 加载排行榜数据
    loadRankings() {
        const rankings = localStorage.getItem('gameRankings');
        return rankings ? JSON.parse(rankings) : [];
    }

    // 保存排行榜数据
    saveRankings(rankings) {
        localStorage.setItem('gameRankings', JSON.stringify(rankings));
    }

    // 更新排行榜
    updateRankings() {
        const currentUser = localStorage.getItem('login_user') || '游客';
        const rankings = this.loadRankings();

        // 添加新记录
        rankings.push({
            name: currentUser,
            score: this.score,
            difficulty: this.difficulty,
            timestamp: new Date().toISOString()
        });

        // 按分数降序排序
        rankings.sort((a, b) => b.score - a.score);

        // 只保留前10名
        const top10 = rankings.slice(0, 10);
        this.saveRankings(top10);

        return top10;
    }

    // 显示排行榜
    showRankings() {
        const panel = document.getElementById('rankings-panel');
        const list = document.getElementById('rankings-list');
        const rankings = this.loadRankings();
        const currentUser = localStorage.getItem('login_user') || '游客';

        list.innerHTML = '';

        if (rankings.length === 0) {
            list.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">暂无排行榜数据</p>';
        } else {
            rankings.forEach((record, index) => {
                const item = document.createElement('div');
                const isCurrentPlayer = record.name === currentUser;
                let rankClass = 'ranking-item';

                if (index === 0) rankClass += ' rank-1';
                else if (index === 1) rankClass += ' rank-2';
                else if (index === 2) rankClass += ' rank-3';
                if (isCurrentPlayer) rankClass += ' current-player';

                item.className = rankClass;

                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const difficultyBadge = record.difficulty === 'easy' ? '简单' : record.difficulty === 'normal' ? '普通' : '困难';

                item.innerHTML = `
                    <div class="rank">${rankIcon}</div>
                    <div class="player-info">
                        <div class="player-name">${record.name}${isCurrentPlayer ? ' (你)' : ''}</div>
                        <div class="player-score">${record.score} 分<span class="difficulty-badge">${difficultyBadge}</span></div>
                    </div>
                `;

                list.appendChild(item);
            });
        }

        panel.style.display = 'block';
    }

    // 设置难度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        const settings = this.difficultySettings[difficulty];
        this.enemySpawnRate = settings.spawnRate;
        this.maxEnemies = settings.maxEnemies;
        this.difficultyMultiplier = settings.scoreMultiplier;
    }

    // 暂停/恢复游戏
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseMenu = document.getElementById('pause-menu');

        if (this.gamePaused) {
            pauseMenu.style.display = 'flex';
        } else {
            pauseMenu.style.display = 'none';
        }
    }

    // 恢复游戏
    resumeGame() {
        this.gamePaused = false;
        document.getElementById('pause-menu').style.display = 'none';
    }

    // 重新开始游戏
    restartGame() {
        this.gamePaused = false;
        document.getElementById('pause-menu').style.display = 'none';
        this.gameRunning = false;
        cancelAnimationFrame(this.animationId);
        this.stopBGM();

        // 显示难度选择界面
        document.getElementById('difficulty-screen').style.display = 'flex';
    }

    loadEnemyImage() {
        // 如果有目标图像路径，加载图像
        // 用户可以将图像文件放在项目根目录，例如 'enemy.png'
        const imagePath = './images/enemy.png'; // 可以修改为实际的图像路径

        const img = new Image();
        img.onload = () => {
            this.enemyImage = img;
            console.log('目标图像加载成功');
        };
        img.onerror = () => {
            console.log('未找到目标图像，使用默认绘制方式');
            this.enemyImage = null;
        };
        img.src = imagePath;
    }

    // 初始化音频系统
    initAudio() {
        // 创建背景音乐（从播放列表中加载第一首）
        this.loadBGM(0);

        // 加载真实音效文件
        this.sounds.shoot = new Audio('./audio/射击.mp3');
        this.sounds.shoot.volume = 0.5; // 射击音量50%

        this.sounds.explosion = new Audio('./audio/爆炸.mp3');
        this.sounds.explosion.volume = 0.6; // 爆炸音量60%

        this.sounds.damage = new Audio('./audio/受伤.mp3');
        this.sounds.damage.volume = 0.5; // 受伤音量50%

        this.sounds.achievement = new Audio('./audio/成就.mp3');
        this.sounds.achievement.volume = 0.6; // 成就音量60%

        // 使用 Web Audio API 生成其他音效（击中、连杀、按钮等）
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioContext = new AudioContext();
        }

        console.log('音频系统初始化完成 - 已加载4个真实音效文件 + ' + this.bgmPlaylist.length + '首背景音乐');
    }

    // 加载指定索引的背景音乐
    loadBGM(index) {
        // 停止当前音乐
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.removeEventListener('ended', this.handleBGMEnded);
        }

        // 加载新音乐
        this.currentBgmIndex = index % this.bgmPlaylist.length;
        this.sounds.bgm = new Audio(this.bgmPlaylist[this.currentBgmIndex]);
        this.sounds.bgm.volume = 0.3; // 背景音乐音量30%

        // 监听音乐播放结束事件，自动切换下一首
        this.handleBGMEnded = () => {
            this.playNextBGM();
        };
        this.sounds.bgm.addEventListener('ended', this.handleBGMEnded);
    }

    // 播放下一首背景音乐
    playNextBGM() {
        const nextIndex = (this.currentBgmIndex + 1) % this.bgmPlaylist.length;
        this.loadBGM(nextIndex);
        if (this.musicEnabled && this.gameRunning) {
            this.playBGM();
        }
    }

    // 更新音乐信息显示
    updateMusicInfo() {
        const musicInfo = document.getElementById('music-info');
        const musicTitle = document.getElementById('current-music-title');
        const musicCounter = document.getElementById('music-counter');

        if (musicTitle && musicCounter) {
            musicTitle.textContent = this.bgmTitles[this.currentBgmIndex];
            musicCounter.textContent = `${this.currentBgmIndex + 1}/${this.bgmPlaylist.length}`;
        }

        // 显示音乐信息3秒后淡出
        if (musicInfo) {
            musicInfo.classList.add('show');
            setTimeout(() => {
                musicInfo.classList.remove('show');
            }, 3000);
        }
    }

    // 播放音效
    playSound(type, frequency = 440, duration = 0.1) {
        if (!this.soundEnabled) return;

        // 使用真实音效文件播放
        if (type === 'shoot' && this.sounds.shoot) {
            // 克隆音频对象以支持快速连续播放
            const shootSound = this.sounds.shoot.cloneNode();
            shootSound.volume = 0.5;
            shootSound.play().catch(e => {
                console.log('射击音效播放失败：', e.message);
            });
            return;
        }

        if (type === 'explosion' && this.sounds.explosion) {
            const explosionSound = this.sounds.explosion.cloneNode();
            explosionSound.volume = 0.6;
            explosionSound.play().catch(e => {
                console.log('爆炸音效播放失败：', e.message);
            });
            return;
        }

        if (type === 'damage' && this.sounds.damage) {
            const damageSound = this.sounds.damage.cloneNode();
            damageSound.volume = 0.5;
            damageSound.play().catch(e => {
                console.log('受伤音效播放失败：', e.message);
            });
            return;
        }

        if (type === 'achievement' && this.sounds.achievement) {
            const achievementSound = this.sounds.achievement.cloneNode();
            achievementSound.volume = 0.6;
            achievementSound.play().catch(e => {
                console.log('成就音效播放失败：', e.message);
            });
            return;
        }

        // 其他音效使用 Web Audio API 生成（击中、连杀、按钮等）
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;

        switch (type) {
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(600, now);
                oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'combo':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, now);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;

            case 'button':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(660, now);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
        }
    }

    // 播放背景音乐
    playBGM() {
        if (this.musicEnabled && this.sounds.bgm) {
            this.sounds.bgm.play().catch(e => {
                console.log('背景音乐播放失败：', e.message);
            });
        }
    }

    // 停止背景音乐
    stopBGM() {
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        }
    }

    // 切换音效开关
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    // 切换音乐开关
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playBGM();
        } else {
            this.stopBGM();
        }
        return this.musicEnabled;
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // 鼠标移动 - 更新准星位置
        document.addEventListener('mousemove', (e) => {
            this.crosshair.style.left = e.clientX + 'px';
            this.crosshair.style.top = e.clientY + 'px';
        });

        // 鼠标点击 - 射击
        this.canvas.addEventListener('click', (e) => {
            if (this.gameRunning && !this.gamePaused) {
                this.shoot(e.clientX, e.clientY);
            }
        });

        // ESC键暂停
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameRunning) {
                this.togglePause();
            }
        });

        // 难度选择
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            option.addEventListener('click', () => {
                const difficulty = option.getAttribute('data-difficulty');
                this.setDifficulty(difficulty);
                document.getElementById('difficulty-screen').style.display = 'none';
                this.startGame();
            });
        });

        // 暂停菜单按钮
        document.getElementById('resume-button').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('exit-button').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // 暂停按钮
        document.getElementById('pause-button').addEventListener('click', () => {
            if (this.gameRunning) {
                this.togglePause();
            }
        });

        // 排行榜按钮
        document.getElementById('rankings-button').addEventListener('click', () => {
            this.playSound('button');
            this.showRankings();
        });

        document.getElementById('close-rankings').addEventListener('click', () => {
            this.playSound('button');
            document.getElementById('rankings-panel').style.display = 'none';
        });

        // 开始按钮 - 显示难度选择
        document.getElementById('start-button').addEventListener('click', () => {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('difficulty-screen').style.display = 'flex';
        });

        // 成就按钮
        document.getElementById('achievements-button').addEventListener('click', () => {
            this.playSound('button');
            this.showAchievementsPanel();
        });

        document.getElementById('close-achievements').addEventListener('click', () => {
            this.playSound('button');
            document.getElementById('achievements-panel').style.display = 'none';
        });

        // 音效开关按钮
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const enabled = this.toggleSound();
                soundToggle.textContent = enabled ? '🔊 音效' : '🔇 音效';
                soundToggle.style.opacity = enabled ? '1' : '0.5';
            });
        }

        // 音乐开关按钮
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                const enabled = this.toggleMusic();
                musicToggle.textContent = enabled ? '🎵 音乐' : '🔇 音乐';
                musicToggle.style.opacity = enabled ? '1' : '0.5';
            });
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.health = 100;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.comboCount = 0;
        this.comboTimer = 0;
        this.perfectKills = 0;
        this.surviveTime = 0;
        this.eventTimeSinceStart = 0;
        this.nightMode = false;
        this.updateUI();
        this.updateComboDisplay();
        this.renderAchievementsList();
        this.gamesPlayed++;
        this.saveGameStats();

        // 播放背景音乐
        this.playBGM();
        // 播放按钮音效
        this.playSound('button');

        this.gameLoop();
    }

    shoot(x, y) {
        // 播放射击音效
        this.playSound('shoot');

        // 检查是否击中目标
        let hit = false;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.size) {
                // 击中目标
                const baseScore = 10;
                this.score += Math.floor(baseScore * this.difficultyMultiplier);
                this.totalScore += Math.floor(baseScore * this.difficultyMultiplier);
                this.comboCount++;
                this.comboTimer = 0;
                this.perfectKills++;

                // 播放击中和爆炸音效
                this.playSound('hit');
                this.playSound('explosion');

                this.updateUI();
                this.createExplosion(enemy.x, enemy.y);
                this.enemies.splice(i, 1);
                hit = true;

                // 检查连杀奖励
                this.checkComboReward();

                // 检查成就
                this.checkAchievements();

                // 显示历史名言
                if (Math.random() < 0.3) { // 30%概率显示
                    this.showQuote();
                }

                break;
            }
        }

        // 创建子弹效果
        this.createBullet(x, y, hit);
    }

    createBullet(x, y, hit) {
        this.bullets.push({
            x: x,
            y: y,
            alpha: 1,
            hit: hit
        });
    }

    createExplosion(x, y) {
        // 创建爆炸粒子效果
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                alpha: 1,
                size: Math.random() * 5 + 2,
                color: ['#ff4444', '#ff8844', '#ffaa44'][Math.floor(Math.random() * 3)]
            });
        }
    }

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        const side = Math.floor(Math.random() * 4); // 0=上 1=右 2=下 3=左
        let x, y;

        switch (side) {
            case 0: // 上
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // 右
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // 下
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // 左
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }

        // 设置随机目标点，而不是固定的屏幕中心
        const randomTargetX = this.canvas.width * (0.3 + Math.random() * 0.4);
        const randomTargetY = this.canvas.height * (0.3 + Math.random() * 0.4);

        // 根据难度设置目标速度
        const settings = this.difficultySettings[this.difficulty];
        const baseSpeed = settings.enemySpeed;

        this.enemies.push({
            x: x,
            y: y,
            targetX: randomTargetX,
            targetY: randomTargetY,
            size: 30,
            speed: baseSpeed * (0.8 + Math.random() * 0.4), // 添加一些随机性
            attackTimer: 0,
            attackInterval: 3000, // 每3秒攻击一次
            hasReachedTarget: false, // 是否已到达目标位置
            stopTimer: 0, // 停止后的计时器
            canAttack: false // 是否可以攻击
        });
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // 移动向目标点
            const dx = enemy.targetX - enemy.x;
            const dy = enemy.targetY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 只有在距离目标点较远时才移动，到达后停止
            if (distance > 5) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
                enemy.hasReachedTarget = false;
            } else {
                // 到达目标位置
                if (!enemy.hasReachedTarget) {
                    enemy.hasReachedTarget = true;
                    enemy.stopTimer = 0;
                    enemy.canAttack = false;
                }

                // 停止后开始计时
                if (!enemy.canAttack) {
                    enemy.stopTimer += deltaTime;
                    if (enemy.stopTimer >= 3000) { // 停止3秒后可以攻击
                        enemy.canAttack = true;
                        enemy.attackTimer = 0;
                    }
                }
            }

            // 攻击逻辑 - 只有可以攻击时才执行
            if (enemy.canAttack) {
                enemy.attackTimer += deltaTime;
                if (enemy.attackTimer >= enemy.attackInterval) {
                    this.enemyAttack();
                    enemy.attackTimer = 0;
                }
            }
        }
    }

    enemyAttack() {
        if (!this.gameRunning) return;

        this.health -= 10;
        this.updateUI();

        // 播放受伤音效
        this.playSound('damage');

        // 屏幕闪红效果
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.health <= 0) {
            this.health = 0;
            this.updateUI();
            this.showQuiz();
        }
    }

    showQuiz() {
        this.gameRunning = false;
        const modal = document.getElementById('quiz-modal');
        const questionEl = document.getElementById('quiz-question');
        const optionsEl = document.getElementById('quiz-options');

        // 随机选择一个问题
        const quiz = this.quizQuestions[Math.floor(Math.random() * this.quizQuestions.length)];

        questionEl.textContent = quiz.question;
        optionsEl.innerHTML = '';

        quiz.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'quiz-option';
            button.textContent = option;
            button.onclick = () => this.checkAnswer(index, quiz.correct);
            optionsEl.appendChild(button);
        });

        modal.style.display = 'block';
    }

    checkAnswer(selected, correct) {
        const modal = document.getElementById('quiz-modal');

        if (selected === correct) {
            // 答对了，恢复生命值
            this.health = 100;
            this.updateUI();
            modal.style.display = 'none';
            this.gameRunning = true;
            alert('回答正确！生命值已恢复！');
        } else {
            // 答错了，游戏结束
            modal.style.display = 'none';
            this.gameOver();
        }
    }

    gameOver() {
        this.gameRunning = false;
        cancelAnimationFrame(this.animationId);

        // 停止背景音乐
        this.stopBGM();

        // 更新排行榜
        this.updateRankings();
        this.saveGameStats();

        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScore = document.getElementById('final-score');

        finalScore.textContent = `最终得分: ${this.score} (难度: ${this.difficulty === 'easy' ? '简单' : this.difficulty === 'normal' ? '普通' : '困难'})`;
        gameOverScreen.style.display = 'flex';
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.health;
    }

    updateComboDisplay() {
        const comboCounter = document.getElementById('combo-counter');
        const comboCount = document.getElementById('combo-count');

        if (this.comboCount > 0) {
            comboCounter.style.display = 'block';
            comboCount.textContent = this.comboCount;
        } else {
            comboCounter.style.display = 'none';
        }
    }

    checkComboReward() {
        let comboMessage = '';
        let bonusScore = 0;

        if (this.comboCount === 3) {
            comboMessage = '🎯 精准射击！';
            bonusScore = 5;
            this.playSound('combo');
        } else if (this.comboCount === 5) {
            comboMessage = '🏹 百步穿杨！';
            bonusScore = 10;
            this.playSound('combo');
        } else if (this.comboCount === 10) {
            comboMessage = '🔫 神枪手！全屏清敌！';
            bonusScore = 20;
            this.playSound('combo');
            // 全屏清除目标
            this.enemies.forEach(enemy => {
                this.createExplosion(enemy.x, enemy.y);
                this.playSound('explosion');
            });
            this.enemies = [];
        } else if (this.comboCount === 15) {
            comboMessage = '⭐ 无双战神！';
            bonusScore = 30;
            this.playSound('combo');
        } else if (this.comboCount === 20) {
            comboMessage = '🏆 思想巨匠！';
            bonusScore = 50;
            this.playSound('combo');
        }

        if (comboMessage) {
            this.score += bonusScore;
            this.showComboMessage(comboMessage);
            this.updateUI();
        }

        this.updateComboDisplay();
    }

    showComboMessage(message) {
        const comboDisplay = document.getElementById('combo-display');
        comboDisplay.textContent = message;
        comboDisplay.style.animation = 'none';
        setTimeout(() => {
            comboDisplay.style.animation = 'comboFade 2s ease-out';
        }, 10);
    }

    showQuote() {
        const quoteDisplay = document.getElementById('quote-display');
        const randomQuote = this.historicalQuotes[Math.floor(Math.random() * this.historicalQuotes.length)];

        quoteDisplay.textContent = randomQuote;
        quoteDisplay.classList.add('show');

        setTimeout(() => {
            quoteDisplay.classList.remove('show');
        }, 3000);
    }

    checkAchievements() {
        // 首杀
        if (!this.achievements.firstKill.unlocked && this.score >= 10) {
            this.unlockAchievement('firstKill');
        }

        // 分数成就
        if (!this.achievements.score50.unlocked && this.score >= 50) {
            this.unlockAchievement('score50');
        }
        if (!this.achievements.score100.unlocked && this.score >= 100) {
            this.unlockAchievement('score100');
        }
        if (!this.achievements.score200.unlocked && this.score >= 200) {
            this.unlockAchievement('score200');
        }

        // 连杀成就
        if (!this.achievements.combo3.unlocked && this.comboCount >= 3) {
            this.unlockAchievement('combo3');
        }
        if (!this.achievements.combo5.unlocked && this.comboCount >= 5) {
            this.unlockAchievement('combo5');
        }
        if (!this.achievements.combo10.unlocked && this.comboCount >= 10) {
            this.unlockAchievement('combo10');
        }

        // 完美防守
        if (!this.achievements.perfectDefense.unlocked && this.perfectKills >= 20) {
            this.unlockAchievement('perfectDefense');
        }
    }

    unlockAchievement(key) {
        if (this.achievements[key].unlocked) return;

        this.achievements[key].unlocked = true;
        const achievement = this.achievements[key];

        // 播放成就音效
        this.playSound('achievement');

        // 显示成就弹窗
        document.getElementById('achievement-icon').textContent = achievement.icon;
        document.getElementById('achievement-title').textContent = achievement.title;
        document.getElementById('achievement-desc').textContent = achievement.desc;

        const popup = document.getElementById('achievement-popup');
        popup.classList.add('show');

        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000);

        // 更新成就列表
        this.renderAchievementsList();
    }

    showAchievementsPanel() {
        document.getElementById('achievements-panel').style.display = 'block';
    }

    renderAchievementsList() {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';

        for (let key in this.achievements) {
            const ach = this.achievements[key];
            const item = document.createElement('div');
            item.className = 'achievement-item' + (ach.unlocked ? ' unlocked' : '');

            item.innerHTML = `
                <div class="icon">${ach.icon}</div>
                <div class="info">
                    <div class="title">${ach.title}</div>
                    <div class="desc">${ach.desc}${ach.unlocked ? ' - ✅ 已解锁' : ' - ⏳ 未解锁'}</div>
                </div>
            `;

            list.appendChild(item);
        }
    }

    triggerEvent() {
        if (this.eventActive) return;

        const event = this.events[Math.floor(Math.random() * this.events.length)];
        this.eventActive = true;
        this.eventDuration = event.duration;
        this.eventTimer = 0;

        // 显示事件通知
        document.getElementById('event-title').textContent = '🚨 ' + event.name;
        document.getElementById('event-desc').textContent = event.desc;
        const notification = document.getElementById('event-notification');
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);

        // 执行事件效果
        event.effect();
    }

    endEvent() {
        this.eventActive = false;
        this.maxEnemies = 3;
        this.enemySpawnRate = Math.max(800, 3000 - this.score * 5);
        this.nightMode = false;

        // 恢复目标速度
        this.enemies.forEach(e => {
            if (e.speed > 0.5) e.speed = 0.2 + Math.random() * 0.2;
        });

        // 解锁成就
        if (!this.achievements.eventSurvivor.unlocked) {
            this.unlockAchievement('eventSurvivor');
        }

        // 设置下一次事件时间
        this.nextEventTime = this.eventTimeSinceStart + 60000 + Math.random() * 30000;
    }

    update(deltaTime) {
        if (!this.gameRunning || this.gamePaused) return;

        // 更新存活时间
        this.surviveTime += deltaTime;
        this.eventTimeSinceStart += deltaTime;

        // 检查存活成就
        if (!this.achievements.survive3min.unlocked && this.surviveTime >= 180000) {
            this.unlockAchievement('survive3min');
        }
        if (!this.achievements.survive5min.unlocked && this.surviveTime >= 300000) {
            this.unlockAchievement('survive5min');
        }

        // 连杀计时器
        if (this.comboCount > 0) {
            this.comboTimer += deltaTime;
            if (this.comboTimer >= this.comboTimeout) {
                this.comboCount = 0;
                this.updateComboDisplay();
            }
        }

        // 历史事件系统
        if (this.eventActive) {
            this.eventTimer += deltaTime;
            if (this.eventTimer >= this.eventDuration) {
                this.endEvent();
            }
        } else {
            // 检查是否该触发新事件
            if (this.eventTimeSinceStart >= this.nextEventTime) {
                this.triggerEvent();
            }
        }

        // 生成目标
        this.lastSpawnTime += deltaTime;
        if (this.lastSpawnTime >= this.enemySpawnRate) {
            this.spawnEnemy();
            this.lastSpawnTime = 0;

            // 随着时间推进，加快生成速度（除非在事件中）
            if (!this.eventActive && this.enemySpawnRate > 800) {
                this.enemySpawnRate -= 50;
            }
        }

        // 更新目标
        this.updateEnemies(deltaTime);

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.02;
            p.vy += 0.2; // 重力

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 更新子弹效果
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].alpha -= 0.05;
            if (this.bullets[i].alpha <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(15, 52, 96, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 夜间模式效果
        if (this.nightMode) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 绘制背景星星
        this.drawStars();

        // 绘制目标
        this.enemies.forEach(enemy => this.drawEnemy(enemy));

        // 绘制粒子
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;

        // 绘制子弹效果
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.hit ? '#00ff00' : '#ffffff';
            this.ctx.globalAlpha = bullet.alpha;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    drawStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 217.3) % this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    drawEnemy(enemy) {
        this.ctx.save();
        this.ctx.translate(enemy.x, enemy.y);

        // 如果有自定义图像，使用图像绘制
        if (this.enemyImage && this.enemyImage.complete) {
            this.ctx.drawImage(
                this.enemyImage, -enemy.size, -enemy.size,
                enemy.size * 2,
                enemy.size * 2
            );
        } else {
            // 否则使用默认的圆形绘制方式
            // 绘制日本军旗样式（红色圆圈）
            this.ctx.fillStyle = '#cc0000';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();

            // 白色边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // 内部白色圆
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size * 0.7, 0, Math.PI * 2);
            this.ctx.fill();

            // 红色中心点
            this.ctx.fillStyle = '#cc0000';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();

            // 绘制帽子（军帽）
            this.ctx.fillStyle = '#4a5a3a';
            this.ctx.beginPath();
            this.ctx.arc(0, -enemy.size * 0.6, enemy.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// 初始化游戏
let game;
window.addEventListener('load', () => {
    game = new ShootingGame();

    // 导出题库给challenge.js使用
    if (game && game.quizQuestions) {
        window.gameQuestions = game.quizQuestions;
        console.log(`已导出 ${game.quizQuestions.length} 道题目给互动学习中心`);
    }
});