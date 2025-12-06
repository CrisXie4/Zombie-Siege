// 房屋系统模块

class House {
    constructor(config = {}) {
        // 房屋位置和大小
        this.x = config.x || 50;
        this.y = config.y || 50;
        this.width = config.width || 700;
        this.height = config.height || 500;
        this.wallThickness = 20;
        
        // 房屋等级
        this.level = config.level || 1;
        
        // 房屋升级属性 - 必须在getMaxStorageSlots之前定义
        this.levelStats = {
            1: { maxStorage: 10, wallColor: '#4a4a4a', floorColor: '#2d2d2d' },
            2: { maxStorage: 15, wallColor: '#5a5a5a', floorColor: '#3d3d3d' },
            3: { maxStorage: 20, wallColor: '#6a6a6a', floorColor: '#4d4d4d' },
            4: { maxStorage: 30, wallColor: '#7a7a7a', floorColor: '#5d5d5d' },
            5: { maxStorage: 50, wallColor: '#8a8a8a', floorColor: '#6d6d6d' }
        };
        
        // 门
        this.doors = {};
        this.initDoors();
        
        // 存储系统
        this.storage = [];
        this.maxStorageSlots = this.getMaxStorageSlots();
        
        // 家具/装饰
        this.furniture = [];
        
        // 唯一ID
        this.id = Utils.generateId();
    }

    // 初始化门
    initDoors() {
        this.doors = {
            top: new Door(this.x + this.width / 2, this.y, 'top'),
            bottom: new Door(this.x + this.width / 2, this.y + this.height, 'bottom'),
            left: new Door(this.x, this.y + this.height / 2, 'left'),
            right: new Door(this.x + this.width, this.y + this.height / 2, 'right')
        };
    }

    // 获取最大存储槽位
    getMaxStorageSlots() {
        const stats = this.levelStats[this.level] || this.levelStats[1];
        return stats.maxStorage;
    }

    // 升级房屋
    upgrade() {
        if (this.level >= 5) return false;
        this.level++;
        this.maxStorageSlots = this.getMaxStorageSlots();
        return true;
    }

    // 获取升级费用
    getUpgradeCost() {
        const costs = {
            1: 500,   // 升级到2级
            2: 1000,  // 升级到3级
            3: 2000,  // 升级到4级
            4: 5000,  // 升级到5级
            5: null   // 已满级
        };
        return costs[this.level];
    }

    // 存入物品
    storeItem(itemId, quantity = 1) {
        // 查找现有物品
        const existingItem = this.storage.find(item => item.id === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            return true;
        }
        
        // 检查存储空间
        if (this.storage.length >= this.maxStorageSlots) {
            return false;
        }
        
        // 添加新物品
        this.storage.push({
            id: itemId,
            quantity: quantity
        });
        
        return true;
    }

    // 取出物品
    retrieveItem(itemId, quantity = 1) {
        const index = this.storage.findIndex(item => item.id === itemId);
        if (index === -1) return null;
        
        const item = this.storage[index];
        const actualQuantity = Math.min(quantity, item.quantity);
        
        item.quantity -= actualQuantity;
        
        if (item.quantity <= 0) {
            this.storage.splice(index, 1);
        }
        
        return { id: itemId, quantity: actualQuantity };
    }

    // 获取存储的物品数量
    getStoredQuantity(itemId) {
        const item = this.storage.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    }

    // 获取所有存储物品
    getStorageItems() {
        return this.storage.map(item => ({
            ...item,
            itemData: Items.getItem(item.id)
        }));
    }

    // 锁定所有门
    lockAllDoors() {
        Object.values(this.doors).forEach(door => door.lock());
    }

    // 解锁所有门
    unlockAllDoors() {
        Object.values(this.doors).forEach(door => door.unlock());
    }

    // 修复所有门
    repairAllDoors() {
        let totalCost = 0;
        Object.values(this.doors).forEach(door => {
            if (door.health < door.maxHealth) {
                totalCost += door.repairCost;
            }
        });
        return totalCost;
    }

    // 执行修复所有门
    doRepairAllDoors() {
        Object.values(this.doors).forEach(door => door.repair());
    }

    // 获取门
    getDoor(direction) {
        return this.doors[direction] || null;
    }

