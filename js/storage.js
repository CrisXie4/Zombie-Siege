// 本地存储模块

const Storage = {
    // 存储键名前缀
    PREFIX: 'zombie_siege_',

    // 默认游戏数据
    defaultGameData: {
        player: {
            health: 100,
            maxHealth: 100,
            hunger: 100,
            maxHunger: 100,
            money: 100,
            x: 400,
            y: 300,
            speed: 3,
            damage: 10,
            defense: 0
        },
        inventory: [
            { id: 'knife', type: 'weapon', quantity: 1 }
        ],
        equippedWeapon: 'knife',
        stats: {
            wave: 1,
            kills: 0,
            totalMoney: 0,
            playTime: 0
        },
        settings: {
            soundVolume: 50,
            musicVolume: 50,
            controlSize: 'medium'
        },
        timestamp: null
    },

    // 获取完整键名
    getKey(key) {
        return this.PREFIX + key;
    },

    // 保存数据
    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    // 读取数据
    load(key) {
        try {
            const serialized = localStorage.getItem(this.getKey(key));
            if (serialized === null) return null;
            return JSON.parse(serialized);
        } catch (e) {
            console.error('读取数据失败:', e);
            return null;
        }
    },

    // 删除数据
    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('删除数据失败:', e);
            return false;
        }
    },

    // 清除所有游戏数据
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('清除数据失败:', e);
            return false;
        }
    },

    // 检查是否有存档
    hasSaveData() {
        return this.load('gameData') !== null;
    },

    // 保存游戏进度
    saveGame(gameState) {
        const saveData = {
            player: {
                health: gameState.player.health,
                maxHealth: gameState.player.maxHealth,
                hunger: gameState.player.hunger,
                maxHunger: gameState.player.maxHunger,
                money: gameState.player.money,
                x: gameState.player.x,
                y: gameState.player.y,
                speed: gameState.player.speed,
                damage: gameState.player.damage,
                defense: gameState.player.defense
            },
            inventory: gameState.inventory.map(item => ({
                id: item.id,
                type: item.type,
                quantity: item.quantity
            })),
            equippedWeapon: gameState.equippedWeapon,
            stats: {
                wave: gameState.wave,
                kills: gameState.kills,
                totalMoney: gameState.totalMoney,
                playTime: gameState.playTime
            },
            timestamp: Date.now()
        };

        const success = this.save('gameData', saveData);
        if (success) {
            Utils.showToast('游戏已保存', 'success');
        } else {
            Utils.showToast('保存失败', 'error');
        }
        return success;
    },

    // 加载游戏进度
    loadGame() {
        const saveData = this.load('gameData');
        if (!saveData) {
            return null;
        }
        return saveData;
    },

    // 获取新游戏数据
    getNewGameData() {
        return Utils.deepClone(this.defaultGameData);
    },

    // 保存设置
    saveSettings(settings) {
        return this.save('settings', settings);
    },

    // 加载设置
    loadSettings() {
        const settings = this.load('settings');
        if (!settings) {
            return {
                soundVolume: 50,
                musicVolume: 50,
                controlSize: 'medium'
            };
        }
        return settings;
    },

    // 保存最高分
    saveHighScore(score) {
        const highScores = this.load('highScores') || [];
        highScores.push({
            wave: score.wave,
            kills: score.kills,
            money: score.money,
            date: Date.now()
        });
        
        // 只保留前10个最高分
        highScores.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
        const topScores = highScores.slice(0, 10);
        
        return this.save('highScores', topScores);
    },

    // 获取最高分列表
    getHighScores() {
        return this.load('highScores') || [];
    },

    // 删除存档
    deleteSave() {
        const success = this.remove('gameData');
        if (success) {
            Utils.showToast('存档已删除', 'success');
        }
        return success;
    },

    // 导出存档（用于备份）
    exportSave() {
        const gameData = this.load('gameData');
        const settings = this.load('settings');
        const highScores = this.load('highScores');
        
        const exportData = {
            gameData,
            settings,
            highScores,
            exportDate: Date.now()
        };
        
        return JSON.stringify(exportData);
    },

    // 导入存档
    importSave(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            
            if (importData.gameData) {
                this.save('gameData', importData.gameData);
            }
            if (importData.settings) {
                this.save('settings', importData.settings);
            }
            if (importData.highScores) {
                this.save('highScores', importData.highScores);
            }
            
            Utils.showToast('存档导入成功', 'success');
            return true;
        } catch (e) {
            console.error('导入存档失败:', e);
            Utils.showToast('存档导入失败', 'error');
            return false;
        }
    },

    // 获取存档信息
    getSaveInfo() {
        const saveData = this.load('gameData');
        if (!saveData) return null;
        
        return {
            wave: saveData.stats.wave,
            kills: saveData.stats.kills,
            playTime: saveData.stats.playTime,
            savedAt: saveData.timestamp ? new Date(saveData.timestamp).toLocaleString() : '未知'
        };
    },

    // 保存控制设置（虚拟按键位置等）
    saveControlsSettings(settings) {
        return this.save('controlsSettings', settings);
    },

    // 加载控制设置
    loadControlsSettings() {
        return this.load('controlsSettings');
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}