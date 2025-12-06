// 僵尸类模块

class Zombie {
    constructor(x, y, type = 'normal', wave = 1) {
        // 位置和尺寸
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.radius = 17;
        
        // 类型和波次
        this.type = type;
        this.wave = wave; // 记录生成时的波次，用于属性加成
        this.applyTypeStats();
        
        // 移动
        this.velocityX = 0;
        this.velocityY = 0;
        this.direction = 0;
        
        // 状态
        this.isAlive = true;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.stunned = false;
        this.stunnedTimer = 0;
        
        // 动画
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // AI状态
        this.aiState = 'idle'; // idle, chase, attack
        this.targetX = 0;
        this.targetY = 0;
        this.pathUpdateTimer = 0;
        this.pathUpdateInterval = 500; // 每0.5秒更新路径
        
        // 唯一ID
        this.id = Utils.generateId();
    }

    // 根据类型应用属性（带波次加成）
    applyTypeStats() {
        const types = {
            normal: {
                health: 30,        // 降低基础血量，让第一波更简单
                speed: 1.0,        // 降低基础速度
                damage: 5,         // 降低基础伤害
                attackSpeed: 1200, // 攻击间隔更长
                color: '#228822',
                reward: 10,
                name: '普通僵尸'
            },
            fast: {
                health: 20,
                speed: 2.0,
                damage: 4,
                attackSpeed: 1000,
                color: '#44aa44',
                reward: 15,
                name: '快速僵尸'
            },
            tank: {
                health: 100,
                speed: 0.6,
                damage: 15,
                attackSpeed: 1800,
                color: '#115511',
                reward: 30,
                name: '坦克僵尸'
            },
            spitter: {
                health: 25,
                speed: 0.8,
                damage: 10,
                attackSpeed: 2500,
                attackRange: 150,
                color: '#55aa22',
                reward: 20,
                name: '喷吐僵尸',
                isRanged: true
            },
            boss: {
                health: 300,
                speed: 0.8,
                damage: 25,
                attackSpeed: 1500,
                color: '#880000',
                reward: 100,
                name: 'BOSS僵尸',
                radius: 30
            },
            // 新增更多僵尸类型
            crawler: {
                health: 15,
                speed: 2.5,
                damage: 3,
                attackSpeed: 600,
                color: '#336633',
                reward: 12,
                name: '爬行僵尸',
                radius: 12
            },
            giant: {
                health: 250,
                speed: 0.4,
                damage: 35,
                attackSpeed: 2000,
                color: '#442211',
                reward: 50,
                name: '巨型僵尸',
                radius: 40
            },
            exploder: {
                health: 40,
                speed: 1.5,
                damage: 50,
                attackSpeed: 5000, // 只能攻击一次（爆炸）
                color: '#ff6600',
                reward: 25,
                name: '爆炸僵尸',
                isExploder: true
            }
        };
        
        const stats = types[this.type] || types.normal;
        
        // 计算波次加成（每波增加属性）
        const waveBonus = this.getWaveBonus();
        
        // 应用基础属性 + 波次加成
        this.health = Math.floor(stats.health * waveBonus.health);
        this.maxHealth = this.health;
        this.speed = stats.speed * waveBonus.speed;
        this.baseSpeed = this.speed;
        this.damage = Math.floor(stats.damage * waveBonus.damage);
        this.attackSpeed = Math.max(300, stats.attackSpeed * waveBonus.attackSpeed); // 最小攻击间隔300ms
        this.attackRange = stats.attackRange || 40;
        this.color = stats.color;
        this.reward = Math.floor(stats.reward * waveBonus.reward);
        this.name = stats.name;
        this.isRanged = stats.isRanged || false;
        this.isExploder = stats.isExploder || false;
        
        if (stats.radius) {
            this.radius = stats.radius;
        }
    }

