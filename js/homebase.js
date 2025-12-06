// 玩家家园系统模块 - 地图上的一块区域作为玩家的家

class HomeBase {
    constructor(config = {}) {
        // 家园位置和大小（在地图上的一块区域）
        this.x = config.x || 800;
        this.y = config.y || 800;
        this.width = config.width || 400;
        this.height = config.height || 400;
        
        // 家园等级
        this.level = config.level || 1;
        
        // 等级属性
        this.levelStats = {
            1: { maxStorage: 10, color: '#4a3728', borderColor: '#6b4423', name: '简陋小屋' },
            2: { maxStorage: 20, color: '#5a4738', borderColor: '#7b5433', name: '木质房屋' },
            3: { maxStorage: 35, color: '#6a5748', borderColor: '#8b6443', name: '石质房屋' },
            4: { maxStorage: 50, color: '#7a6758', borderColor: '#9b7453', name: '坚固堡垒' },
            5: { maxStorage: 80, color: '#8a7768', borderColor: '#ab8463', name: '豪华庄园' }
        };
        
        // 存储箱
        this.storageBox = {
            x: this.x + this.width / 2 - 30,
            y: this.y + 50,
            width: 60,
            height: 50,
            items: []
        };
        
        // 最大存储槽位
        this.maxStorageSlots = this.getMaxStorageSlots();
        
        // 床（重生点）
        this.bed = {
            x: this.x + this.width - 80,
            y: this.y + this.height - 100,
            width: 60,
            height: 80
        };
        
        // 工作台
        this.workbench = {
            x: this.x + 30,
            y: this.y + this.height - 80,
            width: 50,
            height: 50
        };
        
        // 围墙/边界
        this.wallThickness = 15;
        this.wallHealth = 100;
        this.maxWallHealth = 100;
        
        // 家园门（可锁定）
        this.door = {
            x: this.x + this.width / 2 - 40,
            y: this.y + this.height - this.wallThickness,
            width: 80,
            height: this.wallThickness,
            isLocked: true,  // 默认锁定
            isBroken: false,
            health: 100,
            maxHealth: 100,
            level: 1
        };
        
        // 唯一ID
        this.id = Utils.generateId();
    }

    // 获取最大存储槽位
    getMaxStorageSlots() {
        const stats = this.levelStats[this.level] || this.levelStats[1];
        return stats.maxStorage;
    }

    // 获取当前等级信息
    getLevelStats() {
        return this.levelStats[this.level] || this.levelStats[1];
    }

    // 升级家园
    upgrade() {
        if (this.level >= 5) return false;
        this.level++;
        this.maxStorageSlots = this.getMaxStorageSlots();
        // 升级时恢复围墙
        this.wallHealth = this.maxWallHealth;
        return true;
    }

    // 获取升级费用
    getUpgradeCost() {
        const costs = {
            1: 300,   // 升级到2级
            2: 600,   // 升级到3级
            3: 1200,  // 升级到4级
            4: 2500,  // 升级到5级
            5: null   // 已满级
        };
        return costs[this.level];
    }

    // 存入物品到存储箱
    storeItem(itemId, quantity = 1) {
        // 查找现有物品
        const existingItem = this.storageBox.items.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            return true;
        }
        
        // 检查存储空间
        if (this.storageBox.items.length >= this.maxStorageSlots) {
            return false;
        }
        
        // 添加新物品
        this.storageBox.items.push({
            id: itemId,
            quantity: quantity
        });
        
