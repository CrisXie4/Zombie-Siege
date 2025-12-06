// 玩家类模块

class Player {
    constructor(x, y, gameWidth, gameHeight) {
        // 位置和尺寸
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.radius = 20;
        
        // 游戏边界
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // 属性
        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 100;
        this.maxHunger = 100;
        this.money = 100;
        
        // 移动
        this.speed = 3;
        this.baseSpeed = 3;
        this.velocityX = 0;
        this.velocityY = 0;
        this.direction = 0; // 朝向角度（弧度）
        
        // 战斗
        this.damage = 10;
        this.baseDamage = 10;
        this.defense = 0;
        this.baseDefense = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.lastAttackTime = 0;
        
        // 武器
        this.equippedWeapon = 'knife';
        this.currentAmmo = {};
        
        // 背包
        this.inventory = [
            { id: 'knife', type: 'weapon', quantity: 1 }
        ];
        this.maxInventorySize = 20;
        
        // Buff系统
        this.buffs = {};
        
        // 动画
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.isMoving = false;
        
        // 无敌时间（受伤后短暂无敌）
        this.invincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 500; // 0.5秒无敌
        
        // 颜色
        this.color = '#4488ff';
        this.attackColor = '#ff4444';
    }

    // 更新玩家状态
    update(deltaTime, roomBounds) {
        // 更新位置
        this.x += this.velocityX * this.speed;
        this.y += this.velocityY * this.speed;
        
        // 限制在房间内
        if (roomBounds) {
            this.x = Utils.clamp(this.x, roomBounds.x + this.radius, roomBounds.x + roomBounds.width - this.radius);
            this.y = Utils.clamp(this.y, roomBounds.y + this.radius, roomBounds.y + roomBounds.height - this.radius);
        }
        
        // 更新朝向
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.direction = Math.atan2(this.velocityY, this.velocityX);
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // 更新动画
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // 更新无敌时间
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        // 更新Buff
        this.updateBuffs(deltaTime);
        
        // 饥饿值随时间下降（每秒下降0.1点，约16分钟饿死）
        this.hunger -= deltaTime * 0.0001;
        this.hunger = Math.max(0, this.hunger);
        
        // 饥饿时扣血
        if (this.hunger <= 0) {
            this.health -= deltaTime * 0.005; // 每秒扣0.5血
        }
    }