    // 获取波次加成
    getWaveBonus() {
        const wave = this.wave;
        
        // 第1波：基础属性
        // 每波增加一定百分比
        // 波次越高，增长越快
        
        let healthBonus, speedBonus, damageBonus, attackSpeedBonus, rewardBonus;
        
        if (wave <= 3) {
            // 前3波：非常简单，缓慢增长
            healthBonus = 1 + (wave - 1) * 0.1;      // 1.0, 1.1, 1.2
            speedBonus = 1 + (wave - 1) * 0.05;     // 1.0, 1.05, 1.1
            damageBonus = 1 + (wave - 1) * 0.1;     // 1.0, 1.1, 1.2
            attackSpeedBonus = 1 - (wave - 1) * 0.02; // 1.0, 0.98, 0.96 (更快)
            rewardBonus = 1 + (wave - 1) * 0.1;
        } else if (wave <= 7) {
            // 4-7波：中等难度
            healthBonus = 1.2 + (wave - 3) * 0.2;   // 1.4, 1.6, 1.8, 2.0
            speedBonus = 1.1 + (wave - 3) * 0.1;    // 1.2, 1.3, 1.4, 1.5
            damageBonus = 1.2 + (wave - 3) * 0.15;  // 1.35, 1.5, 1.65, 1.8
            attackSpeedBonus = 0.96 - (wave - 3) * 0.04; // 0.92, 0.88, 0.84, 0.8
            rewardBonus = 1.3 + (wave - 3) * 0.15;
        } else if (wave <= 15) {
            // 8-15波：困难
            healthBonus = 2.0 + (wave - 7) * 0.3;   // 2.3 ~ 4.4
            speedBonus = 1.5 + (wave - 7) * 0.1;    // 1.6 ~ 2.3
            damageBonus = 1.8 + (wave - 7) * 0.2;   // 2.0 ~ 3.4
            attackSpeedBonus = 0.8 - (wave - 7) * 0.03; // 0.77 ~ 0.56
            rewardBonus = 1.9 + (wave - 7) * 0.2;
        } else {
            // 16波以上：地狱难度
            healthBonus = 4.4 + (wave - 15) * 0.5;
            speedBonus = 2.3 + (wave - 15) * 0.1;
            damageBonus = 3.4 + (wave - 15) * 0.3;
            attackSpeedBonus = Math.max(0.3, 0.56 - (wave - 15) * 0.02);
            rewardBonus = 3.5 + (wave - 15) * 0.3;
        }
        
        return {
            health: healthBonus,
            speed: Math.min(speedBonus, 3), // 速度上限
            damage: damageBonus,
            attackSpeed: attackSpeedBonus,
            reward: rewardBonus
        };
    }

    // 更新僵尸状态
    update(deltaTime, player, doors) {
        if (!this.isAlive) return;
        
        // 更新眩晕状态
        if (this.stunned) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.stunned = false;
            }
            return;
        }
        
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // 更新AI
        this.updateAI(deltaTime, player);
        
        // 更新位置
        this.x += this.velocityX * this.speed;
        this.y += this.velocityY * this.speed;
        
        // 更新朝向
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.direction = Math.atan2(this.velocityY, this.velocityX);
        }
        
        // 更新动画
        this.animationTimer += deltaTime;
        if (this.animationTimer > 150) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
    }

    // AI更新
    updateAI(deltaTime, player) {
        // 更新路径
        this.pathUpdateTimer += deltaTime;
        if (this.pathUpdateTimer >= this.pathUpdateInterval) {
            this.pathUpdateTimer = 0;
            this.updatePath(player);
        }
        
        // 计算到玩家的距离
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
        
        // 根据距离决定行为
        if (distToPlayer <= this.attackRange + this.radius + player.radius) {
            this.aiState = 'attack';
            this.velocityX = 0;
            this.velocityY = 0;
        } else {
            this.aiState = 'chase';
            this.moveTowardsTarget(player.x, player.y);
        }
    }

    // 更新路径
    updatePath(player) {
        this.targetX = player.x;
        this.targetY = player.y;
    }

    // 向目标移动
    moveTowardsTarget(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.velocityX = dx / distance;
            this.velocityY = dy / distance;
        }
    }

    // 攻击
    attack(player) {
        if (this.attackCooldown > 0 || !this.isAlive) return null;
        
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
        
        if (distToPlayer <= this.attackRange + this.radius + player.radius) {
            this.attackCooldown = this.attackSpeed;
            this.isAttacking = true;
            
            setTimeout(() => {
                this.isAttacking = false;
            }, 200);
            
            // 远程攻击
            if (this.isRanged) {
                return {
                    type: 'ranged',
                    damage: this.damage,
                    x: this.x,
                    y: this.y,
                    targetX: player.x,
                    targetY: player.y
                };
            }
            
            // 近战攻击
            return {
                type: 'melee',
                damage: this.damage
            };
        }
        
        return null;
    }

    // 受到伤害
    takeDamage(amount, knockbackX = 0, knockbackY = 0) {
        this.health -= amount;
        
        // 击退效果
        if (knockbackX !== 0 || knockbackY !== 0) {
            this.x += knockbackX * 10;
            this.y += knockbackY * 10;
        }
        
        // 短暂眩晕
        this.stunned = true;
        this.stunnedTimer = 100;
        
        if (this.health <= 0) {
            this.die();
        }
        
        return this.health <= 0;
    }

    // 死亡
    die() {
        this.isAlive = false;
    }

    // 渲染僵尸
    render(ctx) {
        if (!this.isAlive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // 眩晕效果
        if (this.stunned) {
            ctx.globalAlpha = 0.7;
        }
        
        // 绘制身体
        ctx.fillStyle = this.isAttacking ? '#ff0000' : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制眼睛
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, -this.radius * 0.3, 4, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, this.radius * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss特殊效果
        if (this.type === 'boss') {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 绘制生命条
        this.renderHealthBar(ctx);
        
        // 眩晕图标
        if (this.stunned) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💫', this.x, this.y - this.radius - 20);
        }
    }

    // 渲染生命条
    renderHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 5;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 10;
        
        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    }

    // 获取碰撞盒
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
            radius: this.radius
        };
    }
}

