// UI模块 - 处理界面交互

const UI = {
    // 当前显示的屏幕
    currentScreen: 'splash-screen',
    
    // 游戏引用
    game: null,
    
    // 开发者模式
    devMode: {
        enabled: false,
        password: '789600',
        godMode: false,
        debugOverlay: false,
        triggerCount: 0,
        triggerTimer: null
    },
    
    // 虚拟按键设置
    controlsSettings: {
        joystick: { x: 10, y: 70 },
        attack: { x: 85, y: 60 },
        use: { x: 85, y: 75 },
        lock: { x: 85, y: 90 },
        size: 100,
        opacity: 70
    },
    
    // 初始化UI
    init(game) {
        this.game = game;
        this.bindEvents();
        this.loadSettings();
        this.loadControlsSettings();
        this.checkSaveData();
    },

    // 绑定事件
    bindEvents() {
        // 主菜单按钮
        document.getElementById('btn-new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-continue').addEventListener('click', () => this.continueGame());
        document.getElementById('btn-settings').addEventListener('click', () => this.showScreen('settings-screen'));
        document.getElementById('btn-back-settings').addEventListener('click', () => this.showScreen('splash-screen'));
        
        // 游戏内按钮
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-shop').addEventListener('click', () => this.toggleShop());
        document.getElementById('btn-inventory').addEventListener('click', () => this.toggleInventory());
        document.getElementById('btn-house').addEventListener('click', () => this.toggleHouse());
        
        // 暂停菜单
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMenu());
        
        // 商店
        document.getElementById('btn-close-shop').addEventListener('click', () => this.closeShop());
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchShopTab(e.target.dataset.tab));
        });
        
        // 背包
        document.getElementById('btn-close-inventory').addEventListener('click', () => this.closeInventory());
        
        // 房屋管理
        document.getElementById('btn-close-house').addEventListener('click', () => this.closeHouse());
        document.getElementById('btn-lock-all').addEventListener('click', () => this.lockAllDoors());
        document.getElementById('btn-upgrade-house').addEventListener('click', () => this.upgradeHouse());
        
        // 门控制按钮
        document.querySelectorAll('.btn-lock-door').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const doorId = e.target.dataset.direction || e.target.closest('.door-item').dataset.direction;
                this.toggleDoorLock(doorId);
            });
        });
        
        document.querySelectorAll('.btn-repair-door').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const doorId = e.target.dataset.direction || e.target.closest('.door-item').dataset.direction;
                this.repairDoor(doorId);
            });
        });
        
        document.querySelectorAll('.btn-upgrade-door').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const doorId = e.target.dataset.direction || e.target.closest('.door-item').dataset.direction;
                this.upgradeDoor(doorId);
            });
        });
        
        // 存储标签切换
        document.querySelectorAll('.storage-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchStorageTab(e.target.dataset.tab));
        });
        
        // 游戏结束
        document.getElementById('btn-restart').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-main-menu').addEventListener('click', () => this.quitToMenu());
        
        // 复活对话框
        document.getElementById('btn-use-revive').addEventListener('click', () => this.useRevive());
        document.getElementById('btn-decline-revive').addEventListener('click', () => this.declineRevive());
        
        // 隐藏的开发者模式触发（连续点击版本号5次）
        const devTrigger = document.getElementById('dev-trigger');
        if (devTrigger) {
            devTrigger.addEventListener('click', () => this.onDevTriggerClick());
        }
        
        // 开发者模式
        document.getElementById('btn-dev-confirm').addEventListener('click', () => this.verifyDevPassword());
        document.getElementById('btn-dev-cancel').addEventListener('click', () => this.hideDevPasswordScreen());
        document.getElementById('btn-close-dev').addEventListener('click', () => this.closeDevConsole());
        
        // 开发者密码输入框回车确认
        document.getElementById('dev-password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyDevPassword();
            }
        });
        
        // 开发者按钮事件
        document.querySelectorAll('.dev-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    this.executeDevAction(action, e.target);
                }
            });
        });
        
        // 控制设置
        document.getElementById('btn-controls-settings').addEventListener('click', () => this.openControlsSettings());
        document.getElementById('btn-save-controls').addEventListener('click', () => this.saveControlsSettings());
        document.getElementById('btn-reset-controls').addEventListener('click', () => this.resetControlsSettings());
        document.getElementById('btn-close-controls').addEventListener('click', () => this.closeControlsSettings());
        
        // 预设按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyControlsPreset(preset);
            });
        });
        
        // 位置滑块事件
        ['joystick-x', 'joystick-y', 'attack-x', 'attack-y', 'use-x', 'use-y', 'lock-x', 'lock-y'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateControlsPreview());
            }
        });
        
        // 大小和透明度滑块
        const sizeSlider = document.getElementById('button-size');
        const opacitySlider = document.getElementById('button-opacity');
        
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                document.getElementById('size-value').textContent = e.target.value + '%';
                this.updateControlsPreview();
            });
        }
        
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                document.getElementById('opacity-value').textContent = e.target.value + '%';
                this.updateControlsPreview();
            });
        }
        
        // 设置变更
        document.getElementById('sound-volume').addEventListener('input', (e) => this.updateSetting('soundVolume', e.target.value));
        document.getElementById('music-volume').addEventListener('input', (e) => this.updateSetting('musicVolume', e.target.value));
        document.getElementById('control-size').addEventListener('change', (e) => this.updateSetting('controlSize', e.target.value));
    },

    // 显示屏幕
    showScreen(screenId) {
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) return;
        
        // 检查是否是overlay类型的屏幕（商店、背包、暂停等）
        const isOverlay = targetScreen.classList.contains('overlay');
        
        if (isOverlay) {
            // overlay屏幕直接显示，不影响其他屏幕
            targetScreen.classList.add('active');
        } else {
            // 非overlay屏幕，隐藏所有非overlay屏幕
            document.querySelectorAll('.screen:not(.overlay)').forEach(screen => {
                screen.classList.remove('active');
            });
            // 同时隐藏所有overlay屏幕
            document.querySelectorAll('.screen.overlay').forEach(screen => {
                screen.classList.remove('active');
            });
            targetScreen.classList.add('active');
        }
        
        this.currentScreen = screenId;
    },

    // 隐藏屏幕
    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('active');
        }
    },

    // 检查存档数据
    checkSaveData() {
        const hasSave = Storage.hasSaveData();
        const continueBtn = document.getElementById('btn-continue');
        
        if (continueBtn) {
            continueBtn.disabled = !hasSave;
            
            if (hasSave) {
                const saveInfo = Storage.getSaveInfo();
                if (saveInfo) {
                    continueBtn.title = `波次: ${saveInfo.wave} | 击杀: ${saveInfo.kills}`;
                }
            }
        }
    },

    // 开始新游戏
    startNewGame() {
        // 删除旧存档
        Storage.deleteSave();
        
        // 初始化游戏
        this.game.init();
        this.game.start();
        
        // 显示游戏界面
        this.showScreen('game-screen');
    },

    // 继续游戏
    continueGame() {
        const saveData = Storage.loadGame();
        if (!saveData) {
            Utils.showToast('没有找到存档', 'error');
            return;
        }
        
        // 加载存档
        this.game.loadSave(saveData);
        this.game.start();
        
        // 显示游戏界面
        this.showScreen('game-screen');
        
        Utils.showToast('游戏已加载', 'success');
    },

    // 切换暂停
    togglePause() {
        if (this.game.isGameOver) return;
        
        if (this.game.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    },

    // 暂停游戏
    pauseGame() {
        this.game.pause();
        this.showScreen('pause-screen');
    },

    // 继续游戏
    resumeGame() {
        this.hideScreen('pause-screen');
        this.game.resume();
    },

    // 保存游戏
    saveGame() {
        const state = this.game.getState();
        Storage.saveGame(state);
    },

    // 返回主菜单
    quitToMenu() {
        this.game.stop();
        this.hideScreen('pause-screen');
        this.hideScreen('gameover-screen');
        this.showScreen('splash-screen');
        this.checkSaveData();
    },

    // 切换商店
    toggleShop() {
        const shopScreen = document.getElementById('shop-screen');
        if (shopScreen.classList.contains('active')) {
            this.closeShop();
        } else {
            this.openShop();
        }
    },

    // 打开商店
    openShop() {
        this.game.pause();
        this.updateShopMoney();
        this.switchShopTab('weapons');
        this.showScreen('shop-screen');
    },

    // 关闭商店
    closeShop() {
        this.hideScreen('shop-screen');
        this.game.resume();
    },

    // 更新商店金钱显示
    updateShopMoney() {
        const shopMoney = document.getElementById('shop-money');
        if (shopMoney) {
            shopMoney.textContent = `💰 ${this.game.player.money}`;
        }
    },

    // 切换商店标签
    switchShopTab(tab) {
        // 更新标签样式
        document.querySelectorAll('.shop-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            }
        });
        
        // 加载商品
        this.loadShopItems(tab);
    },

    // 加载商店商品
    loadShopItems(category) {
        const container = document.getElementById('shop-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        const items = Items.getShopItems(category);
        
        items.forEach(item => {
            const owned = this.game.player.inventory.some(i => i.id === item.id);
            const canAfford = this.game.player.money >= item.price;
            
            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${owned && category === 'weapons' ? 'owned' : ''}`;
            itemEl.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-name">${item.name}</div>
                ${owned && category === 'weapons' ? 
                    '<div class="item-owned">已拥有</div>' : 
                    `<div class="item-price">${item.price} 💰</div>`
                }
            `;
            
            // 点击购买
            if (!(owned && category === 'weapons')) {
                itemEl.addEventListener('click', () => this.buyItem(item, category));
                
                if (!canAfford) {
                    itemEl.style.opacity = '0.5';
                }
            }
            
            container.appendChild(itemEl);
        });
    },

    // 购买物品
    buyItem(item, category) {
        if (this.game.player.money < item.price) {
            Utils.showToast('金币不足！', 'error');
            return;
        }
        
        // 武器只能购买一次
        if (category === 'weapons') {
            const owned = this.game.player.inventory.some(i => i.id === item.id);
            if (owned) {
                Utils.showToast('已拥有该武器', 'warning');
                return;
            }
        }
        
        // 扣钱
        this.game.player.spendMoney(item.price);
        
        // 处理复活币
        if (item.subType === 'revive') {
            const quantity = item.quantity || 1;
            this.game.player.addReviveToken(quantity);
            Utils.showToast(`购买了 ${item.name}，当前复活币: ${this.game.player.getReviveTokens()}`, 'success');
        }
        // 添加物品
        else if (category === 'ammo') {
            this.game.player.addItem(item.id, item.quantity);
            Utils.showToast(`购买了 ${item.name}`, 'success');
        } else {
            this.game.player.addItem(item.id, 1);
            Utils.showToast(`购买了 ${item.name}`, 'success');
        }
        
        // 刷新显示
        this.updateShopMoney();
        this.loadShopItems(category);
    },

    // 切换背包
    toggleInventory() {
        const inventoryScreen = document.getElementById('inventory-screen');
        if (inventoryScreen.classList.contains('active')) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    },

    // 打开背包
    openInventory() {
        this.game.pause();
        this.updateInventory();
        this.showScreen('inventory-screen');
    },

    // 关闭背包
    closeInventory() {
        this.hideScreen('inventory-screen');
        this.game.resume();
    },

    // 更新背包显示
    updateInventory() {
        // 更新当前武器
        const weapon = Items.getWeapon(this.game.player.equippedWeapon);
        if (weapon) {
            document.querySelector('#current-weapon .weapon-icon').textContent = weapon.icon;
            document.querySelector('#current-weapon .weapon-name').textContent = weapon.name;
            
            const ammoEl = document.querySelector('#current-weapon .weapon-ammo');
            if (weapon.type === 'ranged') {
                const ammoCount = this.game.player.getAmmoCount(weapon.ammoType);
                ammoEl.textContent = `弹药: ${ammoCount}`;
            } else {
                ammoEl.textContent = '';
            }
        }
        
        // 更新物品列表
        const container = document.getElementById('inventory-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.game.player.inventory.forEach(invItem => {
            const item = Items.getItem(invItem.id);
            if (!item) return;
            
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                ${invItem.quantity > 1 ? `<div class="item-count">${invItem.quantity}</div>` : ''}
            `;
            itemEl.title = `${item.name}\n${item.description || ''}`;
            
            // 点击使用/装备
            itemEl.addEventListener('click', () => this.useInventoryItem(invItem, item));
            
            container.appendChild(itemEl);
        });
    },

    // 使用背包物品
    useInventoryItem(invItem, item) {
        if (item.category === 'weapons') {
            // 装备武器
            this.game.player.equipWeapon(invItem.id);
            Utils.showToast(`装备了 ${item.name}`, 'success');
        } else if (item.type === 'food' || item.type === 'medicine') {
            // 使用消耗品
            this.game.player.useItem(invItem.id);
        } else if (item.type === 'ammo') {
            Utils.showToast(`${item.name}: ${invItem.quantity}`, 'info');
        }
        
        this.updateInventory();
    },

    // 切换房屋管理界面
    toggleHouse() {
        const houseScreen = document.getElementById('house-screen');
        if (houseScreen.classList.contains('active')) {
            this.closeHouse();
        } else {
            this.openHouse();
        }
    },

    // 打开房屋管理
    openHouse() {
        this.game.pause();
        this.updateHouseUI();
        this.showScreen('house-screen');
    },

    // 关闭房屋管理
    closeHouse() {
        this.hideScreen('house-screen');
        this.game.resume();
    },

    // 更新房屋界面
    updateHouseUI() {
        const homeBase = this.game.getHomeBase();
        
        // 更新家园信息
        if (homeBase) {
            const stats = homeBase.getLevelStats();
            
            // 更新家园名称
            const homeNameEl = document.getElementById('home-name');
            if (homeNameEl) {
                homeNameEl.textContent = stats.name;
            }
            
            // 更新家园等级
            const levelEl = document.getElementById('house-level-text');
            if (levelEl) {
                levelEl.textContent = homeBase.level;
            }
            
            // 更新存储容量
            const capacityEl = document.getElementById('storage-capacity');
            if (capacityEl) {
                capacityEl.textContent = `${homeBase.storageBox.items.length}/${homeBase.maxStorageSlots}`;
            }
            
            // 更新家园升级按钮
            const upgradeHouseBtn = document.getElementById('btn-upgrade-house');
            if (upgradeHouseBtn) {
                const upgradeCost = homeBase.getUpgradeCost();
                if (homeBase.level >= 5) {
                    upgradeHouseBtn.textContent = '已满级';
                    upgradeHouseBtn.disabled = true;
                } else {
                    upgradeHouseBtn.textContent = `升级家园 (${upgradeCost}💰)`;
                    upgradeHouseBtn.disabled = false;
                }
            }
            
            // 更新家园门状态
            const door = homeBase.door;
            const doorItem = document.querySelector('.door-item[data-direction="home"]');
            if (doorItem && door) {
                // 更新门名称和等级
                const nameEl = doorItem.querySelector('.door-name');
                if (nameEl) {
                    nameEl.textContent = `家园门 (Lv.${door.level})`;
                }
                
                // 更新血量条
                const healthFill = doorItem.querySelector('.door-health-bar');
                if (healthFill) {
                    const healthPercent = (door.health / door.maxHealth) * 100;
                    healthFill.style.width = `${healthPercent}%`;
                    
                    // 根据血量改变颜色
                    if (healthPercent > 60) {
                        healthFill.style.backgroundColor = '#4CAF50';
                    } else if (healthPercent > 30) {
                        healthFill.style.backgroundColor = '#ff9800';
                    } else {
                        healthFill.style.backgroundColor = '#f44336';
                    }
                }
                
                // 更新状态文字
                const statusEl = doorItem.querySelector('.door-status');
                if (statusEl) {
                    if (door.isBroken) {
                        statusEl.textContent = '已损坏';
                        statusEl.className = 'door-status broken';
                    } else if (door.isLocked) {
                        statusEl.textContent = '已锁定';
                        statusEl.className = 'door-status locked';
                    } else {
                        statusEl.textContent = '未锁定';
                        statusEl.className = 'door-status unlocked';
                    }
                }
                
                // 更新锁定按钮文字
                const lockBtn = doorItem.querySelector('.btn-lock-door');
                if (lockBtn) {
                    lockBtn.textContent = door.isLocked ? '🔓' : '🔒';
                    lockBtn.disabled = door.isBroken;
                }
                
                // 更新修复按钮
                const repairBtn = doorItem.querySelector('.btn-repair-door');
                if (repairBtn) {
                    repairBtn.disabled = door.health >= door.maxHealth;
                }
                
                // 更新升级按钮
                const upgradeBtn = doorItem.querySelector('.btn-upgrade-door');
                if (upgradeBtn) {
                    upgradeBtn.disabled = door.level >= 5;
                }
            }
        }
        
        // 更新存储界面
        this.updateStorageUI();
    },

    // 获取门的显示名称
    getDoorName(doorId) {
        const names = {
            'top': '北门',
            'bottom': '南门',
            'left': '西门',
            'right': '东门'
        };
        return names[doorId] || doorId;
    },

    // 切换门锁状态
    toggleDoorLock(doorId) {
        const result = this.game.toggleDoorLock(doorId);
        if (result.success) {
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateHouseUI();
    },

    // 锁定所有门
    lockAllDoors() {
        const result = this.game.lockAllDoors();
        Utils.showToast(result.message, result.success ? 'success' : 'warning');
        this.updateHouseUI();
    },

    // 修复门
    repairDoor(doorId) {
        // 检查是否有修复工具
        const hasRepairKit = this.game.player.inventory.some(i => i.id === 'repair_kit');
        
        if (!hasRepairKit) {
            Utils.showToast('需要修复工具！', 'error');
            return;
        }
        
        const result = this.game.repairDoor(doorId);
        if (result.success) {
            // 消耗修复工具
            this.game.player.removeItem('repair_kit', 1);
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateHouseUI();
    },

    // 升级门
    upgradeDoor(doorId) {
        const house = this.game.getHouse();
        const door = house.doors[doorId];
        
        if (!door) return;
        
        const upgradeCost = door.getUpgradeCost();
        
        if (this.game.player.money < upgradeCost) {
            Utils.showToast(`金币不足！需要 ${upgradeCost} 💰`, 'error');
            return;
        }
        
        const result = this.game.upgradeDoor(doorId);
        if (result.success) {
            this.game.player.spendMoney(upgradeCost);
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateHouseUI();
    },

    // 升级家园
    upgradeHouse() {
        const result = this.game.upgradeHomeBase();
        if (result.success) {
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateHouseUI();
    },

    // 切换存储标签
    switchStorageTab(tab) {
        document.querySelectorAll('.storage-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.tab === tab) {
                t.classList.add('active');
            }
        });
        
        this.updateStorageUI(tab);
    },

    // 更新存储界面
    updateStorageUI(activeTab = 'stored') {
        const homeBase = this.game.getHomeBase();
        if (!homeBase) return;
        
        const container = document.getElementById('storage-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (activeTab === 'stored') {
            // 显示已存储的物品
            const storedItems = homeBase.getStorageItems();
            
            if (storedItems.length === 0) {
                container.innerHTML = '<div class="empty-storage">存储箱为空</div>';
                return;
            }
            
            storedItems.forEach(storedItem => {
                const item = Items.getItem(storedItem.id);
                if (!item) return;
                
                const itemEl = document.createElement('div');
                itemEl.className = 'storage-item';
                itemEl.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-name">${item.name}</div>
                    ${storedItem.quantity > 1 ? `<div class="item-count">x${storedItem.quantity}</div>` : ''}
                `;
                itemEl.title = `${item.name}\n${item.description || ''}\n点击取出`;
                
                itemEl.addEventListener('click', () => this.retrieveItem(storedItem.id));
                
                container.appendChild(itemEl);
            });
        } else {
            // 显示背包中可存储的物品
            const inventory = this.game.player.inventory;
            
            if (inventory.length === 0) {
                container.innerHTML = '<div class="empty-storage">背包为空</div>';
                return;
            }
            
            inventory.forEach(invItem => {
                const item = Items.getItem(invItem.id);
                if (!item) return;
                
                const itemEl = document.createElement('div');
                itemEl.className = 'storage-item';
                itemEl.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-name">${item.name}</div>
                    ${invItem.quantity > 1 ? `<div class="item-count">x${invItem.quantity}</div>` : ''}
                `;
                itemEl.title = `${item.name}\n${item.description || ''}\n点击存入`;
                
                itemEl.addEventListener('click', () => this.storeItem(invItem.id));
                
                container.appendChild(itemEl);
            });
        }
        
        // 更新存储容量显示
        const capacityEl = document.getElementById('storage-capacity');
        if (capacityEl) {
            capacityEl.textContent = `${homeBase.storageBox.items.length}/${homeBase.maxStorageSlots}`;
        }
    },

    // 存入物品
    storeItem(itemId) {
        const result = this.game.storeItemToHome(itemId);
        if (result.success) {
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateStorageUI('store');
        this.updateInventory();
        this.updateHouseUI();
    },

    // 取出物品
    retrieveItem(itemId) {
        const result = this.game.retrieveItemFromHome(itemId);
        if (result.success) {
            Utils.showToast(result.message, 'success');
        } else {
            Utils.showToast(result.message, 'error');
        }
        this.updateStorageUI('stored');
        this.updateInventory();
        this.updateHouseUI();
    },

    // 处理交互键（E键）
    handleInteraction() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        const result = this.game.interact();
        if (result.success) {
            if (result.action === 'openStorage') {
                this.openHouse();
                // 自动切换到存储标签
                this.switchStorageTab('stored');
            } else if (result.action === 'openWorkbench') {
                // 未来可以添加工作台功能
                Utils.showToast('工作台功能开发中...', 'info');
            } else if (result.message) {
                Utils.showToast(result.message, 'success');
            }
        } else if (result.message) {
            Utils.showToast(result.message, 'warning');
        }
    },

    // 加载设置
    loadSettings() {
        const settings = Storage.loadSettings();
        
        document.getElementById('sound-volume').value = settings.soundVolume;
        document.getElementById('music-volume').value = settings.musicVolume;
        document.getElementById('control-size').value = settings.controlSize;
        
        this.applySettings(settings);
    },

    // 更新设置
    updateSetting(key, value) {
        const settings = Storage.loadSettings();
        settings[key] = value;
        Storage.saveSettings(settings);
        this.applySettings(settings);
    },

    // 应用设置
    applySettings(settings) {
        // 应用控制器大小
        const controls = document.getElementById('virtual-controls');
        if (controls) {
            controls.className = `control-size-${settings.controlSize}`;
        }
        
        // 音量设置将在音频系统实现后应用
    },

    // ==================== 开发者模式 ====================
    
    // 开发者模式触发点击
    onDevTriggerClick() {
        this.devMode.triggerCount++;
        
        // 清除之前的计时器
        if (this.devMode.triggerTimer) {
            clearTimeout(this.devMode.triggerTimer);
        }
        
        // 10秒内需要点击5次
        this.devMode.triggerTimer = setTimeout(() => {
            this.devMode.triggerCount = 0;
        }, 10000);
        
        // 达到5次点击
        if (this.devMode.triggerCount >= 5) {
            this.devMode.triggerCount = 0;
            this.showDevPasswordScreen();
        }
    },
    
    // 显示开发者密码输入界面
    showDevPasswordScreen() {
        this.hideScreen('pause-screen');
        this.showScreen('dev-password-screen');
        document.getElementById('dev-password-input').value = '';
        document.getElementById('dev-password-input').focus();
    },
    
    // 隐藏开发者密码输入界面
    hideDevPasswordScreen() {
        this.hideScreen('dev-password-screen');
        this.showScreen('pause-screen');
    },
    
    // 验证开发者密码
    verifyDevPassword() {
        const input = document.getElementById('dev-password-input');
        const password = input.value;
        
        if (password === this.devMode.password) {
            this.devMode.enabled = true;
            this.hideScreen('dev-password-screen');
            this.openDevConsole();
            Utils.showToast('🔓 开发者模式已启用', 'success');
        } else {
            Utils.showToast('❌ 密码错误', 'error');
            input.value = '';
            input.focus();
        }
    },
    
    // 打开开发者控制台
    openDevConsole() {
        if (!this.devMode.enabled) {
            this.showDevPasswordScreen();
            return;
        }
        
        this.hideScreen('pause-screen');
        this.showScreen('dev-console-screen');
        this.updateDevInfo();
    },
    
    // 关闭开发者控制台
    closeDevConsole() {
        this.hideScreen('dev-console-screen');
        this.showScreen('pause-screen');
    },
    
    // 更新开发者信息
    updateDevInfo() {
        if (!this.game || !this.game.player) return;
        
        const playerPos = document.getElementById('dev-player-pos');
        const zombieCount = document.getElementById('dev-zombie-count');
        const wave = document.getElementById('dev-wave');
        const playtime = document.getElementById('dev-playtime');
        
        if (playerPos) {
            playerPos.textContent = `(${Math.round(this.game.player.x)}, ${Math.round(this.game.player.y)})`;
        }
        if (zombieCount) {
            zombieCount.textContent = this.game.zombies.length;
        }
        if (wave) {
            wave.textContent = this.game.spawner ? this.game.spawner.getWave() : 1;
        }
        if (playtime) {
            const seconds = Math.floor(this.game.playTime / 1000);
            const minutes = Math.floor(seconds / 60);
            playtime.textContent = `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
    },
    
    // 执行开发者操作
    executeDevAction(action, button) {
        if (!this.game || !this.game.player) return;
        
        switch (action) {
            case 'addMoney':
                this.game.player.money += 1000;
                Utils.showToast('💰 +1000 金币', 'success');
                break;
                
            case 'addHealth':
                this.game.player.health = this.game.player.maxHealth;
                Utils.showToast('❤️ 生命值已满', 'success');
                break;
                
            case 'addHunger':
                this.game.player.hunger = this.game.player.maxHunger;
                Utils.showToast('🍖 饱食度已满', 'success');
                break;
                
            case 'maxAll':
                this.game.player.health = this.game.player.maxHealth;
                this.game.player.hunger = this.game.player.maxHunger;
                this.game.player.money += 10000;
                Utils.showToast('✨ 全部属性已满 +10000金币', 'success');
                break;
                
            case 'killAllZombies':
                const count = this.game.zombies.length;
                this.game.zombies.forEach(z => {
                    z.isAlive = false;
                    this.game.kills++;
                });
                this.game.zombies = [];
                Utils.showToast(`💀 清除了 ${count} 只僵尸`, 'success');
                break;
                
            case 'nextWave':
                if (this.game.spawner) {
                    this.game.spawner.forceNextWave();
                    Utils.showToast(`🌊 跳到第 ${this.game.spawner.getWave()} 波`, 'success');
                }
                break;
                
            case 'godMode':
                this.devMode.godMode = !this.devMode.godMode;
                this.game.player.invincible = this.devMode.godMode;
                this.game.player.invincibleTimer = this.devMode.godMode ? Infinity : 0;
                button.classList.toggle('active', this.devMode.godMode);
                this.updateGodModeIndicator();
                Utils.showToast(this.devMode.godMode ? '🛡️ 无敌模式开启' : '🛡️ 无敌模式关闭', 'success');
                break;
                
            case 'speedBoost':
                if (this.game.player.speed === this.game.player.baseSpeed) {
                    this.game.player.speed = this.game.player.baseSpeed * 2;
                    button.classList.add('active');
                    Utils.showToast('⚡ 速度提升 x2', 'success');
                } else {
                    this.game.player.speed = this.game.player.baseSpeed;
                    button.classList.remove('active');
                    Utils.showToast('⚡ 速度恢复正常', 'success');
                }
                break;
                
            case 'upgradeHome':
                if (this.game.homeBase) {
                    if (this.game.homeBase.level < 5) {
                        this.game.homeBase.upgrade();
                        Utils.showToast(`🏠 家园升级到 ${this.game.homeBase.level} 级`, 'success');
                    } else {
                        Utils.showToast('🏠 家园已满级', 'warning');
                    }
                }
                break;
                
            case 'repairWalls':
                if (this.game.homeBase) {
                    this.game.homeBase.wallHealth = this.game.homeBase.maxWallHealth;
                    Utils.showToast('🧱 围墙已修复', 'success');
                }
                break;
                
            case 'repairAllDoors':
                if (this.game.house) {
                    Object.values(this.game.house.doors).forEach(door => {
                        door.health = door.maxHealth;
                        door.isBroken = false;
                    });
                    Utils.showToast('🚪 所有门已修复', 'success');
                }
                break;
                
            case 'upgradeAllDoors':
                if (this.game.house) {
                    Object.values(this.game.house.doors).forEach(door => {
                        while (door.level < 5) {
                            door.upgrade();
                        }
                    });
                    Utils.showToast('🚪 所有门已升级到满级', 'success');
                }
                break;
                
            case 'giveAllWeapons':
                const weapons = ['pistol', 'shotgun', 'rifle', 'smg', 'bat', 'axe', 'sword', 'katana'];
                weapons.forEach(w => {
                    if (!this.game.player.inventory.some(i => i.id === w)) {
                        this.game.player.addItem(w, 1);
                    }
                });
                Utils.showToast('🔫 获得所有武器', 'success');
                break;
                
            case 'giveAmmo':
                const ammoTypes = ['pistol_ammo', 'shotgun_ammo', 'rifle_ammo', 'smg_ammo'];
                ammoTypes.forEach(a => {
                    this.game.player.addItem(a, 100);
                });
                Utils.showToast('🎯 +100 所有弹药', 'success');
                break;
                
            case 'giveItems':
                const items = ['medkit', 'bandage', 'energy_drink', 'canned_food', 'bread', 'water'];
                items.forEach(i => {
                    this.game.player.addItem(i, 5);
                });
                Utils.showToast('🎒 获得补给品', 'success');
                break;
                
            case 'toggleDebug':
                this.devMode.debugOverlay = !this.devMode.debugOverlay;
                button.classList.toggle('active', this.devMode.debugOverlay);
                this.updateDebugOverlay();
                Utils.showToast(this.devMode.debugOverlay ? '📊 调试显示开启' : '📊 调试显示关闭', 'success');
                break;
        }
        
        this.updateDevInfo();
    },
    
    // 更新无敌模式指示器
    updateGodModeIndicator() {
        let indicator = document.getElementById('god-mode-indicator');
        
        if (this.devMode.godMode) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'god-mode-indicator';
                indicator.className = 'god-mode-indicator';
                indicator.textContent = '🛡️ 无敌模式';
                document.body.appendChild(indicator);
            }
            indicator.style.display = 'block';
        } else {
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    },
    
    // 更新调试覆盖层
    updateDebugOverlay() {
        let overlay = document.getElementById('debug-overlay');
        
        if (this.devMode.debugOverlay) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'debug-overlay';
                overlay.className = 'debug-overlay';
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'block';
            this.startDebugUpdate();
        } else {
            if (overlay) {
                overlay.style.display = 'none';
            }
            this.stopDebugUpdate();
        }
    },
    
    // 开始调试更新
    startDebugUpdate() {
        if (this.debugInterval) return;
        
        this.debugInterval = setInterval(() => {
            if (!this.devMode.debugOverlay || !this.game || !this.game.player) return;
            
            const overlay = document.getElementById('debug-overlay');
            if (!overlay) return;
            
            const player = this.game.player;
            const fps = Math.round(1000 / this.game.deltaTime) || 0;
            
            overlay.innerHTML = `
                <p><span class="label">FPS:</span> <span class="value">${fps}</span></p>
                <p><span class="label">位置:</span> <span class="value">(${Math.round(player.x)}, ${Math.round(player.y)})</span></p>
                <p><span class="label">速度:</span> <span class="value">${player.speed.toFixed(1)}</span></p>
                <p><span class="label">生命:</span> <span class="value">${Math.round(player.health)}/${player.maxHealth}</span></p>
                <p><span class="label">饥饿:</span> <span class="value">${Math.round(player.hunger)}/${player.maxHunger}</span></p>
                <p><span class="label">金币:</span> <span class="value">${player.money}</span></p>
                <p><span class="label">僵尸:</span> <span class="value">${this.game.zombies.length}</span></p>
                <p><span class="label">波次:</span> <span class="value">${this.game.spawner ? this.game.spawner.getWave() : 1}</span></p>
                <p><span class="label">无敌:</span> <span class="value">${this.devMode.godMode ? '是' : '否'}</span></p>
            `;
        }, 100);
    },
    
    // 停止调试更新
    stopDebugUpdate() {
        if (this.debugInterval) {
            clearInterval(this.debugInterval);
            this.debugInterval = null;
        }
    },

    // ==================== 虚拟按键设置 ====================
    
    // 打开控制设置界面
    openControlsSettings() {
        this.hideScreen('pause-screen');
        this.showScreen('controls-settings-screen');
        this.loadControlsToUI();
    },
    
    // 关闭控制设置界面
    closeControlsSettings() {
        this.hideScreen('controls-settings-screen');
        this.showScreen('pause-screen');
    },
    
    // 加载控制设置到UI
    loadControlsToUI() {
        const settings = this.controlsSettings;
        
        // 位置滑块
        const joystickX = document.getElementById('joystick-x');
        const joystickY = document.getElementById('joystick-y');
        const attackX = document.getElementById('attack-x');
        const attackY = document.getElementById('attack-y');
        const useX = document.getElementById('use-x');
        const useY = document.getElementById('use-y');
        const lockX = document.getElementById('lock-x');
        const lockY = document.getElementById('lock-y');
        
        if (joystickX) joystickX.value = settings.joystick.x;
        if (joystickY) joystickY.value = settings.joystick.y;
        if (attackX) attackX.value = settings.attack.x;
        if (attackY) attackY.value = settings.attack.y;
        if (useX) useX.value = settings.use.x;
        if (useY) useY.value = settings.use.y;
        if (lockX) lockX.value = settings.lock.x;
        if (lockY) lockY.value = settings.lock.y;
        
        // 大小和透明度
        const sizeSlider = document.getElementById('button-size');
        const opacitySlider = document.getElementById('button-opacity');
        const sizeValue = document.getElementById('size-value');
        const opacityValue = document.getElementById('opacity-value');
        
        if (sizeSlider) sizeSlider.value = settings.size;
        if (sizeValue) sizeValue.textContent = settings.size + '%';
        if (opacitySlider) opacitySlider.value = settings.opacity;
        if (opacityValue) opacityValue.textContent = settings.opacity + '%';
    },
    
    // 从UI获取控制设置
    getControlsFromUI() {
        return {
            joystick: {
                x: parseInt(document.getElementById('joystick-x')?.value || 10),
                y: parseInt(document.getElementById('joystick-y')?.value || 70)
            },
            attack: {
                x: parseInt(document.getElementById('attack-x')?.value || 85),
                y: parseInt(document.getElementById('attack-y')?.value || 60)
            },
            use: {
                x: parseInt(document.getElementById('use-x')?.value || 85),
                y: parseInt(document.getElementById('use-y')?.value || 75)
            },
            lock: {
                x: parseInt(document.getElementById('lock-x')?.value || 85),
                y: parseInt(document.getElementById('lock-y')?.value || 90)
            },
            size: parseInt(document.getElementById('button-size')?.value || 100),
            opacity: parseInt(document.getElementById('button-opacity')?.value || 70)
        };
    },
    
    // 更新控制预览
    updateControlsPreview() {
        const settings = this.getControlsFromUI();
        this.applyControlsToDOM(settings);
    },
    
    // 应用控制设置到DOM
    applyControlsToDOM(settings) {
        const joystickContainer = document.getElementById('joystick-container');
        const btnAttack = document.getElementById('btn-attack');
        const btnUseItem = document.getElementById('btn-use-item');
        const btnLockDoors = document.getElementById('btn-lock-doors');
        const virtualControls = document.getElementById('virtual-controls');
        
        const scale = settings.size / 100;
        
        // 应用摇杆位置
        if (joystickContainer) {
            joystickContainer.style.position = 'fixed';
            joystickContainer.style.left = settings.joystick.x + '%';
            joystickContainer.style.top = settings.joystick.y + '%';
            joystickContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        
        // 应用攻击按钮位置
        if (btnAttack) {
            btnAttack.style.position = 'fixed';
            btnAttack.style.left = settings.attack.x + '%';
            btnAttack.style.top = settings.attack.y + '%';
            btnAttack.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        
        // 应用使用物品按钮位置
        if (btnUseItem) {
            btnUseItem.style.position = 'fixed';
            btnUseItem.style.left = settings.use.x + '%';
            btnUseItem.style.top = settings.use.y + '%';
            btnUseItem.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        
        // 应用锁门按钮位置
        if (btnLockDoors) {
            btnLockDoors.style.position = 'fixed';
            btnLockDoors.style.left = settings.lock.x + '%';
            btnLockDoors.style.top = settings.lock.y + '%';
            btnLockDoors.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
        
        // 应用透明度
        if (virtualControls) {
            virtualControls.style.opacity = settings.opacity / 100;
        }
    },
    
    // 应用预设
    applyControlsPreset(preset) {
        const presets = {
            default: {
                joystick: { x: 15, y: 75 },
                attack: { x: 85, y: 65 },
                use: { x: 85, y: 80 },
                lock: { x: 70, y: 80 },
                size: 100,
                opacity: 70
            },
            compact: {
                joystick: { x: 12, y: 80 },
                attack: { x: 88, y: 75 },
                use: { x: 88, y: 88 },
                lock: { x: 75, y: 88 },
                size: 85,
                opacity: 60
            },
            spread: {
                joystick: { x: 15, y: 70 },
                attack: { x: 85, y: 55 },
                use: { x: 85, y: 75 },
                lock: { x: 70, y: 75 },
                size: 110,
                opacity: 80
            }
        };
        
        const settings = presets[preset] || presets.default;
        this.controlsSettings = { ...settings };
        this.loadControlsToUI();
        this.applyControlsToDOM(settings);
        
        // 更新预设按钮状态
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });
        
        Utils.showToast(`已应用${preset === 'default' ? '默认' : preset === 'compact' ? '紧凑' : '分散'}布局`, 'success');
    },
    
    // 保存控制设置
    saveControlsSettings() {
        this.controlsSettings = this.getControlsFromUI();
        Storage.saveControlsSettings(this.controlsSettings);
        this.applyControlsToDOM(this.controlsSettings);
        Utils.showToast('控制设置已保存', 'success');
        this.closeControlsSettings();
    },
    
    // 重置控制设置
    resetControlsSettings() {
        this.applyControlsPreset('default');
        Utils.showToast('已重置为默认设置', 'success');
    },
    
    // 加载控制设置
    loadControlsSettings() {
        const saved = Storage.loadControlsSettings();
        if (saved) {
            this.controlsSettings = saved;
        }
        this.applyControlsToDOM(this.controlsSettings);
    },

    // ==================== 复活系统 ====================
    
    // 显示复活对话框
    showReviveDialog(tokenCount) {
        document.getElementById('revive-tokens-count').textContent = tokenCount;
        this.showScreen('revive-screen');
    },
    
    // 使用复活币
    useRevive() {
        this.hideScreen('revive-screen');
        if (this.game.revivePlayer()) {
            // 复活成功，自动保存游戏
            this.saveGame();
        }
    },
    
    // 拒绝复活
    declineRevive() {
        this.hideScreen('revive-screen');
        this.game.declineRevive();
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}