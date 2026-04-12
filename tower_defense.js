// ==================== 三大法宝塔防游戏 ====================
// 运用毛泽东思想，抵御错误思潮入侵

// 游戏配置
const GAME_CONFIG = {
    initialLives: 20,
    initialMoney: 300,
    initialScore: 0,
    fps: 60,
    gridSize: 40,
    pathWidth: 3
};

// 塔配置
const TOWER_CONFIG = {
    tongyi: {
        name: '统一战线塔',
        icon: '🤝',
        cost: 100,
        damage: 5,
        range: 120,
        fireRate: 1000, // 毫秒
        color: '#4CAF50',
        type: 'support',
        description: '范围减速，治疗盟友塔',
        upgradeCost: 80,
        maxLevel: 3
    },
    wuzhuang: {
        name: '武装斗争塔',
        icon: '⚔️',
        cost: 150,
        damage: 25,
        range: 100,
        fireRate: 800,
        color: '#F44336',
        type: 'attack',
        description: '高伤害输出，单体攻击',
        upgradeCost: 120,
        maxLevel: 3
    },
    dangjian: {
        name: '党的建设塔',
        icon: '📚',
        cost: 200,
        damage: 10,
        range: 80,
        fireRate: 1500,
        color: '#2196F3',
        type: 'production',
        description: '生产思想点数，强化周围塔',
        upgradeCost: 150,
        maxLevel: 3,
        moneyGeneration: 5 // 每5秒产生5点
    }
};

// 敌人类型配置
const ENEMY_TYPES = {
    zhuguan: {
        name: '主观主义',
        icon: '🤔',
        health: 30,
        speed: 1.5,
        reward: 10,
        color: '#FF9800',
        description: '不从实际出发，凭主观想象办事'
    },
    zongpai: {
        name: '宗派主义',
        icon: '👥',
        health: 50,
        speed: 1.2,
        reward: 15,
        color: '#9C27B0',
        description: '搞小圈子，破坏党的团结统一'
    },
    dangbagu: {
        name: '党八股',
        icon: '📜',
        health: 40,
        speed: 1.0,
        reward: 12,
        color: '#795548',
        description: '空话连篇，言之无物'
    },
    jiaotiao: {
        name: '教条主义',
        icon: '📖',
        health: 80,
        speed: 0.8,
        reward: 25,
        color: '#607D8B',
        description: '生搬硬套，不顾实际情况'
    },
    jingyan: {
        name: '经验主义',
        icon: '🧠',
        health: 60,
        speed: 1.3,
        reward: 18,
        color: '#009688',
        description: '只凭经验，不重视理论'
    },
    boss: {
        name: '错误思潮总头目',
        icon: '👹',
        health: 500,
        speed: 0.5,
        reward: 100,
        color: '#000000',
        description: '所有错误思想的集合体',
        isBoss: true
    }
};

// 波次配置
const WAVES = [
    {
        number: 1,
        name: '整风运动开始',
        year: '1942年',
        description: '延安整风运动开始，反对主观主义以整顿学风。',
        enemies: [
            { type: 'zhuguan', count: 5, interval: 2000 }
        ],
        reward: 50
    },
    {
        number: 2,
        name: '反对宗派主义',
        year: '1942年',
        description: '整顿党风，反对宗派主义，加强党的团结统一。',
        enemies: [
            { type: 'zhuguan', count: 3, interval: 2000 },
            { type: 'zongpai', count: 3, interval: 2500 }
        ],
        reward: 60
    },
    {
        number: 3,
        name: '反对党八股',
        year: '1942年',
        description: '整顿文风，反对党八股，提倡生动活泼的文风。',
        enemies: [
            { type: 'dangbagu', count: 5, interval: 2200 },
            { type: 'zhuguan', count: 3, interval: 2000 }
        ],
        reward: 70
    },
    {
        number: 4,
        name: '教条主义抬头',
        year: '1943年',
        description: '教条主义试图死灰复燃，必须坚决斗争！',
        enemies: [
            { type: 'jiaotiao', count: 4, interval: 3000 },
            { type: 'zhuguan', count: 5, interval: 1800 }
        ],
        reward: 80
    },
    {
        number: 5,
        name: '经验主义挑战',
        year: '1943年',
        description: '经验主义轻视理论，必须加以纠正。',
        enemies: [
            { type: 'jingyan', count: 6, interval: 2200 },
            { type: 'zongpai', count: 4, interval: 2500 }
        ],
        reward: 90
    },
    {
        number: 6,
        name: '整风运动高潮',
        year: '1944年',
        description: '整风运动进入高潮，各种错误思想集中反扑！',
        enemies: [
            { type: 'jiaotiao', count: 5, interval: 2500 },
            { type: 'jingyan', count: 5, interval: 2200 },
            { type: 'dangbagu', count: 5, interval: 2000 }
        ],
        reward: 100
    },
    {
        number: 7,
        name: '党的七大筹备',
        year: '1945年',
        description: '党的七大即将召开，错误思想做最后挣扎。',
        enemies: [
            { type: 'jiaotiao', count: 8, interval: 2000 },
            { type: 'zongpai', count: 6, interval: 2200 },
            { type: 'zhuguan', count: 8, interval: 1500 }
        ],
        reward: 120
    },
    {
        number: 8,
        name: '最终决战',
        year: '1945年',
        description: '党的七大胜利召开！消灭错误思潮总头目，确立毛泽东思想的指导地位！',
        enemies: [
            { type: 'boss', count: 1, interval: 0 },
            { type: 'jiaotiao', count: 5, interval: 2000 },
            { type: 'zongpai', count: 5, interval: 2000 }
        ],
        reward: 200
    }
];

// ==================== 游戏状态 ====================
let gameState = {
    lives: GAME_CONFIG.initialLives,
    money: GAME_CONFIG.initialMoney,
    score: GAME_CONFIG.initialScore,
    wave: 0,
    isRunning: false,
    isPaused: false,
    gameSpeed: 1,
    enemies: [],
    towers: [],
    bullets: [],
    particles: [],
    selectedTowerType: null,
    selectedTower: null,
    waveInProgress: false,
    enemiesKilled: 0,
    lastTime: 0,
    path: [],
    grid: []
};

