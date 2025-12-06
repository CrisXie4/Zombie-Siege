// 控制器模块 - 处理键盘和触摸输入

class Controls {
    constructor(game) {
        this.game = game;
        
        // 按键状态
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            attack: false,
            use: false,
            reload: false,
            interact: false
        };
        
        // 虚拟摇杆状态
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };
        
        // 触摸ID
        this.joystickTouchId = null;
        
        // 设备类型
        this.isTouchDevice = Utils.isTouchDevice();
        
        // 初始化
        this.init();
    }

    // 初始化控制器
    init() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 触摸/鼠标事件 - 虚拟摇杆
        const joystickBase = document.getElementById('joystick-base');
        if (joystickBase) {
            joystickBase.addEventListener('touchstart', (e) => this.onJoystickStart(e));
            joystickBase.addEventListener('touchmove', (e) => this.onJoystickMove(e));
            joystickBase.addEventListener('touchend', (e) => this.onJoystickEnd(e));
            joystickBase.addEventListener('touchcancel', (e) => this.onJoystickEnd(e));
            
            // 鼠标支持（用于测试）
            joystickBase.addEventListener('mousedown', (e) => this.onJoystickStart(e));
            document.addEventListener('mousemove', (e) => this.onJoystickMove(e));
            document.addEventListener('mouseup', (e) => this.onJoystickEnd(e));
        }
        
        // 动作按钮
        const btnAttack = document.getElementById('btn-attack');
        const btnUseItem = document.getElementById('btn-use-item');
        const btnReload = document.getElementById('btn-reload');
        const btnLockDoors = document.getElementById('btn-lock-doors');
        
        if (btnAttack) {
            btnAttack.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onAttack();
            });
            btnAttack.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onAttack();
            });
        }
        
        if (btnUseItem) {
            btnUseItem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onUseItem();
            });
            btnUseItem.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onUseItem();
            });
        }
        
        if (btnReload) {
            btnReload.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onReload();
            });
            btnReload.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onReload();
            });
        }
        
        if (btnLockDoors) {
            btnLockDoors.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onLockAllDoors();
            });
            btnLockDoors.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.onLockAllDoors();
            });
        }
        
        // 显示/隐藏虚拟控制器
        this.updateControlsVisibility();
        window.addEventListener('resize', () => this.updateControlsVisibility());
    }

    // 更新虚拟控制器可见性
    updateControlsVisibility() {
        const controls = document.getElementById('virtual-controls');
        if (controls) {
            if (this.isTouchDevice || window.innerWidth <= 1024) {
                controls.style.display = 'block';
            } else {
                controls.style.display = 'none';
            }
        }
    }

    // 键盘按下
    onKeyDown(e) {
        if (this.game.isPaused || this.game.isGameOver) return;
        
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
            case 'KeyJ':
                e.preventDefault();
                this.onAttack();
                break;
            case 'KeyE':
                e.preventDefault();
                this.onInteract();
                break;
            case 'KeyK':
                e.preventDefault();
                this.onUseItem();
                break;
            case 'KeyR':
                e.preventDefault();
                this.onReload();
                break;
            case 'Escape':
                e.preventDefault();
                UI.togglePause();
                break;
            case 'KeyB':
                e.preventDefault();
                UI.toggleShop();
                break;
            case 'KeyI':
                e.preventDefault();
                UI.toggleInventory();
                break;
            case 'KeyH':
                e.preventDefault();
                UI.toggleHouse();
                break;
            case 'KeyL':
                e.preventDefault();
                this.onLockAllDoors();
                break;
        }
        
        this.updateMovement();
    }

    // 键盘释放
    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
        
        this.updateMovement();
    }

    // 更新移动
    updateMovement() {
        if (!this.game.player) return;
        
        let vx = 0;
        let vy = 0;
        
        // 键盘输入
        if (this.keys.up) vy -= 1;
        if (this.keys.down) vy += 1;
        if (this.keys.left) vx -= 1;
        if (this.keys.right) vx += 1;
        
        // 摇杆输入
        if (this.joystick.active) {
            vx = this.joystick.deltaX;
            vy = this.joystick.deltaY;
        }
        
        this.game.player.setVelocity(vx, vy);
    }

    // 摇杆开始
    onJoystickStart(e) {
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        const rect = e.target.getBoundingClientRect();
        
        this.joystick.active = true;
        this.joystick.startX = rect.left + rect.width / 2;
        this.joystick.startY = rect.top + rect.height / 2;
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        
        if (e.touches) {
            this.joystickTouchId = touch.identifier;
        }
        
        this.updateJoystickDelta();
    }

    // 摇杆移动
    onJoystickMove(e) {
        if (!this.joystick.active) return;
        
        e.preventDefault();
        
        let touch;
        if (e.touches) {
            // 找到正确的触摸点
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.joystickTouchId) {
                    touch = e.touches[i];
                    break;
                }
            }
            if (!touch) return;
        } else {
            touch = e;
        }
        
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        
        this.updateJoystickDelta();
        this.updateJoystickVisual();
        this.updateMovement();
    }

    // 摇杆结束
    onJoystickEnd(e) {
        if (e.touches) {
            // 检查是否是正确的触摸点结束
            let found = false;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.joystickTouchId) {
                    found = true;
                    break;
                }
            }
            if (found) return; // 触摸点还在
        }
        
        this.joystick.active = false;
        this.joystick.deltaX = 0;
        this.joystick.deltaY = 0;
        this.joystickTouchId = null;
        
        this.updateJoystickVisual();
        this.updateMovement();
    }

    // 更新摇杆增量
    updateJoystickDelta() {
        const maxDistance = 50;
        
        let dx = this.joystick.currentX - this.joystick.startX;
        let dy = this.joystick.currentY - this.joystick.startY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }
        
        this.joystick.deltaX = dx / maxDistance;
        this.joystick.deltaY = dy / maxDistance;
    }

    // 更新摇杆视觉效果
    updateJoystickVisual() {
        const stick = document.getElementById('joystick-stick');
        if (!stick) return;
        
        if (this.joystick.active) {
            const maxOffset = 35;
            const offsetX = this.joystick.deltaX * maxOffset;
            const offsetY = this.joystick.deltaY * maxOffset;
            stick.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
            stick.style.transform = 'translate(0, 0)';
        }
    }

    // 攻击
    onAttack() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        this.game.playerAttack();
    }

    // 使用物品
    onUseItem() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        // 查找可用的消耗品
        const consumables = this.game.player.inventory.filter(item => {
            const itemData = Items.getItem(item.id);
            return itemData && (itemData.type === 'food' || itemData.type === 'medicine');
        });
        
        if (consumables.length === 0) {
            Utils.showToast('没有可用物品', 'warning');
            return;
        }
        
        // 优先使用药品（如果生命值低）
        if (this.game.player.health < this.game.player.maxHealth * 0.5) {
            const medicine = consumables.find(item => {
                const itemData = Items.getItem(item.id);
                return itemData.type === 'medicine';
            });
            if (medicine) {
                this.game.player.useItem(medicine.id);
                return;
            }
        }
        
        // 优先使用食物（如果饥饿值低）
        if (this.game.player.hunger < this.game.player.maxHunger * 0.5) {
            const food = consumables.find(item => {
                const itemData = Items.getItem(item.id);
                return itemData.type === 'food';
            });
            if (food) {
                this.game.player.useItem(food.id);
                return;
            }
        }
        
        // 使用第一个可用物品
        this.game.player.useItem(consumables[0].id);
    }

    // 换弹
    onReload() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        const weapon = Items.getWeapon(this.game.player.equippedWeapon);
        if (!weapon || weapon.type !== 'ranged') {
            Utils.showToast('当前武器无需换弹', 'info');
            return;
        }
        
        const ammoCount = this.game.player.getAmmoCount(weapon.ammoType);
        if (ammoCount > 0) {
            Utils.showToast(`弹药: ${ammoCount}`, 'info');
        } else {
            Utils.showToast('弹药不足！', 'warning');
        }
    }

    // 锁定所有门
    onLockAllDoors() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        const result = this.game.lockAllDoors();
        Utils.showToast(result.message, result.success ? 'success' : 'warning');
    }

    // 交互（E键）
    onInteract() {
        if (!this.game || this.game.isPaused || this.game.isGameOver) return;
        
        // 调用UI的交互处理
        UI.handleInteraction();
    }

    // 销毁控制器
    destroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Controls;
}