// 僵尸生成器
class ZombieSpawner {
    constructor(game) {
        this.game = game;
        this.wave = 1;
        this.zombiesPerWave = 5;
        this.zombiesSpawned = 0;
        this.zombiesKilled = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // 每2秒生成一个
        this.waveDelay = 5000; // 波次间隔5秒
        this.waveDelayTimer = 0;
        this.isWaveActive = false;
    }

    // 开始新波次
    startWave() {
        this.isWaveActive = true;
        this.zombiesSpawned = 0;
        this.zombiesKilled = 0;
        
        // 根据波次计算僵尸数量（更平滑的增长）
        if (this.wave <= 3) {
            this.zombiesPerWave = 3 + this.wave; // 4, 5, 6
        } else if (this.wave <= 7) {
            this.zombiesPerWave = 6 + (this.wave - 3) * 2; // 8, 10, 12, 14
        } else if (this.wave <= 15) {
            this.zombiesPerWave = 14 + (this.wave - 7) * 3; // 17, 20, 23...
        } else {
            this.zombiesPerWave = 38 + (this.wave - 15) * 4; // 42, 46, 50...
        }
        
        // 生成间隔随波次减少
        this.spawnInterval = Math.max(400, 2500 - this.wave * 100);
        
        // 显示波次信息
        const difficulty = this.getDifficultyName();
        Utils.showToast(`第 ${this.wave} 波开始！(${difficulty})`, 'warning');
    }

    // 获取难度名称
    getDifficultyName() {
        if (this.wave <= 3) return '简单';
        if (this.wave <= 7) return '普通';
        if (this.wave <= 12) return '困难';
        if (this.wave <= 18) return '噩梦';
        return '地狱';
    }