// 画布和上下文
let canvas, ctx;
let animationId;

// ==================== 初始化 ====================
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化地图路径
    initPath();
    
    // 绑定画布点击事件
    canvas.addEventListener('click', handleCanvasClick);
    
    // 绑定右键菜单（取消默认）
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        closeTowerMenu();
    });
}

function resizeCanvas() {
    const container = document.getElementById('canvas-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (gameState.path.length === 0) {
        initPath();
    }
}

// 初始化路径（蛇形路径）
function initPath() {
    const cols = Math.floor(canvas.width / GAME_CONFIG.gridSize);
    const rows = Math.floor(canvas.height / GAME_CONFIG.gridSize);
    
    gameState.path = [];
    gameState.grid = [];
    
    // 初始化网格
    for (let y = 0; y < rows; y++) {
        gameState.grid[y] = [];
        for (let x = 0; x < cols; x++) {
            gameState.grid[y][x] = {
                x: x * GAME_CONFIG.gridSize,
                y: y * GAME_CONFIG.gridSize,
                isPath: false,
                hasTower: false
            };
        }
    }
    
    // 创建蛇形路径
    const pathY = Math.floor(rows / 2);
    const segmentLength = Math.floor(cols / 5);
    
    // 路径点
    const pathPoints = [
        { x: 0, y: pathY },
        { x: segmentLength, y: pathY },
        { x: segmentLength, y: pathY - 3 },
        { x: segmentLength * 2, y: pathY - 3 },
        { x: segmentLength * 2, y: pathY + 3 },
        { x: segmentLength * 3, y: pathY + 3 },
        { x: segmentLength * 3, y: pathY },
        { x: segmentLength * 4, y: pathY },
        { x: segmentLength * 4, y: pathY - 2 },
        { x: cols - 1, y: pathY - 2 }
    ];
    
    // 生成路径格子
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const start = pathPoints[i];
        const end = pathPoints[i + 1];
        
        const dx = Math.sign(end.x - start.x);
        const dy = Math.sign(end.y - start.y);
        
        let x = start.x;
        let y = start.y;
        
        while (x !== end.x || y !== end.y) {
            addPathCell(x, y);
            x += dx;
            y += dy;
        }
    }
    addPathCell(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
}

function addPathCell(x, y) {
    if (y >= 0 && y < gameState.grid.length && x >= 0 && x < gameState.grid[0].length) {
        gameState.grid[y][x].isPath = true;
        gameState.path.push({
            x: gameState.grid[y][x].x + GAME_CONFIG.gridSize / 2,
            y: gameState.grid[y][x].y + GAME_CONFIG.gridSize / 2,
            gridX: x,
            gridY: y
        });
    }
}

// ==================== 游戏循环 ====================
function gameLoop(timestamp) {
    if (!gameState.isRunning || gameState.isPaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
    }
    
    const deltaTime = (timestamp - gameState.lastTime) * gameState.gameSpeed;
    gameState.lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // 更新敌人
    updateEnemies(deltaTime);
    
    // 更新塔
    updateTowers(deltaTime);
    
    // 更新子弹
    updateBullets(deltaTime);
    
    // 更新粒子
    updateParticles(deltaTime);
    
    // 检查波次结束
    checkWaveEnd();
    
    // 更新UI
    updateUI();
}

// ==================== 敌人类 ====================
class Enemy {
    constructor(type) {
        const config = ENEMY_TYPES[type];
        this.type = type;
        this.name = config.name;
        this.icon = config.icon;
        this.maxHealth = config.health * (1 + gameState.wave * 0.2); // 每波增加20%血量
        this.health = this.maxHealth;
        this.speed = config.speed;
        this.baseSpeed = config.speed;
        this.reward = config.reward;
        this.color = config.color;
        this.description = config.description;
        this.isBoss = config.isBoss || false;
        
        this.pathIndex = 0;
        this.x = gameState.path[0].x;
        this.y = gameState.path[0].y;
        
        this.slowTimer = 0;
        this.slowFactor = 1;
        
        this.radius = this.isBoss ? 25 : 15;
    }
    
    update(deltaTime) {
        // 处理减速效果
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            this.speed = this.baseSpeed * this.slowFactor;
        } else {
            this.speed = this.baseSpeed;
            this.slowFactor = 1;
        }
        