    // 获取所有门的生成点
    getSpawnPoints() {
        return Object.values(this.doors)
            .filter(door => door.canZombiePass())
            .map(door => door.getSpawnPoint());
    }

    // 获取可通过的门
    getOpenDoors() {
        return Object.values(this.doors).filter(door => door.canZombiePass());
    }

    // 更新
    update(deltaTime) {
        Object.values(this.doors).forEach(door => door.update(deltaTime));
    }

    // 渲染
    render(ctx) {
        const stats = this.levelStats[this.level] || this.levelStats[1];
        
        // 绘制地板
        ctx.fillStyle = stats.floorColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 绘制地板纹理
        ctx.strokeStyle = '#3d3d3d';
        ctx.lineWidth = 1;
        const tileSize = 50;
        for (let x = this.x; x < this.x + this.width; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, this.y);
            ctx.lineTo(x, this.y + this.height);
            ctx.stroke();
        }
        for (let y = this.y; y < this.y + this.height; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.stroke();
        }
        
        // 绘制墙壁
        ctx.fillStyle = stats.wallColor;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        
        // 上墙
        ctx.fillRect(this.x - this.wallThickness, this.y - this.wallThickness, 
                     this.width + this.wallThickness * 2, this.wallThickness);
        // 下墙
        ctx.fillRect(this.x - this.wallThickness, this.y + this.height, 
                     this.width + this.wallThickness * 2, this.wallThickness);
        // 左墙
        ctx.fillRect(this.x - this.wallThickness, this.y, 
                     this.wallThickness, this.height);
        // 右墙
        ctx.fillRect(this.x + this.width, this.y, 
                     this.wallThickness, this.height);
        
        // 绘制门
        Object.values(this.doors).forEach(door => door.render(ctx));
        
        // 绘制存储箱图标（如果有存储物品）
        if (this.storage.length > 0) {
            this.renderStorageIndicator(ctx);
        }
        
        // 绘制房屋等级
        this.renderHouseLevel(ctx);
    }

    // 渲染存储指示器
    renderStorageIndicator(ctx) {
        const x = this.x + 30;
        const y = this.y + 30;
        
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x, y, 40, 30);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 40, 30);
        
        // 箱子图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📦', x + 20, y + 15);
        
        // 物品数量
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${this.storage.length}/${this.maxStorageSlots}`, x + 20, y + 40);
    }

    // 渲染房屋等级
    renderHouseLevel(ctx) {
        if (this.level > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(this.x + this.width - 50, this.y + 5, 45, 20);
            
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🏠 Lv${this.level}`, this.x + this.width - 27, this.y + 15);
        }
    }

    // 获取房间边界
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    // 检查点是否在房间内
    isPointInside(px, py) {
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    // 调整大小
    resize(canvasWidth, canvasHeight) {
        this.width = canvasWidth - 100;
        this.height = canvasHeight - 100;
        
        // 重新定位门
        this.doors.top.x = this.x + this.width / 2;
        this.doors.top.y = this.y;
        
        this.doors.bottom.x = this.x + this.width / 2;
        this.doors.bottom.y = this.y + this.height;
        
        this.doors.left.x = this.x;
        this.doors.left.y = this.y + this.height / 2;
        
        this.doors.right.x = this.x + this.width;
        this.doors.right.y = this.y + this.height / 2;
    }

    // 序列化
    serialize() {
        const doorsData = {};
        Object.keys(this.doors).forEach(key => {
            doorsData[key] = this.doors[key].serialize();
        });
        
        return {
            id: this.id,
            level: this.level,
            storage: this.storage.map(item => ({
                id: item.id,
                quantity: item.quantity
            })),
            doors: doorsData
        };
    }

    // 反序列化
    deserialize(data) {
        this.level = data.level || 1;
        this.maxStorageSlots = this.getMaxStorageSlots();
        
        if (data.storage) {
            this.storage = data.storage.map(item => ({
                id: item.id,
                quantity: item.quantity
            }));
        }
        
        if (data.doors) {
            Object.keys(data.doors).forEach(key => {
                if (this.doors[key]) {
                    this.doors[key].deserialize(data.doors[key]);
                }
            });
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = House;
}