        return true;
    }

    // 从存储箱取出物品
    retrieveItem(itemId, quantity = 1) {
        const index = this.storageBox.items.findIndex(item => item.id === itemId);
        if (index === -1) return null;
        
        const item = this.storageBox.items[index];
        const actualQuantity = Math.min(quantity, item.quantity);
        
        item.quantity -= actualQuantity;
        
        if (item.quantity <= 0) {
            this.storageBox.items.splice(index, 1);
        }
        
        return { id: itemId, quantity: actualQuantity };
    }

    // 获取存储的物品数量
    getStoredQuantity(itemId) {
        const item = this.storageBox.items.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    }

    // 获取所有存储物品
    getStorageItems() {
        return this.storageBox.items.map(item => ({
            ...item,
            itemData: Items.getItem(item.id)
        }));
    }

    // 检查点是否在家园内
    isPointInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    // 检查点是否在存储箱附近（可交互范围）
    isNearStorageBox(px, py, range = 60) {
        const boxCenterX = this.storageBox.x + this.storageBox.width / 2;
        const boxCenterY = this.storageBox.y + this.storageBox.height / 2;
        const dist = Utils.distance(px, py, boxCenterX, boxCenterY);
        return dist < range;
    }

    // 检查点是否在床附近
    isNearBed(px, py, range = 50) {
        const bedCenterX = this.bed.x + this.bed.width / 2;
        const bedCenterY = this.bed.y + this.bed.height / 2;
        const dist = Utils.distance(px, py, bedCenterX, bedCenterY);
        return dist < range;
    }

    // 检查点是否在工作台附近
    isNearWorkbench(px, py, range = 50) {
        const wbCenterX = this.workbench.x + this.workbench.width / 2;
        const wbCenterY = this.workbench.y + this.workbench.height / 2;
        const dist = Utils.distance(px, py, wbCenterX, wbCenterY);
        return dist < range;
    }

    // 围墙受到伤害
    damageWall(amount) {
        this.wallHealth -= amount;
        if (this.wallHealth < 0) this.wallHealth = 0;
    }

    // 修复围墙
    repairWall(amount) {
        this.wallHealth = Math.min(this.maxWallHealth, this.wallHealth + amount);
    }

    // ==================== 门相关方法 ====================
    
    // 锁定门
    lockDoor() {
        if (!this.door.isBroken) {
            this.door.isLocked = true;
            return true;
        }
        return false;
    }

    // 解锁门
    unlockDoor() {
        this.door.isLocked = false;
        return true;
    }

    // 切换门锁状态
    toggleDoorLock() {
        if (this.door.isBroken) return false;
        this.door.isLocked = !this.door.isLocked;
        return true;
    }

    // 门受到伤害
    damageDoor(amount) {
        if (this.door.isBroken) return;
        
        this.door.health -= amount;
        if (this.door.health <= 0) {
            this.door.health = 0;
            this.door.isBroken = true;
            this.door.isLocked = false;
        }
    }

    // 修复门
    repairDoor(amount = 50) {
        this.door.health = Math.min(this.door.maxHealth, this.door.health + amount);
        if (this.door.health > 0) {
            this.door.isBroken = false;
        }
    }

    // 升级门
    upgradeDoor() {
        if (this.door.level >= 5) return false;
        this.door.level++;
        this.door.maxHealth = 100 + (this.door.level - 1) * 50;
        this.door.health = this.door.maxHealth;
        this.door.isBroken = false;
        return true;
    }

    // 检查僵尸是否可以通过门
    canZombiePassDoor() {
        return this.door.isBroken || !this.door.isLocked;
    }

    // 检查点是否在门附近
    isNearDoor(px, py, range = 60) {
        const doorCenterX = this.door.x + this.door.width / 2;
        const doorCenterY = this.door.y + this.door.height / 2;
        const dist = Utils.distance(px, py, doorCenterX, doorCenterY);
        return dist < range;
    }

    // 检查点是否在门的范围内
    isInDoorArea(px, py, radius = 0) {
        const door = this.door;
        return px + radius > door.x && px - radius < door.x + door.width &&
               py + radius > door.y && py - radius < door.y + door.height;
    }

    // 检查僵尸是否与围墙碰撞，返回修正后的位置
    // 如果僵尸可以通过（门开着或损坏），则不阻挡
    checkZombieCollision(zombieX, zombieY, zombieRadius, oldX, oldY) {
        // 如果围墙已被摧毁，不阻挡
        if (this.wallHealth <= 0) {
            return { x: zombieX, y: zombieY, blocked: false };
        }
        
        // 检查僵尸是否已经在家园内部
        const wasInside = this.isPointInside(oldX, oldY);
        const isInside = this.isPointInside(zombieX, zombieY);
        
        // 如果僵尸已经在内部，允许自由移动
        if (wasInside) {
            return { x: zombieX, y: zombieY, blocked: false };
        }
        
        // 如果僵尸试图进入家园
        if (!wasInside && isInside) {
            // 检查是否通过门进入
            if (this.isInDoorArea(zombieX, zombieY, zombieRadius)) {
                // 如果门可以通过，允许进入
                if (this.canZombiePassDoor()) {
                    return { x: zombieX, y: zombieY, blocked: false };
                }
            }
            
            // 否则阻挡僵尸，将其推回到围墙外
            return this.pushOutOfWalls(zombieX, zombieY, zombieRadius, oldX, oldY);
        }
        
        // 检查僵尸是否与围墙碰撞（从外部接近）
        const collision = this.checkWallCollision(zombieX, zombieY, zombieRadius);
        if (collision.collided) {
            // 如果碰撞点在门的位置且门可以通过
            if (collision.nearDoor && this.canZombiePassDoor()) {
                return { x: zombieX, y: zombieY, blocked: false };
            }
            // 否则阻挡
            return { x: oldX, y: oldY, blocked: true };
        }
        
        return { x: zombieX, y: zombieY, blocked: false };
    }

    // 检查与围墙的碰撞
    checkWallCollision(px, py, radius) {
        const wall = this.wallThickness;
        const home = this;
        
        // 检查是否靠近门
        const nearDoor = this.isInDoorArea(px, py, radius + 10);
        
        // 上墙碰撞
        if (py - radius < home.y + wall && py + radius > home.y &&
            px + radius > home.x && px - radius < home.x + home.width) {
            return { collided: true, side: 'top', nearDoor: false };
        }
        
        // 下墙碰撞（排除门的位置）
        if (py + radius > home.y + home.height - wall && py - radius < home.y + home.height &&
            px + radius > home.x && px - radius < home.x + home.width) {
            // 检查是否在门的位置
            if (nearDoor) {
                return { collided: true, side: 'bottom', nearDoor: true };
            }
            return { collided: true, side: 'bottom', nearDoor: false };
        }
        
        // 左墙碰撞
        if (px - radius < home.x + wall && px + radius > home.x &&
            py + radius > home.y && py - radius < home.y + home.height) {
            return { collided: true, side: 'left', nearDoor: false };
        }
        
        // 右墙碰撞
        if (px + radius > home.x + home.width - wall && px - radius < home.x + home.width &&
            py + radius > home.y && py - radius < home.y + home.height) {
            return { collided: true, side: 'right', nearDoor: false };
        }
        
        return { collided: false, side: null, nearDoor: false };
    }

    // 将僵尸推出围墙
    pushOutOfWalls(zombieX, zombieY, zombieRadius, oldX, oldY) {
        const home = this;
        const wall = this.wallThickness;
        
        let newX = zombieX;
        let newY = zombieY;
        
        // 计算到各边的距离，找到最近的边并推出
        const distToTop = zombieY - (home.y + wall);
        const distToBottom = (home.y + home.height - wall) - zombieY;
        const distToLeft = zombieX - (home.x + wall);
        const distToRight = (home.x + home.width - wall) - zombieX;
        
        const minDist = Math.min(
            Math.abs(distToTop),
            Math.abs(distToBottom),
            Math.abs(distToLeft),
            Math.abs(distToRight)
        );
        
        // 推到最近的边外
        if (Math.abs(distToTop) === minDist) {
            newY = home.y - zombieRadius - 1;
        } else if (Math.abs(distToBottom) === minDist) {
            newY = home.y + home.height + zombieRadius + 1;
        } else if (Math.abs(distToLeft) === minDist) {
            newX = home.x - zombieRadius - 1;
        } else {
            newX = home.x + home.width + zombieRadius + 1;
        }
        
        return { x: newX, y: newY, blocked: true };
    }

    // 更新
    update(deltaTime) {
        // 可以添加一些动态效果
    }

    // 渲染家园
    render(ctx) {
        const stats = this.getLevelStats();
        
        // 绘制地面（家园区域）
        ctx.fillStyle = stats.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制地面纹理（木地板效果）
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        const plankWidth = 40;
        for (let x = this.x; x < this.x + this.width; x += plankWidth) {
            ctx.beginPath();
            ctx.moveTo(x, this.y);
            ctx.lineTo(x, this.y + this.height);
            ctx.stroke();
        }
        
        // 绘制围墙
        this.renderWalls(ctx, stats);
        
        // 绘制门
        this.renderDoor(ctx);
        
        // 绘制存储箱
        this.renderStorageBox(ctx);
        
        // 绘制床
        this.renderBed(ctx);
        
        // 绘制工作台
        this.renderWorkbench(ctx);
        
        // 绘制家园名称和等级
        this.renderLabel(ctx, stats);
    }

    // 渲染围墙
    renderWalls(ctx, stats) {
        const healthPercent = this.wallHealth / this.maxWallHealth;
        
        // 根据血量调整颜色
        let wallColor = stats.borderColor;
        if (healthPercent < 0.3) {
            wallColor = '#8b0000'; // 深红色表示快损坏
        } else if (healthPercent < 0.6) {
            wallColor = '#b8860b'; // 暗金色表示受损
        }
        
        ctx.fillStyle = wallColor;
        
        // 上墙
        ctx.fillRect(this.x, this.y, this.width, this.wallThickness);
        // 下墙（留出门的位置）
        ctx.fillRect(this.x, this.y + this.height - this.wallThickness,
                     this.door.x - this.x, this.wallThickness);
        ctx.fillRect(this.door.x + this.door.width, this.y + this.height - this.wallThickness,
                     this.x + this.width - this.door.x - this.door.width, this.wallThickness);
        // 左墙
        ctx.fillRect(this.x, this.y, this.wallThickness, this.height);
        // 右墙
        ctx.fillRect(this.x + this.width - this.wallThickness, this.y, this.wallThickness, this.height);
        
        // 绘制围墙血量条
        if (this.wallHealth < this.maxWallHealth) {
            const barWidth = 100;
            const barHeight = 8;
            const barX = this.x + this.width / 2 - barWidth / 2;
            const barY = this.y - 20;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }

    // 渲染门
    renderDoor(ctx) {
        const door = this.door;
        const healthPercent = door.health / door.maxHealth;
        
        // 门框
        ctx.fillStyle = '#5d4e37';
        ctx.fillRect(door.x - 5, door.y - 5, door.width + 10, door.height + 10);
        
        if (door.isBroken) {
            // 损坏的门 - 显示碎片
            ctx.fillStyle = '#3d2e17';
            ctx.fillRect(door.x, door.y, door.width * 0.3, door.height);
            ctx.fillRect(door.x + door.width * 0.7, door.y, door.width * 0.3, door.height);
            
            // 损坏标记
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✖ 损坏', door.x + door.width / 2, door.y + door.height + 20);
        } else if (door.isLocked) {
            // 锁定的门 - 实心门
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            // 门的纹理
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(door.x + 5, door.y + 2, door.width - 10, door.height - 4);
            
            // 锁图标
            ctx.fillStyle = '#ffd700';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', door.x + door.width / 2, door.y + door.height / 2);
            
            // 状态文字
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('已锁定', door.x + door.width / 2, door.y + door.height + 18);
        } else {
            // 未锁定的门 - 打开状态
            ctx.fillStyle = '#5d4e37';
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            // 开门图标
            ctx.fillStyle = '#aaa';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚪', door.x + door.width / 2, door.y + door.height / 2);
            
            // 状态文字
            ctx.fillStyle = '#ff9800';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('未锁定', door.x + door.width / 2, door.y + door.height + 18);
        }
        
        // 门血量条（如果受损）
        if (door.health < door.maxHealth && !door.isBroken) {
            const barWidth = door.width;
            const barHeight = 5;
            const barX = door.x;
            const barY = door.y - 12;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
        
        // 门等级
        if (door.level > 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(door.x + door.width - 25, door.y - 20, 25, 15);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Lv${door.level}`, door.x + door.width - 12, door.y - 12);
        }
    }

    // 渲染存储箱
    renderStorageBox(ctx) {
        const box = this.storageBox;
        
        // 箱子主体
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(box.x, box.y, box.width, box.height);
        
        // 箱子边框
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // 箱子锁扣
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(box.x + box.width / 2 - 8, box.y + box.height / 2 - 5, 16, 10);
        
        // 箱子图标
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', box.x + box.width / 2, box.y + box.height / 2 + 2);
        
        // 物品数量
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${this.storageBox.items.length}/${this.maxStorageSlots}`, 
                     box.x + box.width / 2, box.y + box.height + 15);
        
        // 交互提示
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText('存储箱', box.x + box.width / 2, box.y - 8);
    }

    // 渲染床
    renderBed(ctx) {
        const bed = this.bed;
        
        // 床架
        ctx.fillStyle = '#654321';
        ctx.fillRect(bed.x, bed.y, bed.width, bed.height);
        
        // 床垫
        ctx.fillStyle = '#4169e1';
        ctx.fillRect(bed.x + 5, bed.y + 5, bed.width - 10, bed.height - 15);
        
        // 枕头
        ctx.fillStyle = '#fff';
        ctx.fillRect(bed.x + 10, bed.y + 10, bed.width - 20, 20);
        
        // 床图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛏️', bed.x + bed.width / 2, bed.y + bed.height / 2 + 5);
        
        // 标签
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText('重生点', bed.x + bed.width / 2, bed.y - 8);
    }

    // 渲染工作台
    renderWorkbench(ctx) {
        const wb = this.workbench;
        
        // 工作台主体
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(wb.x, wb.y, wb.width, wb.height);
        
        // 工作台边框
        ctx.strokeStyle = '#5d4e37';
        ctx.lineWidth = 2;
        ctx.strokeRect(wb.x, wb.y, wb.width, wb.height);
        
        // 工作台图标
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔧', wb.x + wb.width / 2, wb.y + wb.height / 2);
        
        // 标签
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText('工作台', wb.x + wb.width / 2, wb.y - 8);
    }

    // 渲染标签
    renderLabel(ctx, stats) {
        // 家园名称背景
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.x + this.width / 2 - 60, this.y + this.wallThickness + 5, 120, 25);
        
        // 家园名称
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🏠 ${stats.name} Lv.${this.level}`, this.x + this.width / 2, this.y + this.wallThickness + 17);
    }

    // 获取边界
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    // 获取重生点位置
    getSpawnPoint() {
        return {
            x: this.bed.x + this.bed.width / 2,
            y: this.bed.y + this.bed.height / 2
        };
    }

    // 序列化
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            level: this.level,
            wallHealth: this.wallHealth,
            door: {
                isLocked: this.door.isLocked,
                isBroken: this.door.isBroken,
                health: this.door.health,
                maxHealth: this.door.maxHealth,
                level: this.door.level
            },
            storage: this.storageBox.items.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
        };
    }

    // 反序列化
    deserialize(data) {
        if (data.x !== undefined) this.x = data.x;
        if (data.y !== undefined) this.y = data.y;
        if (data.width !== undefined) this.width = data.width;
        if (data.height !== undefined) this.height = data.height;
        this.level = data.level || 1;
        this.wallHealth = data.wallHealth || this.maxWallHealth;
        this.maxStorageSlots = this.getMaxStorageSlots();
        
        // 更新存储箱位置
        this.storageBox.x = this.x + this.width / 2 - 30;
        this.storageBox.y = this.y + 50;
        
        // 更新床位置
        this.bed.x = this.x + this.width - 80;
        this.bed.y = this.y + this.height - 100;
        
        // 更新工作台位置
        this.workbench.x = this.x + 30;
        this.workbench.y = this.y + this.height - 80;
        
        // 更新门位置
        this.door.x = this.x + this.width / 2 - 40;
        this.door.y = this.y + this.height - this.wallThickness;
        
        // 加载门数据
        if (data.door) {
            this.door.isLocked = data.door.isLocked !== undefined ? data.door.isLocked : true;
            this.door.isBroken = data.door.isBroken || false;
            this.door.health = data.door.health || 100;
            this.door.maxHealth = data.door.maxHealth || 100;
            this.door.level = data.door.level || 1;
        }
        
        if (data.storage) {
            this.storageBox.items = data.storage.map(item => ({
                id: item.id,
                quantity: item.quantity
            }));
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomeBase;
}