        // 沿路径移动
        if (this.pathIndex < gameState.path.length - 1) {
            const target = gameState.path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                this.pathIndex++;
            } else {
                const moveDistance = this.speed * (deltaTime / 16);
                this.x += (dx / distance) * moveDistance;
                this.y += (dy / distance) * moveDistance;
            }
        } else {
            // 到达终点
            this.reachEnd();
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    applySlow(factor, duration) {
        this.slowFactor = factor;
        this.slowTimer = duration;
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    die() {
        // 移除敌人
        const index = gameState.enemies.indexOf(this);
        if (index > -1) {
            gameState.enemies.splice(index, 1);
        }
        
        // 奖励
        gameState.money += this.reward;
        gameState.score += this.reward * 10;
        gameState.enemiesKilled++;
        
        // 创建死亡粒子效果
        createParticles(this.x, this.y, this.color, 10);
        
        // 播放音效
        playSound('enemyDeath');
    }
    
    reachEnd() {
        // 敌人到达终点，扣除生命值
        gameState.lives -= this.isBoss ? 5 : 1;
        
        // 移除敌人
        const index = gameState.enemies.indexOf(this);
        if (index > -1) {
            gameState.enemies.splice(index, 1);
        }
        
        // 检查游戏结束
        if (gameState.lives <= 0) {
            gameOver();
        }
        
        // 播放音效
        playSound('baseDamage');
    }
    
    draw(ctx) {
        // 绘制3D立体敌人
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 绘制投影（地面阴影）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(5, 8, this.radius * 0.9, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 减速效果（冰霜光环）
        if (this.slowTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            const slowGradient = ctx.createRadialGradient(0, 0, this.radius, 0, 0, this.radius + 12);
            slowGradient.addColorStop(0, 'rgba(33, 150, 243, 0.2)');
            slowGradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.4)');
            slowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = slowGradient;
            ctx.fill();
            
            // 冰霜粒子
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (Date.now() / 500 + i * Math.PI / 3) % (Math.PI * 2);
                const r = this.radius + 8;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.6 - 5);
                ctx.lineTo(Math.cos(angle) * (r + 6), Math.sin(angle) * (r + 6) * 0.6 - 5);
                ctx.stroke();
            }
        }
        
        // BOSS特殊效果（光环）
        if (this.isBoss) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(0, -5, this.radius + 15, 0, Math.PI * 2);
            const bossGradient = ctx.createRadialGradient(0, -5, this.radius, 0, -5, this.radius + 15);
            bossGradient.addColorStop(0, `rgba(139, 0, 0, ${0.4 * pulse})`);
            bossGradient.addColorStop(0.5, `rgba(255, 0, 0, ${0.2 * pulse})`);
            bossGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = bossGradient;
            ctx.fill();
        }
        
        // ===== 3D球体敌人主体 =====
        const sphereY = -5; // 球体中心向上偏移，产生立体感
        
        // 球体底部阴影（增加立体感）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, sphereY + this.radius * 0.8, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 球体暗面（右侧）
        ctx.fillStyle = this.darkenColor(this.color, 30);
        ctx.beginPath();
        ctx.arc(2, sphereY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 球体主体（3D渐变）
        const sphereGradient = ctx.createRadialGradient(-this.radius * 0.3, sphereY - this.radius * 0.3, 0, 0, sphereY, this.radius);
        sphereGradient.addColorStop(0, this.lightenColor(this.color, 40));
        sphereGradient.addColorStop(0.3, this.lightenColor(this.color, 15));
        sphereGradient.addColorStop(0.7, this.color);
        sphereGradient.addColorStop(1, this.darkenColor(this.color, 40));
        ctx.fillStyle = sphereGradient;
        ctx.beginPath();
        ctx.arc(0, sphereY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光反射（增加光泽感）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-this.radius * 0.35, sphereY - this.radius * 0.35, this.radius * 0.25, this.radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 外圈边框
        ctx.strokeStyle = this.isBoss ? '#ffd700' : this.lightenColor(this.color, 50);
        ctx.lineWidth = this.isBoss ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, sphereY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 图标（带3D阴影效果）
        ctx.font = this.isBoss ? 'bold 32px Arial' : 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 图标阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillText(this.icon, 2, sphereY + 2);
        
        // 图标主体
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText(this.icon, 0, sphereY);
        ctx.shadowBlur = 0;
        
        // 血条背景（3D效果）
        const barWidth = this.radius * 2.8;
        const barHeight = 7;
        const barY = sphereY - this.radius - 18;
        const healthPercent = this.health / this.maxHealth;
        
        // 血条阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(-barWidth / 2 + 2, barY + 2, barWidth, barHeight);
        
        // 血条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        // 血条（渐变）
        const healthGradient = ctx.createLinearGradient(-barWidth / 2, barY, barWidth / 2, barY);
        if (healthPercent > 0.5) {
            healthGradient.addColorStop(0, '#4CAF50');
            healthGradient.addColorStop(0.5, '#66BB6A');
            healthGradient.addColorStop(1, '#4CAF50');
        } else if (healthPercent > 0.25) {
            healthGradient.addColorStop(0, '#FF9800');
            healthGradient.addColorStop(0.5, '#FFB74D');
            healthGradient.addColorStop(1, '#FF9800');
        } else {
            healthGradient.addColorStop(0, '#F44336');
            healthGradient.addColorStop(0.5, '#EF5350');
            healthGradient.addColorStop(1, '#F44336');
        }
        ctx.fillStyle = healthGradient;
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        // 血条高光边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
        
        ctx.restore();
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

function updateEnemies(deltaTime) {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        gameState.enemies[i].update(deltaTime);
    }
}

// ==================== 塔类 ====================
class Tower {
    constructor(type, gridX, gridY) {
        const config = TOWER_CONFIG[type];
        this.type = type;
        this.name = config.name;
        this.icon = config.icon;
        this.x = gridX * GAME_CONFIG.gridSize + GAME_CONFIG.gridSize / 2;
        this.y = gridY * GAME_CONFIG.gridSize + GAME_CONFIG.gridSize / 2;
        this.gridX = gridX;
        this.gridY = gridY;
        
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.towerType = config.type;
        
        this.level = 1;
        this.maxLevel = config.maxLevel;
        this.upgradeCost = config.upgradeCost;
        
        this.lastFireTime = 0;
        this.target = null;
        
        // 特殊属性
        this.moneyGeneration = config.moneyGeneration || 0;
        this.lastMoneyTime = 0;
    }
    
    update(deltaTime) {
        // 寻找目标
        this.findTarget();
        
        // 攻击
        if (this.target && Date.now() - this.lastFireTime > this.fireRate) {
            this.fire();
            this.lastFireTime = Date.now();
        }
        
        // 党的建设塔产生金钱
        if (this.towerType === 'production' && this.moneyGeneration > 0) {
            if (Date.now() - this.lastMoneyTime > 5000) { // 每5秒
                gameState.money += this.moneyGeneration * this.level;
                this.lastMoneyTime = Date.now();
                
                // 显示金钱增加效果
                createFloatingText(this.x, this.y - 30, `+${this.moneyGeneration * this.level}`, '#ffd700');
            }
        }
        
        // 统一战线塔的治疗和减速效果
        if (this.towerType === 'support') {
            this.applySupportEffects();
        }
    }
    
    findTarget() {
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of gameState.enemies) {
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        this.target = closestEnemy;
    }
    
    fire() {
        if (!this.target) return;
        
        switch (this.towerType) {
            case 'attack':
                // 武装斗争塔：发射高伤害子弹
                gameState.bullets.push(new Bullet(
                    this.x, this.y, this.target, this.damage * this.level, 'attack', this.color
                ));
                break;
                
            case 'support':
                // 统一战线塔：发射减速子弹
                gameState.bullets.push(new Bullet(
                    this.x, this.y, this.target, this.damage * this.level, 'slow', this.color
                ));
                break;
                
            case 'production':
                // 党的建设塔：发射削弱子弹
                gameState.bullets.push(new Bullet(
                    this.x, this.y, this.target, this.damage * this.level, 'weaken', this.color
                ));
                break;
        }
        
        playSound('shoot');
    }
    
    applySupportEffects() {
        // 统一战线塔：范围内治疗其他塔和减速敌人
        for (const tower of gameState.towers) {
            if (tower !== this) {
                const distance = Math.hypot(tower.x - this.x, tower.y - this.y);
                if (distance <= this.range) {
                    // 可以在这里添加塔的强化效果
                }
            }
        }
        
        // 范围内减速敌人
        for (const enemy of gameState.enemies) {
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (distance <= this.range * 0.5) {
                enemy.applySlow(0.6, 1000); // 减速40%，持续1秒
            }
        }
    }
    
    upgrade() {
        if (this.level >= this.maxLevel) return false;
        
        this.level++;
        this.damage *= 1.5;
        this.range *= 1.1;
        this.fireRate *= 0.9;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);
        
        // 升级特效
        createParticles(this.x, this.y, '#ffd700', 20);
        playSound('upgrade');
        
        return true;
    }
    
    getSellValue() {
        const config = TOWER_CONFIG[this.type];
        let totalCost = config.cost;
        let upgradeCost = config.upgradeCost;
        
        for (let i = 1; i < this.level; i++) {
            totalCost += upgradeCost;
            upgradeCost = Math.floor(upgradeCost * 1.5);
        }
        
        return Math.floor(totalCost * 0.7); // 70%返还
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 绘制攻击范围（选中时）
        if (gameState.selectedTower === this) {
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // ===== 3D立体塔楼绘制 =====
        const towerHeight = 35 + this.level * 8; // 塔高随等级增加
        const baseSize = 22;
        const topSize = 16;
        
        // 绘制投影（地面阴影）
        ctx.save();
        ctx.translate(8, 8);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, baseSize + 5, baseSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // 绘制塔基座（3D立体石台）
        this.draw3DBase(ctx, baseSize, towerHeight, topSize);
        
        // 绘制等级星标（在塔顶上方）
        if (this.level > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 16px Arial';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            for (let i = 0; i < this.level - 1; i++) {
                const starX = -((this.level - 2) * 8) + i * 16;
                ctx.fillText('★', starX, -towerHeight - 15);
            }
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
    
    // 绘制3D立体基座
    draw3DBase(ctx, baseSize, height, topSize) {
        // 塔身侧面（3D效果）
        const sideColor = this.darkenColor(this.color, 40);
        const lightColor = this.lightenColor(this.color, 20);
        
        // 左侧面（暗面）
        ctx.fillStyle = sideColor;
        ctx.beginPath();
        ctx.moveTo(-baseSize, 0);
        ctx.lineTo(-topSize, -height);
        ctx.lineTo(0, -height);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        
        // 右侧面（亮面）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -height);
        ctx.lineTo(topSize, -height);
        ctx.lineTo(baseSize, 0);
        ctx.closePath();
        ctx.fill();
        
        // 塔顶（受光面）
        const topGradient = ctx.createLinearGradient(-topSize, -height, topSize, -height);
        topGradient.addColorStop(0, lightColor);
        topGradient.addColorStop(0.5, this.color);
        topGradient.addColorStop(1, sideColor);
        ctx.fillStyle = topGradient;
        ctx.beginPath();
        ctx.ellipse(0, -height, topSize, topSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 塔顶边框
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制塔顶装饰（根据塔类型）
        this.drawTowerTop(ctx, -height, topSize);
        
        // 塔底（石质基座）
        const baseGradient = ctx.createLinearGradient(-baseSize, 0, baseSize, 0);
        baseGradient.addColorStop(0, '#5c4033');
        baseGradient.addColorStop(0.3, '#8b7355');
        baseGradient.addColorStop(0.7, '#8b7355');
        baseGradient.addColorStop(1, '#5c4033');
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, baseSize, baseSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 基座边框
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // 绘制塔顶装饰
    drawTowerTop(ctx, y, size) {
        ctx.save();
        ctx.translate(0, y);
        
        // 根据塔类型绘制不同装饰
        switch(this.type) {
            case 'tongyi': // 统一战线塔 - 握手标志
                this.draw3DIcon(ctx, '🤝', size * 0.8);
                // 光环效果
                ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'wuzhuang': // 武装斗争塔 - 剑标志
                this.draw3DIcon(ctx, '⚔️', size * 0.8);
                // 火焰效果
                const flameGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size + 8);
                flameGradient.addColorStop(0, 'rgba(255, 69, 0, 0.4)');
                flameGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'dangjian': // 党的建设塔 - 书本标志
                this.draw3DIcon(ctx, '📚', size * 0.8);
                // 知识光环
                ctx.strokeStyle = 'rgba(33, 150, 243, 0.6)';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
        }
        
        ctx.restore();
    }
    
    // 绘制3D图标效果
    draw3DIcon(ctx, icon, size) {
        // 图标阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 2, 2);
        
        // 图标主体
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(icon, 0, 0);
        ctx.shadowBlur = 0;
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        // 简单的颜色变暗函数
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

// ==================== 子弹类 ====================
class Bullet {
    constructor(x, y, target, damage, type, color) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.type = type; // 'attack', 'slow', 'weaken'
        this.color = color;
        this.speed = 8;
        this.radius = 5;
        this.active = true;
    }
    
    update(deltaTime) {
        if (!this.target || !gameState.enemies.includes(this.target)) {
            this.active = false;
            return;
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < this.target.radius + this.radius) {
            // 命中目标
            this.hit();
        } else {
            // 继续追踪
            const moveDistance = this.speed * (deltaTime / 16);
            this.x += (dx / distance) * moveDistance;
            this.y += (dy / distance) * moveDistance;
        }
    }
    
    hit() {
        this.active = false;
        
        switch (this.type) {
            case 'attack':
                this.target.takeDamage(this.damage);
                createParticles(this.x, this.y, '#F44336', 5);
                break;
                
            case 'slow':
                this.target.takeDamage(this.damage);
                this.target.applySlow(0.5, 3000); // 减速50%，持续3秒
                createParticles(this.x, this.y, '#4CAF50', 5);
                break;
                
            case 'weaken':
                this.target.takeDamage(this.damage * 1.5); // 党的建设塔造成更高伤害
                createParticles(this.x, this.y, '#2196F3', 5);
                break;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // 3D子弹效果
        const bulletHeight = 8;
        
        // 子弹投影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + 3, this.y + 3, this.radius * 0.8, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 子弹光晕（外发光）
        const glowSize = 15 + Math.sin(Date.now() / 100) * 3;
        const glowGradient = ctx.createRadialGradient(this.x, this.y - bulletHeight/2, 0, this.x, this.y - bulletHeight/2, glowSize);
        if (this.type === 'attack') {
            glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
            glowGradient.addColorStop(0.4, 'rgba(255, 69, 0, 0.5)');
            glowGradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.2)');
        } else if (this.type === 'slow') {
            glowGradient.addColorStop(0, 'rgba(100, 255, 150, 0.9)');
            glowGradient.addColorStop(0.4, 'rgba(0, 255, 127, 0.5)');
            glowGradient.addColorStop(0.7, 'rgba(50, 205, 50, 0.2)');
        } else {
            glowGradient.addColorStop(0, 'rgba(100, 180, 255, 0.9)');
            glowGradient.addColorStop(0.4, 'rgba(30, 144, 255, 0.5)');
            glowGradient.addColorStop(0.7, 'rgba(65, 105, 225, 0.2)');
        }
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - bulletHeight/2, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 3D球体子弹核心
        const sphereY = this.y - bulletHeight/2;
        
        // 球体暗面
        ctx.fillStyle = this.darkenColor(this.color, 30);
        ctx.beginPath();
        ctx.arc(this.x + 1, sphereY + 1, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 球体主体（渐变）
        const sphereGradient = ctx.createRadialGradient(this.x - this.radius*0.3, sphereY - this.radius*0.3, 0, this.x, sphereY, this.radius);
        sphereGradient.addColorStop(0, this.lightenColor(this.color, 50));
        sphereGradient.addColorStop(0.5, this.color);
        sphereGradient.addColorStop(1, this.darkenColor(this.color, 30));
        ctx.fillStyle = sphereGradient;
        ctx.beginPath();
        ctx.arc(this.x, sphereY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius*0.3, sphereY - this.radius*0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 外边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(this.x, sphereY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

function updateTowers(deltaTime) {
    for (const tower of gameState.towers) {
        tower.update(deltaTime);
    }
}

function updateBullets(deltaTime) {
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.update(deltaTime);
        
        if (!bullet.active) {
            gameState.bullets.splice(i, 1);
        }
    }
}

// ==================== 3D粒子效果 ====================
class Particle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.z = 0; // 3D深度
        this.color = color;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed - 2; // 初始向上
        this.vz = (Math.random() - 0.5) * speed * 0.5; // 深度速度
        this.life = 1;
        this.decay = 0.015 + Math.random() * 0.015;
        this.size = 4 + Math.random() * 5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.vy += 0.15; // 重力
        this.vx *= 0.98; // 空气阻力
        this.vz *= 0.98;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 3D粒子效果
        const scale = 1 + this.z * 0.02; // 根据深度缩放
        const drawSize = this.size * scale;
        
        // 粒子投影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(drawSize * 0.3, drawSize * 0.3, drawSize * 0.5, drawSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 粒子主体（3D球体效果）
        const gradient = ctx.createRadialGradient(-drawSize*0.2, -drawSize*0.2, 0, 0, 0, drawSize);
        gradient.addColorStop(0, this.lightenColor(this.color, 40));
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 30));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-drawSize*0.25, -drawSize*0.25, drawSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min((num >> 16) + amt, 255);
        const G = Math.min((num >> 8 & 0x00FF) + amt, 255);
        const B = Math.min((num & 0x0000FF) + amt, 255);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

// 浮动文字效果
let floatingTexts = [];

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
        this.vy = -1;
    }
    
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color, 5));
    }
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push(new FloatingText(x, y, text, color));
}

function updateParticles(deltaTime) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.update();
        
        if (particle.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
    
    // 更新浮动文字
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const text = floatingTexts[i];
        text.update();
        
        if (text.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// ==================== 波次系统 ====================
let waveSpawnQueue = [];
let lastSpawnTime = 0;

function startNextWave() {
    if (gameState.waveInProgress || gameState.wave >= WAVES.length) {
        return;
    }
    
    gameState.wave++;
    gameState.waveInProgress = true;
    
    const waveConfig = WAVES[gameState.wave - 1];
    
    // 准备生成队列
    waveSpawnQueue = [];
    for (const enemyGroup of waveConfig.enemies) {
        for (let i = 0; i < enemyGroup.count; i++) {
            waveSpawnQueue.push({
                type: enemyGroup.type,
                delay: i * enemyGroup.interval
            });
        }
    }
    
    // 按延迟排序
    waveSpawnQueue.sort((a, b) => a.delay - b.delay);
    
    lastSpawnTime = Date.now();
    
    // 更新UI
    document.getElementById('wave-number').textContent = `第 ${gameState.wave} 波`;
    document.getElementById('wave-name').textContent = waveConfig.name;
    document.getElementById('wave-timer').textContent = '敌人来袭中...';
    document.getElementById('start-wave-btn').disabled = true;
    
    // 显示历史事件
    showEventModal(waveConfig);
}

function checkWaveEnd() {
    if (!gameState.waveInProgress) return;
    
    // 生成敌人
    const currentTime = Date.now();
    while (waveSpawnQueue.length > 0 && currentTime - lastSpawnTime >= waveSpawnQueue[0].delay) {
        const enemyData = waveSpawnQueue.shift();
        gameState.enemies.push(new Enemy(enemyData.type));
        lastSpawnTime = currentTime;
    }
    
    // 检查波次是否结束
    if (waveSpawnQueue.length === 0 && gameState.enemies.length === 0) {
        endWave();
    }
}

function endWave() {
    gameState.waveInProgress = false;
    
    const waveConfig = WAVES[gameState.wave - 1];
    
    // 波次奖励
    gameState.money += waveConfig.reward;
    gameState.score += waveConfig.reward * 5;
    
    createFloatingText(canvas.width / 2, canvas.height / 2, `波次完成! +${waveConfig.reward}`, '#ffd700');
    
    // 检查是否通关
    if (gameState.wave >= WAVES.length) {
        victory();
        return;
    }
    
    // 更新UI
    document.getElementById('wave-timer').textContent = '准备下一波...';
    document.getElementById('start-wave-btn').disabled = false;
    document.getElementById('start-wave-btn').textContent = '▶️ 开始下一波';
}

// ==================== 事件系统 ====================
function showEventModal(waveConfig) {
    const modal = document.getElementById('event-modal');
    
    document.getElementById('event-year').textContent = waveConfig.year;
    document.getElementById('event-name').textContent = waveConfig.name;
    document.getElementById('event-desc').textContent = waveConfig.description;
    document.getElementById('event-game-effect').textContent = `游戏效果：本波次敌人数量增加，击败敌人可获得思想点数奖励！`;
    
    modal.classList.add('show');
    
    // 暂停游戏
    const wasPaused = gameState.isPaused;
    gameState.isPaused = true;
    
    // 保存暂停状态，关闭时恢复
    window.tempPauseState = wasPaused;
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('show');
    
    // 恢复游戏状态
    gameState.isPaused = window.tempPauseState || false;
}

// ==================== 绘制函数 ====================
function draw() {
    // 清空画布 - 使用延安黄土高原风格背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // 天空蓝
    gradient.addColorStop(0.4, '#DEB887'); // 沙色
    gradient.addColorStop(1, '#D2691E'); // 黄土色
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制远山（宝塔山风格）
    drawMountains();
    
    // 绘制网格
    drawGrid();
    
    // 绘制路径
    drawPath();
    
    // 绘制塔
    for (const tower of gameState.towers) {
        tower.draw(ctx);
    }
    
    // 绘制敌人
    for (const enemy of gameState.enemies) {
        enemy.draw(ctx);
    }
    
    // 绘制子弹
    for (const bullet of gameState.bullets) {
        bullet.draw(ctx);
    }
    
    // 绘制粒子
    for (const particle of gameState.particles) {
        particle.draw(ctx);
    }
    
    // 绘制浮动文字
    for (const text of floatingTexts) {
        text.draw(ctx);
    }
    
    // 绘制选中塔的预览
    if (gameState.selectedTowerType) {
        drawTowerPreview();
    }
}

function drawMountains() {
    // ===== 3D透视背景层 =====
    const time = Date.now() / 5000; // 用于动态效果
    
    // 最远景（天空渐变）
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
    skyGradient.addColorStop(0, '#4a5568');
    skyGradient.addColorStop(0.3, '#718096');
    skyGradient.addColorStop(0.6, '#a0aec0');
    skyGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
    
    // 远景山脉（最淡）
    ctx.fillStyle = 'rgba(101, 78, 60, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.55);
    for (let i = 0; i <= canvas.width; i += 50) {
        const height = canvas.height * 0.45 + Math.sin(i * 0.01 + time) * 20;
        ctx.lineTo(i, height);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // 中景山脉
    ctx.fillStyle = 'rgba(139, 90, 43, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.6);
    
    // 左侧山峰
    ctx.lineTo(canvas.width * 0.15, canvas.height * 0.42);
    ctx.lineTo(canvas.width * 0.25, canvas.height * 0.52);
    
    // 中间主峰（宝塔山风格）- 3D立体
    ctx.lineTo(canvas.width * 0.45, canvas.height * 0.28);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.22); // 山顶
    ctx.lineTo(canvas.width * 0.55, canvas.height * 0.28);
    ctx.lineTo(canvas.width * 0.65, canvas.height * 0.48);
    
    // 右侧山峰
    ctx.lineTo(canvas.width * 0.8, canvas.height * 0.38);
    ctx.lineTo(canvas.width * 0.9, canvas.height * 0.45);
    ctx.lineTo(canvas.width, canvas.height * 0.52);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // 山脉高光（增加立体感）
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.45, canvas.height * 0.28);
    ctx.lineTo(canvas.width * 0.5, canvas.height * 0.22);
    ctx.lineTo(canvas.width * 0.55, canvas.height * 0.28);
    ctx.stroke();
    
    // 绘制3D宝塔
    draw3DTower();
    
    // 近景地形（黄土高原风格）
    const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
    groundGradient.addColorStop(0, 'rgba(160, 120, 80, 0.2)');
    groundGradient.addColorStop(0.5, 'rgba(139, 90, 43, 0.3)');
    groundGradient.addColorStop(1, 'rgba(101, 67, 33, 0.4)');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);
}

// 绘制3D宝塔
function draw3DTower() {
    const towerX = canvas.width * 0.5;
    const towerY = canvas.height * 0.22;
    const towerHeight = 100;
    const towerWidth = 30;
    
    // 宝塔投影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(towerX + 15, towerY + towerHeight + 10, towerWidth, towerWidth * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 塔身（3D效果）
    // 左侧面（暗面）
    ctx.fillStyle = 'rgba(101, 67, 33, 0.6)';
    ctx.beginPath();
    ctx.moveTo(towerX - towerWidth/2, towerY + towerHeight);
    ctx.lineTo(towerX - towerWidth/3, towerY);
    ctx.lineTo(towerX, towerY);
    ctx.lineTo(towerX, towerY + towerHeight);
    ctx.closePath();
    ctx.fill();
    
    // 右侧面（亮面）
    ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
    ctx.beginPath();
    ctx.moveTo(towerX, towerY + towerHeight);
    ctx.lineTo(towerX, towerY);
    ctx.lineTo(towerX + towerWidth/3, towerY);
    ctx.lineTo(towerX + towerWidth/2, towerY + towerHeight);
    ctx.closePath();
    ctx.fill();
    
    // 塔顶（3D金字塔）
    // 塔顶暗面
    ctx.fillStyle = 'rgba(180, 150, 80, 0.7)';
    ctx.beginPath();
    ctx.moveTo(towerX - towerWidth/3, towerY);
    ctx.lineTo(towerX, towerY - 30);
    ctx.lineTo(towerX, towerY);
    ctx.closePath();
    ctx.fill();
    
    // 塔顶亮面
    ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.beginPath();
    ctx.moveTo(towerX, towerY);
    ctx.lineTo(towerX, towerY - 30);
    ctx.lineTo(towerX + towerWidth/3, towerY);
    ctx.closePath();
    ctx.fill();
    
    // 塔顶高光
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(towerX, towerY - 30);
    ctx.lineTo(towerX, towerY);
    ctx.stroke();
    
    // 塔层装饰线
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const y = towerY + towerHeight - i * 20;
        const width = towerWidth/2 + i * 3;
        ctx.beginPath();
        ctx.moveTo(towerX - width, y);
        ctx.lineTo(towerX + width, y);
        ctx.stroke();
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += GAME_CONFIG.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += GAME_CONFIG.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPath() {
    if (gameState.path.length < 2) return;
    
    // 绘制路径阴影
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    ctx.lineWidth = GAME_CONFIG.gridSize * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(gameState.path[0].x, gameState.path[0].y);
    for (let i = 1; i < gameState.path.length; i++) {
        ctx.lineTo(gameState.path[i].x, gameState.path[i].y);
    }
    ctx.stroke();
    
    // 绘制路径主体（黄土路）
    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = GAME_CONFIG.gridSize * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(gameState.path[0].x, gameState.path[0].y);
    
    for (let i = 1; i < gameState.path.length; i++) {
        ctx.lineTo(gameState.path[i].x, gameState.path[i].y);
    }
    
    ctx.stroke();
    
    // 绘制路径边框
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制起点（延安）
    const start = gameState.path[0];
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('延安', start.x, start.y);
    
    // 绘制终点（要保卫的阵地）
    const end = gameState.path[gameState.path.length - 1];
    ctx.fillStyle = '#8B0000';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 绘制红旗
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(end.x, end.y - 35);
    ctx.lineTo(end.x + 20, end.y - 25);
    ctx.lineTo(end.x, end.y - 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Noto Serif SC", serif';
    ctx.fillText('思想阵地', end.x, end.y + 5);
}

function drawTowerPreview() {
    const rect = canvas.getBoundingClientRect();
    const mouseX = window.mouseX - rect.left;
    const mouseY = window.mouseY - rect.top;
    
    const gridX = Math.floor(mouseX / GAME_CONFIG.gridSize);
    const gridY = Math.floor(mouseY / GAME_CONFIG.gridSize);
    
    if (gridY >= 0 && gridY < gameState.grid.length && gridX >= 0 && gridX < gameState.grid[0].length) {
        const cell = gameState.grid[gridY][gridX];
        const config = TOWER_CONFIG[gameState.selectedTowerType];
        
        // 检查是否可以放置
        const canPlace = !cell.isPath && !cell.hasTower;
        
        ctx.save();
        ctx.translate(cell.x + GAME_CONFIG.gridSize / 2, cell.y + GAME_CONFIG.gridSize / 2);
        
        // 绘制范围预览
        ctx.beginPath();
        ctx.arc(0, 0, config.range, 0, Math.PI * 2);
        ctx.fillStyle = canPlace ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
        ctx.fill();
        ctx.strokeStyle = canPlace ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制塔预览
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = canPlace ? '#4CAF50' : '#F44336';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.icon, 0, 0);
        
        ctx.restore();
    }
}

// ==================== 输入处理 ====================
function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const gridX = Math.floor(x / GAME_CONFIG.gridSize);
    const gridY = Math.floor(y / GAME_CONFIG.gridSize);
    
    // 检查是否点击了已存在的塔
    for (const tower of gameState.towers) {
        if (tower.gridX === gridX && tower.gridY === gridY) {
            showTowerMenu(tower, e.clientX, e.clientY);
            return;
        }
    }
    
    // 放置新塔
    if (gameState.selectedTowerType) {
        placeTower(gridX, gridY);
    }
}

function placeTower(gridX, gridY) {
    if (gridY < 0 || gridY >= gameState.grid.length || gridX < 0 || gridX >= gameState.grid[0].length) {
        return;
    }
    
    const cell = gameState.grid[gridY][gridX];
    const config = TOWER_CONFIG[gameState.selectedTowerType];
    
    // 检查是否可以放置
    if (cell.isPath) {
        alert('不能在路径上放置塔！');
        return;
    }
    
    if (cell.hasTower) {
        alert('该位置已有塔！');
        return;
    }
    
    if (gameState.money < config.cost) {
        alert('思想点数不足！');
        return;
    }
    
    // 扣除金钱
    gameState.money -= config.cost;
    
    // 创建塔
    const tower = new Tower(gameState.selectedTowerType, gridX, gridY);
    gameState.towers.push(tower);
    cell.hasTower = true;
    
    // 特效
    createParticles(tower.x, tower.y, config.color, 10);
    playSound('place');
    
    // 取消选择
    gameState.selectedTowerType = null;
    document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
    
    updateUI();
}

function selectTower(type) {
    if (gameState.selectedTowerType === type) {
        gameState.selectedTowerType = null;
        document.querySelectorAll('.tower-card').forEach(card => card.classList.remove('selected'));
    } else {
        gameState.selectedTowerType = type;
        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.tower === type) {
                card.classList.add('selected');
            }
        });
    }
}