    // 渲染玩家
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // 无敌时闪烁效果
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // 绘制身体
        ctx.fillStyle = this.isAttacking ? this.attackColor : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制方向指示器
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius - 10, -8);
        ctx.lineTo(this.radius - 10, 8);
        ctx.closePath();
        ctx.fill();
        
        // 绘制武器
        this.renderWeapon(ctx);
        
        ctx.restore();
        
        // 绘制生命条
        this.renderHealthBar(ctx);
    }

    // 渲染武器
    renderWeapon(ctx) {
        const weapon = Items.getWeapon(this.equippedWeapon);
        if (!weapon) return;
        
        ctx.fillStyle = '#888888';
        
        if (weapon.type === 'melee') {
            // 近战武器
            ctx.fillRect(this.radius - 5, -3, weapon.range * 0.5, 6);
        } else {
            // 远程武器
            ctx.fillRect(this.radius - 5, -4, 25, 8);
        }
    }

    // 渲染生命条
    renderHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 15;
        
        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 生命值
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    // 设置移动方向
    setVelocity(vx, vy) {
        // 归一化速度
        const length = Math.sqrt(vx * vx + vy * vy);
        if (length > 0) {
            this.velocityX = vx / length;
            this.velocityY = vy / length;
        } else {
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }

    // 停止移动
    stop() {
        this.velocityX = 0;
        this.velocityY = 0;
    }

    // 攻击
    attack() {
        if (this.attackCooldown > 0) return null;
        
        const weapon = Items.getWeapon(this.equippedWeapon);
        if (!weapon) return null;
        
        // 检查弹药（远程武器）
        if (weapon.type === 'ranged') {
            const ammoCount = this.getAmmoCount(weapon.ammoType);
            if (ammoCount <= 0) {
                Utils.showToast('弹药不足！', 'warning');
                return null;
            }
            this.useAmmo(weapon.ammoType, 1);
        }
        
        this.isAttacking = true;
        this.attackCooldown = weapon.attackSpeed;
        this.lastAttackTime = Date.now();
        
        // 计算实际伤害
        const damageMultiplier = this.buffs.damage ? this.buffs.damage.value : 1;
        const actualDamage = weapon.damage * damageMultiplier;
        
        // 创建攻击数据
        const attackData = {
            x: this.x,
            y: this.y,
            direction: this.direction,
            damage: actualDamage,
            range: weapon.range,
            type: weapon.type,
            weapon: weapon
        };
        
        // 远程武器创建子弹
        if (weapon.type === 'ranged') {
            attackData.bullets = this.createBullets(weapon);
        }
        
        // 短暂显示攻击状态
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);
        
        Utils.vibrate(30);
        
        return attackData;
    }

    // 创建子弹
    createBullets(weapon) {
        const bullets = [];
        const pellets = weapon.pellets || 1;
        const spread = weapon.spread || 0;
        
        for (let i = 0; i < pellets; i++) {
            let angle = this.direction;
            if (spread > 0) {
                angle += Utils.degToRad(Utils.randomFloat(-spread / 2, spread / 2));
            }
            
            bullets.push({
                x: this.x + Math.cos(this.direction) * this.radius,
                y: this.y + Math.sin(this.direction) * this.radius,
                velocityX: Math.cos(angle) * 10,
                velocityY: Math.sin(angle) * 10,
                damage: weapon.damage / pellets,
                range: weapon.range,
                traveled: 0
            });
        }
        
        return bullets;
    }

    // 受到伤害
    takeDamage(amount) {
        if (this.invincible) return 0;
        
        // 计算防御减伤
        const defenseBonus = this.buffs.defense ? this.buffs.defense.value : 0;
        const actualDefense = this.baseDefense + defenseBonus;
        const actualDamage = Math.max(1, amount - actualDefense);
        
        this.health -= actualDamage;
        this.health = Math.max(0, this.health);
        
        // 触发无敌时间
        this.invincible = true;
        this.invincibleTimer = this.invincibleDuration;
        
        Utils.vibrate([50, 50, 50]);
        
        return actualDamage;
    }

    // 治疗
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth;
    }

    // 恢复饥饿值
    feed(amount) {
        const oldHunger = this.hunger;
        this.hunger = Math.min(this.maxHunger, this.hunger + amount);
        return this.hunger - oldHunger;
    }

    // 获得金钱
    earnMoney(amount) {
        this.money += amount;
    }

    // 花费金钱
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    // 装备武器
    equipWeapon(weaponId) {
        const weapon = Items.getWeapon(weaponId);
        if (!weapon) return false;
        
        // 检查是否拥有该武器
        const hasWeapon = this.inventory.some(item => item.id === weaponId && item.type === 'weapon');
        if (!hasWeapon) return false;
        
        this.equippedWeapon = weaponId;
        return true;
    }

    // 添加物品到背包
    addItem(itemId, quantity = 1) {
        const item = Items.getItem(itemId);
        if (!item) return false;
        
        // 查找现有物品
        const existingItem = this.inventory.find(i => i.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            if (this.inventory.length >= this.maxInventorySize) {
                Utils.showToast('背包已满！', 'warning');
                return false;
            }
            this.inventory.push({
                id: itemId,
                type: item.type,
                quantity: quantity
            });
        }
        
        return true;
    }

    // 移除物品
    removeItem(itemId, quantity = 1) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index === -1) return false;
        
        this.inventory[index].quantity -= quantity;
        
        if (this.inventory[index].quantity <= 0) {
            // 不要移除基础武器
            if (itemId !== 'knife') {
                this.inventory.splice(index, 1);
            } else {
                this.inventory[index].quantity = 1;
            }
        }
        
        return true;
    }

    // 使用物品
    useItem(itemId) {
        const inventoryItem = this.inventory.find(i => i.id === itemId);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            return { success: false, message: '物品不足' };
        }
        
        const result = Items.useItem(itemId, this);
        
        if (result.success) {
            this.removeItem(itemId, 1);
            Utils.showToast(result.message, 'success');
        }
        
        return result;
    }

    // 获取弹药数量
    getAmmoCount(ammoType) {
        const ammoItem = this.inventory.find(i => i.id === ammoType);
        return ammoItem ? ammoItem.quantity : 0;
    }

    // 使用弹药
    useAmmo(ammoType, amount) {
        return this.removeItem(ammoType, amount);
    }

    // 添加Buff
    addBuff(type, value, duration) {
        this.buffs[type] = {
            value: value,
            duration: duration,
            startTime: Date.now()
        };
        
        // 应用Buff效果
        if (type === 'speed') {
            this.speed = this.baseSpeed * value;
        }
    }

    // 移除Buff
    removeBuff(type) {
        if (this.buffs[type]) {
            delete this.buffs[type];
            
            // 恢复原始值
            if (type === 'speed') {
                this.speed = this.baseSpeed;
            }
        }
    }

    // 更新Buff
    updateBuffs(deltaTime) {
        const now = Date.now();
        
        for (const type in this.buffs) {
            const buff = this.buffs[type];
            if (now - buff.startTime >= buff.duration) {
                this.removeBuff(type);
            }
        }
    }

    // 检查是否死亡
    isDead() {
        return this.health <= 0;
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

    // 获取攻击范围
    getAttackBounds() {
        const weapon = Items.getWeapon(this.equippedWeapon);
        if (!weapon) return null;
        
        const range = weapon.range;
        const attackX = this.x + Math.cos(this.direction) * (this.radius + range / 2);
        const attackY = this.y + Math.sin(this.direction) * (this.radius + range / 2);
        
        return {
            x: attackX,
            y: attackY,
            radius: range / 2,
            width: range,
            height: range
        };
    }

    // 序列化（用于保存）
    serialize() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            hunger: this.hunger,
            maxHunger: this.maxHunger,
            money: this.money,
            speed: this.baseSpeed,
            damage: this.baseDamage,
            defense: this.baseDefense,
            equippedWeapon: this.equippedWeapon,
            inventory: this.inventory.map(item => ({
                id: item.id,
                type: item.type,
                quantity: item.quantity
            }))
        };
    }

    // 反序列化（用于加载）
    deserialize(data) {
        this.x = data.x || this.x;
        this.y = data.y || this.y;
        this.health = data.health || this.health;
        this.maxHealth = data.maxHealth || this.maxHealth;
        this.hunger = data.hunger || this.hunger;
        this.maxHunger = data.maxHunger || this.maxHunger;
        this.money = data.money || this.money;
        this.baseSpeed = data.speed || this.baseSpeed;
        this.speed = this.baseSpeed;
        this.baseDamage = data.damage || this.baseDamage;
        this.baseDefense = data.defense || this.baseDefense;
        this.equippedWeapon = data.equippedWeapon || this.equippedWeapon;
        
        if (data.inventory) {
            this.inventory = data.inventory.map(item => ({
                id: item.id,
                type: item.type,
                quantity: item.quantity
            }));
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}