    // 更新生成器
    update(deltaTime) {
        if (!this.isWaveActive) {
            // 波次间隔
            this.waveDelayTimer += deltaTime;
            if (this.waveDelayTimer >= this.waveDelay) {
                this.waveDelayTimer = 0;
                this.startWave();
            }
            return;
        }
        
        // 检查波次是否完成
        if (this.zombiesKilled >= this.zombiesPerWave) {
            this.endWave();
            return;
        }
        
        // 生成僵尸
        if (this.zombiesSpawned < this.zombiesPerWave) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnZombie();
            }
        }
    }

    // 生成僵尸 - 从地图边缘生成
    spawnZombie() {
        const mapWidth = this.game.mapWidth;
        const mapHeight = this.game.mapHeight;
        const margin = 50; // 距离边缘的距离
        
        // 随机选择一个边（0=上, 1=下, 2=左, 3=右）
        const edge = Utils.random(0, 3);
        let spawnX, spawnY;
        
        switch (edge) {
            case 0: // 上边
                spawnX = Utils.random(margin, mapWidth - margin);
                spawnY = margin;
                break;
            case 1: // 下边
                spawnX = Utils.random(margin, mapWidth - margin);
                spawnY = mapHeight - margin;
                break;
            case 2: // 左边
                spawnX = margin;
                spawnY = Utils.random(margin, mapHeight - margin);
                break;
            case 3: // 右边
                spawnX = mapWidth - margin;
                spawnY = Utils.random(margin, mapHeight - margin);
                break;
        }
        
        // 决定僵尸类型（根据波次）
        const type = this.getRandomZombieType();
        
        // 在地图边缘生成僵尸，传入当前波次
        const zombie = new Zombie(spawnX, spawnY, type, this.wave);
        this.game.addZombie(zombie);
        this.zombiesSpawned++;
    }

    // 获取随机僵尸类型（根据波次调整概率）
    getRandomZombieType() {
        const roll = Math.random() * 100;
        const wave = this.wave;
        
        // 第1-2波：只有普通僵尸
        if (wave <= 2) {
            return 'normal';
        }
        
        // 第3波：引入快速僵尸
        if (wave === 3) {
            if (roll < 20) return 'fast';
            return 'normal';
        }
        
        // 第4-5波：引入爬行僵尸
        if (wave <= 5) {
            if (roll < 10) return 'crawler';
            if (roll < 30) return 'fast';
            return 'normal';
        }
        
        // 第6-7波：引入喷吐僵尸
        if (wave <= 7) {
            if (roll < 10) return 'spitter';
            if (roll < 20) return 'crawler';
            if (roll < 40) return 'fast';
            return 'normal';
        }
        
        // 第8-10波：引入坦克僵尸
        if (wave <= 10) {
            if (roll < 8) return 'tank';
            if (roll < 18) return 'spitter';
            if (roll < 28) return 'crawler';
            if (roll < 45) return 'fast';
            return 'normal';
        }
        
        // 第11-14波：引入爆炸僵尸
        if (wave <= 14) {
            if (roll < 5) return 'exploder';
            if (roll < 15) return 'tank';
            if (roll < 25) return 'spitter';
            if (roll < 35) return 'crawler';
            if (roll < 50) return 'fast';
            return 'normal';
        }
        
        // 第15-19波：引入巨型僵尸
        if (wave <= 19) {
            if (roll < 5) return 'giant';
            if (roll < 12) return 'exploder';
            if (roll < 22) return 'tank';
            if (roll < 32) return 'spitter';
            if (roll < 42) return 'crawler';
            if (roll < 55) return 'fast';
            return 'normal';
        }
        
        // 第20波及以后：引入BOSS
        if (roll < 3) return 'boss';
        if (roll < 10) return 'giant';
        if (roll < 18) return 'exploder';
        if (roll < 28) return 'tank';
        if (roll < 38) return 'spitter';
        if (roll < 48) return 'crawler';
        if (roll < 60) return 'fast';
        return 'normal';
    }

    // 僵尸被击杀
    onZombieKilled() {
        this.zombiesKilled++;
    }

    // 结束波次
    endWave() {
        this.isWaveActive = false;
        this.wave++;
        
        // 波次奖励
        const reward = this.wave * 20;
        this.game.player.earnMoney(reward);
        
        Utils.showToast(`第 ${this.wave - 1} 波完成！奖励 ${reward} 金币`, 'success');
    }

    // 获取当前波次
    getWave() {
        return this.wave;
    }

    // 设置波次（用于加载存档）
    setWave(wave) {
        this.wave = wave;
    }

    // 强制进入下一波（开发者模式）
    forceNextWave() {
        // 清除当前波次的所有僵尸
        this.game.zombies.forEach(z => {
            z.isAlive = false;
        });
        this.game.zombies = [];
        
        // 结束当前波次并开始下一波
        this.isWaveActive = false;
        this.wave++;
        this.waveDelayTimer = this.waveDelay; // 立即开始下一波
    }

    // 获取进度
    getProgress() {
        return {
            wave: this.wave,
            spawned: this.zombiesSpawned,
            killed: this.zombiesKilled,
            total: this.zombiesPerWave,
            isActive: this.isWaveActive
        };
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Zombie, ZombieSpawner };
}