// ==================== 塔菜单 ====================
function showTowerMenu(tower, x, y) {
    gameState.selectedTower = tower;
    
    const menu = document.getElementById('tower-menu');
    document.getElementById('menu-tower-name').textContent = `${tower.name} (Lv.${tower.level})`;
    document.getElementById('upgrade-cost').textContent = tower.upgradeCost;
    document.getElementById('sell-value').textContent = tower.getSellValue();
    
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (tower.level >= tower.maxLevel) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = '⬆️ 已满级';
    } else if (gameState.money < tower.upgradeCost) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerHTML = `⬆️ 升级 (${tower.upgradeCost})`;
    } else {
        upgradeBtn.disabled = false;
        upgradeBtn.innerHTML = `⬆️ 升级 (${tower.upgradeCost})`;
    }
    
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    menu.style.display = 'block';
}

function closeTowerMenu() {
    document.getElementById('tower-menu').style.display = 'none';
    gameState.selectedTower = null;
}

function upgradeSelectedTower() {
    if (!gameState.selectedTower) return;
    
    const tower = gameState.selectedTower;
    
    if (gameState.money < tower.upgradeCost) {
        alert('思想点数不足！');
        return;
    }
    
    gameState.money -= tower.upgradeCost;
    tower.upgrade();
    
    closeTowerMenu();
    updateUI();
}

