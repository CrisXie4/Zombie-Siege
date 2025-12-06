// 物品系统模块

const Items = {
    // 建筑物品定义
    building: {
        wooden_door: {
            id: 'wooden_door',
            name: '木门',
            icon: '🚪',
            type: 'building',
            subType: 'door',
            doorLevel: 1,
            price: 50,
            description: '基础木门，可以阻挡僵尸'
        },
        reinforced_door: {
            id: 'reinforced_door',
            name: '加固门',
            icon: '🚪',
            type: 'building',
            subType: 'door',
            doorLevel: 2,
            price: 150,
            description: '加固的门，更耐打'
        },
        iron_door: {
            id: 'iron_door',
            name: '铁门',
            icon: '🚪',
            type: 'building',
            subType: 'door',
            doorLevel: 3,
            price: 350,
            description: '坚固的铁门'
        },
        steel_door: {
            id: 'steel_door',
            name: '钢门',
            icon: '🚪',
            type: 'building',
            subType: 'door',
            doorLevel: 4,
            price: 700,
            description: '非常坚固的钢门'
        },
        vault_door: {
            id: 'vault_door',
            name: '金库门',
            icon: '🚪',
            type: 'building',
            subType: 'door',
            doorLevel: 5,
            price: 1500,
            description: '最坚固的门'
        },
        door_repair_kit: {
            id: 'door_repair_kit',
            name: '门修复工具',
            icon: '🔧',
            type: 'building',
            subType: 'repair',
            repairAmount: 50,
            price: 30,
            description: '修复门50点耐久'
        },
        house_upgrade: {
            id: 'house_upgrade',
            name: '房屋升级包',
            icon: '🏠',
            type: 'building',
            subType: 'upgrade',
            price: 500,
            description: '升级房屋等级，增加存储空间'
        }
    },

    // 武器定义
    weapons: {
        knife: {
            id: 'knife',
            name: '小刀',
            icon: '🔪',
            type: 'melee',
            damage: 15,
            range: 50,
            attackSpeed: 300, // 毫秒
            price: 0,
            description: '基础近战武器',
            owned: true
        },
        bat: {
            id: 'bat',
            name: '棒球棍',
            icon: '🏏',
            type: 'melee',
            damage: 25,
            range: 60,
            attackSpeed: 400,
            price: 100,
            description: '更强的近战武器'
        },
        axe: {
            id: 'axe',
            name: '斧头',
            icon: '🪓',
            type: 'melee',
            damage: 40,
            range: 55,
            attackSpeed: 600,
            price: 250,
            description: '高伤害近战武器'
        },
        sword: {
            id: 'sword',
            name: '武士刀',
            icon: '⚔️',
            type: 'melee',
            damage: 50,
            range: 70,
            attackSpeed: 350,
            price: 500,
            description: '精良的近战武器'
        },
        pistol: {
            id: 'pistol',
            name: '手枪',
            icon: '🔫',
            type: 'ranged',
            damage: 30,
            range: 300,
            attackSpeed: 500,
            ammoType: 'pistol_ammo',
            maxAmmo: 12,
            price: 300,
            description: '基础远程武器'
        },
        shotgun: {
            id: 'shotgun',
            name: '霰弹枪',
            icon: '🔫',
            type: 'ranged',
            damage: 60,
            range: 150,
            attackSpeed: 1000,
            ammoType: 'shotgun_ammo',
            maxAmmo: 6,
            spread: 30, // 散射角度
            pellets: 5, // 弹丸数量
            price: 600,
            description: '近距离高伤害'
        },
        rifle: {
            id: 'rifle',
            name: '步枪',
            icon: '🔫',
            type: 'ranged',
            damage: 45,
            range: 400,
            attackSpeed: 300,
            ammoType: 'rifle_ammo',
            maxAmmo: 30,
            price: 800,
            description: '高射速远程武器'
        },
        smg: {
            id: 'smg',
            name: '冲锋枪',
            icon: '🔫',
            type: 'ranged',
            damage: 20,
            range: 250,
            attackSpeed: 100,
            ammoType: 'smg_ammo',
            maxAmmo: 40,
            price: 700,
            description: '超高射速'
        }
    },

    // 食物定义
    food: {
        bread: {
            id: 'bread',
            name: '面包',
            icon: '🍞',
            type: 'food',
            hungerRestore: 20,
            price: 20,
            description: '恢复20点饥饿值'
        },
        apple: {
            id: 'apple',
            name: '苹果',
            icon: '🍎',
            type: 'food',
            hungerRestore: 15,
            healthRestore: 5,
            price: 25,
            description: '恢复15饥饿+5生命'
        },
        meat: {
            id: 'meat',
            name: '烤肉',
            icon: '🍖',
            type: 'food',
            hungerRestore: 40,
            price: 50,
            description: '恢复40点饥饿值'
        },
        pizza: {
            id: 'pizza',
            name: '披萨',
            icon: '🍕',
            type: 'food',
            hungerRestore: 50,
            price: 60,
            description: '恢复50点饥饿值'
        },
        burger: {
            id: 'burger',
            name: '汉堡',
            icon: '🍔',
            type: 'food',
            hungerRestore: 60,
            healthRestore: 10,
            price: 80,
            description: '恢复60饥饿+10生命'
        },
        energyDrink: {
            id: 'energyDrink',
            name: '能量饮料',
            icon: '🥤',
            type: 'food',
            hungerRestore: 10,
            speedBoost: 1.5,
            boostDuration: 10000, // 10秒
            price: 40,
            description: '临时提升移动速度'
        }
    },

    // 药品定义
    medicine: {
        bandage: {
            id: 'bandage',
            name: '绷带',
            icon: '🩹',
            type: 'medicine',
            healthRestore: 20,
            price: 30,
            description: '恢复20点生命值'
        },
        medkit: {
            id: 'medkit',
            name: '医疗包',
            icon: '🧰',
            type: 'medicine',
            healthRestore: 50,
            price: 80,
            description: '恢复50点生命值'
        },
        firstAid: {
            id: 'firstAid',
            name: '急救箱',
            icon: '➕',
            type: 'medicine',
            healthRestore: 100,
            price: 150,
            description: '完全恢复生命值'
        },
        antidote: {
            id: 'antidote',
            name: '解毒剂',
            icon: '💉',
            type: 'medicine',
            curePoison: true,
            healthRestore: 10,
            price: 50,
            description: '解除中毒状态'
        },
        adrenaline: {
            id: 'adrenaline',
            name: '肾上腺素',
            icon: '💊',
            type: 'medicine',
            healthRestore: 30,
            damageBoost: 1.5,
            boostDuration: 15000, // 15秒
            price: 100,
            description: '临时提升攻击力'
        },
        shield: {
            id: 'shield',
            name: '防护药剂',
            icon: '🛡️',
            type: 'medicine',
            defenseBoost: 50,
            boostDuration: 20000, // 20秒
            price: 120,
            description: '临时提升防御力'
        }
    },

    // 弹药定义
    ammo: {
        pistol_ammo: {
            id: 'pistol_ammo',
            name: '手枪弹药',
            icon: '🔹',
            type: 'ammo',
            quantity: 24,
            price: 30,
            description: '手枪弹药 x24'
        },
        shotgun_ammo: {
            id: 'shotgun_ammo',
            name: '霰弹',
            icon: '🔸',
            type: 'ammo',
            quantity: 12,
            price: 40,
            description: '霰弹枪弹药 x12'
        },
        rifle_ammo: {
            id: 'rifle_ammo',
            name: '步枪弹药',
            icon: '🔷',
            type: 'ammo',
            quantity: 60,
            price: 50,
            description: '步枪弹药 x60'
        },
        smg_ammo: {
            id: 'smg_ammo',
            name: '冲锋枪弹药',
            icon: '🔶',
            type: 'ammo',
            quantity: 80,
            price: 45,
            description: '冲锋枪弹药 x80'
        }
    },

    // 获取物品信息
    getItem(id) {
        // 搜索所有类别
        if (this.weapons[id]) return { ...this.weapons[id], category: 'weapons' };
        if (this.food[id]) return { ...this.food[id], category: 'food' };
        if (this.medicine[id]) return { ...this.medicine[id], category: 'medicine' };
        if (this.ammo[id]) return { ...this.ammo[id], category: 'ammo' };
        if (this.building[id]) return { ...this.building[id], category: 'building' };
        return null;
    },

    // 获取某类别的所有物品
    getCategory(category) {
        switch (category) {
            case 'weapons': return Object.values(this.weapons);
            case 'food': return Object.values(this.food);
            case 'medicine': return Object.values(this.medicine);
            case 'ammo': return Object.values(this.ammo);
            case 'building': return Object.values(this.building);
            default: return [];
        }
    },

    // 获取武器信息
    getWeapon(id) {
        return this.weapons[id] || null;
    },

    // 使用物品
    useItem(itemId, player) {
        const item = this.getItem(itemId);
        if (!item) return { success: false, message: '物品不存在' };

        switch (item.type) {
            case 'food':
                return this.useFood(item, player);
            case 'medicine':
                return this.useMedicine(item, player);
            default:
                return { success: false, message: '该物品无法使用' };
        }
    },

    // 使用食物
    useFood(item, player) {
        let message = '';
        
        if (item.hungerRestore) {
            const oldHunger = player.hunger;
            player.hunger = Math.min(player.maxHunger, player.hunger + item.hungerRestore);
            message += `饥饿值 +${player.hunger - oldHunger} `;
        }
        
        if (item.healthRestore) {
            const oldHealth = player.health;
            player.health = Math.min(player.maxHealth, player.health + item.healthRestore);
            message += `生命值 +${player.health - oldHealth} `;
        }
        
        if (item.speedBoost) {
            player.addBuff('speed', item.speedBoost, item.boostDuration);
            message += `速度提升 ${item.boostDuration / 1000}秒`;
        }
        
        return { success: true, message: message.trim() };
    },

    // 使用药品
    useMedicine(item, player) {
        let message = '';
        
        if (item.healthRestore) {
            const oldHealth = player.health;
            player.health = Math.min(player.maxHealth, player.health + item.healthRestore);
            message += `生命值 +${player.health - oldHealth} `;
        }
        
        if (item.curePoison) {
            player.removeBuff('poison');
            message += '解除中毒 ';
        }
        
        if (item.damageBoost) {
            player.addBuff('damage', item.damageBoost, item.boostDuration);
            message += `攻击力提升 ${item.boostDuration / 1000}秒 `;
        }
        
        if (item.defenseBoost) {
            player.addBuff('defense', item.defenseBoost, item.boostDuration);
            message += `防御力提升 ${item.boostDuration / 1000}秒`;
        }
        
        return { success: true, message: message.trim() };
    },

    // 获取商店物品列表
    getShopItems(category) {
        const items = this.getCategory(category);
        return items.map(item => ({
            ...item,
            canBuy: true
        }));
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Items;
}