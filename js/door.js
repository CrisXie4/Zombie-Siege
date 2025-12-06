// 门系统模块

class Door {
    constructor(x, y, direction, config = {}) {
        // 位置
        this.x = x;
        this.y = y;
        this.direction = direction; // 'top', 'bottom', 'left', 'right'
        
        // 尺寸
        this.width = direction === 'top' || direction === 'bottom' ? 60 : 15;
        this.height = direction === 'top' || direction === 'bottom' ? 15 : 60;
        
        // 属性
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.isLocked = false;
        this.isBroken = false;
        this.level = config.level || 1;
        
        // 门的等级属性
        this.levelStats = {
            1: { maxHealth: 100, repairCost: 20, color: '#8b4513' },
            2: { maxHealth: 200, repairCost: 40, color: '#654321' },
            3: { maxHealth: 350, repairCost: 60, color: '#4a3520' },
            4: { maxHealth: 500, repairCost: 80, color: '#3d2914' },
            5: { maxHealth: 750, repairCost: 100, color: '#2d1f0f' }
        };
        
        // 应用等级属性
        this.applyLevelStats();
        
        // 动画
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        
        // 唯一ID
        this.id = Utils.generateId();
    }

    // 应用等级属性
    applyLevelStats() {
        const stats = this.levelStats[this.level] || this.levelStats[1];
        this.maxHealth = stats.maxHealth;
        this.health = Math.min(this.health, this.maxHealth);
        this.repairCost = stats.repairCost;
        this.color = stats.color;
    }

    // 升级门
    upgrade() {
        if (this.level >= 5) return false;
        this.level++;
        this.applyLevelStats();
        this.health = this.maxHealth;
        this.isBroken = false;
        return true;
    }

    // 获取升级费用
    getUpgradeCost() {
        const costs = {
            1: 100,  // 升级到2级
            2: 250,  // 升级到3级
            3: 500,  // 升级到4级
            4: 1000, // 升级到5级
            5: null  // 已满级
        };
        return costs[this.level];
    }

    // 锁门
    lock() {
        if (this.isBroken) return false;
        this.isLocked = true;
        return true;
    }

    // 开门
    unlock() {
        this.isLocked = false;
        return true;
    }

    // 切换锁定状态
    toggleLock() {
        if (this.isBroken) return false;
        this.isLocked = !this.isLocked;
        return true;
    }

    // 受到伤害
    takeDamage(amount) {
        if (this.isBroken) return;
        
        this.health -= amount;
        this.shakeTimer = 200;
        this.shakeIntensity = Math.min(amount / 10, 5);
        
        if (this.health <= 0) {
            this.health = 0;
            this.break();
        }
    }

    // 门被破坏
    break() {
        this.isBroken = true;
        this.isLocked = false;
    }

    // 修复门
    repair(amount = null) {
        if (amount === null) {
            // 完全修复
            this.health = this.maxHealth;
        } else {
            this.health = Math.min(this.maxHealth, this.health + amount);
        }
        
        if (this.health > 0) {
            this.isBroken = false;
        }
    }

    // 更新
    update(deltaTime) {
        // 更新震动效果
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
        }
    }

    // 渲染
    render(ctx) {
        ctx.save();
        
        // 震动效果
        let offsetX = 0, offsetY = 0;
        if (this.shakeTimer > 0) {
            offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        }
        
        ctx.translate(this.x + offsetX, this.y + offsetY);
        
        if (this.isBroken) {
            // 破损的门
            this.renderBrokenDoor(ctx);
        } else {
            // 正常的门
            this.renderNormalDoor(ctx);
        }
        
        ctx.restore();
        
        // 渲染生命条
        if (!this.isBroken) {
            this.renderHealthBar(ctx);
        }
        
        // 渲染锁定图标
        if (this.isLocked && !this.isBroken) {
            this.renderLockIcon(ctx);
        }
    }

    // 渲染正常门
    renderNormalDoor(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 门框
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 门把手
        ctx.fillStyle = '#ffd700';
        if (this.direction === 'top' || this.direction === 'bottom') {
            ctx.beginPath();
            ctx.arc(this.width / 4, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, this.height / 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 等级标识
        if (this.level > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Lv${this.level}`, 0, 0);
        }
    }

    // 渲染破损门
    renderBrokenDoor(ctx) {
        ctx.fillStyle = '#4a3520';
        ctx.globalAlpha = 0.5;
        
        // 绘制碎片
        const pieces = [
            { x: -this.width / 3, y: -this.height / 3, w: this.width / 3, h: this.height / 3, rot: 0.2 },
            { x: this.width / 4, y: -this.height / 4, w: this.width / 4, h: this.height / 3, rot: -0.3 },
            { x: -this.width / 4, y: this.height / 4, w: this.width / 3, h: this.height / 4, rot: 0.1 }
        ];
        
        pieces.forEach(piece => {
            ctx.save();
            ctx.rotate(piece.rot);
            ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
            ctx.restore();
        });
        
        ctx.globalAlpha = 1;
    }

    // 渲染生命条
    renderHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - (this.direction === 'top' || this.direction === 'bottom' ? 20 : this.height / 2 + 10);
        
        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    // 渲染锁定图标
    renderLockIcon(ctx) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', this.x, this.y - 30);
    }

    // 检查僵尸是否可以通过
    canZombiePass() {
        return this.isBroken || !this.isLocked;
    }

    // 获取碰撞盒
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // 获取生成点（僵尸从这里出现）
    getSpawnPoint() {
        const offset = 30;
        switch (this.direction) {
            case 'top':
                return { x: this.x, y: this.y - offset };
            case 'bottom':
                return { x: this.x, y: this.y + offset };
            case 'left':
                return { x: this.x - offset, y: this.y };
            case 'right':
                return { x: this.x + offset, y: this.y };
            default:
                return { x: this.x, y: this.y };
        }
    }

    // 序列化
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            direction: this.direction,
            health: this.health,
            maxHealth: this.maxHealth,
            isLocked: this.isLocked,
            isBroken: this.isBroken,
            level: this.level
        };
    }

    // 反序列化
    deserialize(data) {
        this.health = data.health;
        this.isLocked = data.isLocked;
        this.isBroken = data.isBroken;
        this.level = data.level || 1;
        this.applyLevelStats();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Door;
}