function sellSelectedTower() {
    if (!gameState.selectedTower) return;
    
    const tower = gameState.selectedTower;
    const sellValue = tower.getSellValue();
    
    gameState.money += sellValue;
    
    // 移除塔
    const index = gameState.towers.indexOf(tower);
    if (index > -1) {
        gameState.towers.splice(index, 1);
    }
    
    // 更新网格
    gameState.grid[tower.gridY][tower.gridX].hasTower = false;
    
    createFloatingText(tower.x, tower.y, `+${sellValue}`, '#ffd700');
    playSound('sell');
    
    closeTowerMenu();
    updateUI();
}

// ==================== 游戏控制 ====================
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameState.isRunning = true;
    gameState.lastTime = performance.now();
    
    init();
    gameLoop(performance.now());
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.querySelector('#game-controls button').textContent = gameState.isPaused ? '▶️ 继续' : '⏸️ 暂停';
}

function toggleSpeed() {
    if (gameState.gameSpeed === 1) {
        gameState.gameSpeed = 2;
    } else if (gameState.gameSpeed === 2) {
        gameState.gameSpeed = 3;
    } else {
        gameState.gameSpeed = 1;
    }
    
    const speedText = gameState.gameSpeed === 1 ? '⚡ 加速' : gameState.gameSpeed === 2 ? '⚡⚡ 快速' : '⚡⚡⚡ 极速';
    document.querySelectorAll('#game-controls button')[1].textContent = speedText;
}

function restartGame() {
    // 重置游戏状态
    gameState = {
        lives: GAME_CONFIG.initialLives,
        money: GAME_CONFIG.initialMoney,
        score: GAME_CONFIG.initialScore,
        wave: 0,
        isRunning: true,
        isPaused: false,
        gameSpeed: 1,
        enemies: [],
        towers: [],
        bullets: [],
        particles: [],
        selectedTowerType: null,
        selectedTower: null,
        waveInProgress: false,
        enemiesKilled: 0,
        lastTime: 0,
        path: [],
        grid: []
    };
    
    floatingTexts = [];
    waveSpawnQueue = [];
    
    // 隐藏游戏结束画面
    document.getElementById('game-over-screen').classList.remove('show');
    
    // 重置UI
    document.getElementById('wave-number').textContent = '第 1 波';
    document.getElementById('wave-name').textContent = '整风运动开始';
    document.getElementById('wave-timer').textContent = '点击开始波次';
    document.getElementById('start-wave-btn').disabled = false;
    document.getElementById('start-wave-btn').textContent = '▶️ 开始波次';
    
    // 重新初始化
    initPath();
    updateUI();
}

function gameOver() {
    gameState.isRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('game-over-title').textContent = '游戏结束';
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-wave').textContent = gameState.wave;
    document.getElementById('final-kills').textContent = gameState.enemiesKilled;
    
    document.getElementById('game-over-screen').classList.add('show');
}

function victory() {
    gameState.isRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('game-over-title').textContent = '🎉 胜利！';
    document.getElementById('game-over-title').style.color = '#ffd700';
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-wave').textContent = gameState.wave;
    document.getElementById('final-kills').textContent = gameState.enemiesKilled;
    
    document.getElementById('game-over-screen').classList.add('show');
}

// ==================== UI更新 ====================
function updateUI() {
    document.getElementById('lives-display').textContent = gameState.lives;
    document.getElementById('money-display').textContent = gameState.money;
    document.getElementById('score-display').textContent = gameState.score;
    
    // 更新塔的可用状态
    document.querySelectorAll('.tower-card').forEach(card => {
        const type = card.dataset.tower;
        const config = TOWER_CONFIG[type];
        
        if (gameState.money < config.cost) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });
}

// ==================== 音效系统 ====================
function playSound(type) {
    // 简单的音效模拟（使用Web Audio API）
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'shoot':
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'place':
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
            
        case 'upgrade':
            oscillator.frequency.value = 1000;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
            
        case 'sell':
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
            
        case 'enemyDeath':
            oscillator.frequency.value = 200;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
            
        case 'baseDamage':
            oscillator.frequency.value = 150;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
    }
}

// ==================== 鼠标追踪 ====================
window.mouseX = 0;
window.mouseY = 0;

document.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
});

// ==================== 初始化 ====================
window.onload = init;
