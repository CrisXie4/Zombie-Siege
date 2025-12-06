
// 游戏核心逻辑模块

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        
        // 时间
        this.lastTime = 0;
        this.deltaTime = 0;
        this.playTime = 0;
        
        // 地图设置
        this.mapWidth = 2000;
        this.mapHeight = 2000;
        this.camera = { x: 0, y: 0 };
        
        // 游戏对象
        this.player = null;
        this.homeBase = null; // 玩家家园（唯一的建筑）
        this.zombies = [];
        this.bullets = [];
        this.projectiles = []; // 僵尸投射物
        this.particles = [];
        
        // 僵尸生成器
        this.spawner = null;
        
        // 统计
        this.kills = 0;
        this.totalMoney = 0;
        
        // 交互提示
        this.interactionHint = null;
        
        // 初始化
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // 调整画布大小
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // 初始化新游戏
    init() {
        // 创建玩家家园（在地图中央）
        const homeWidth = 400;
        const homeHeight = 400;
        this.homeBase = new HomeBase({
            x: (this.mapWidth - homeWidth) / 2,
            y: (this.mapHeight - homeHeight) / 2,
            width: homeWidth,
            height: homeHeight
        });
        
        // 创建玩家（在家园中央）
        const spawnPoint = this.homeBase.getSpawnPoint();
        this.player = new Player(spawnPoint.x, spawnPoint.y, this.mapWidth, this.mapHeight);
        
        // 初始化相机位置
        this.updateCamera();
        
        // 创建僵尸生成器
        this.spawner = new ZombieSpawner(this);
        
        // 重置状态
        this.zombies = [];
        this.bullets = [];
        this.projectiles = [];
        this.particles = [];
        this.kills = 0;
        this.totalMoney = 0;
        this.playTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.interactionHint = null;
    }

    // 加载存档
    loadSave(saveData) {
        this.init();
        
        if (saveData.player) {
            this.player.deserialize(saveData.player);
        }
        
        if (saveData.homeBase) {
            this.homeBase.deserialize(saveData.homeBase);
        }
        
        if (saveData.stats) {
            this.spawner.setWave(saveData.stats.wave);
            this.kills = saveData.stats.kills;
            this.totalMoney = saveData.stats.totalMoney;
            this.playTime = saveData.stats.playTime;
        }
        
        if (saveData.inventory) {
            this.player.inventory = saveData.inventory;
        }
        
        if (saveData.equippedWeapon) {
            this.player.equippedWeapon = saveData.equippedWeapon;
        }
    }

    // 开始游戏
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    // 暂停游戏
    pause() {
        this.isPaused = true;
    }

    // 继续游戏
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    // 游戏主循环
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (!this.isPaused && !this.isGameOver) {
            this.update(this.deltaTime);
            this.playTime += this.deltaTime;
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    // 更新相机位置（跟随玩家）
    updateCamera() {
        // 相机中心对准玩家
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        
        // 限制相机在地图范围内
        this.camera.x = Utils.clamp(this.camera.x, 0, this.mapWidth - this.canvas.width);
        this.camera.y = Utils.clamp(this.camera.y, 0, this.mapHeight - this.canvas.height);
    }

    // 更新游戏状态
    update(deltaTime) {
        // 更新家园
        if (this.homeBase) {
            this.homeBase.update(deltaTime);
        }
        
        // 更新玩家（可以在整个地图移动）
        this.player.update(deltaTime, null);
        
        // 限制玩家在地图范围内
        this.player.x = Utils.clamp(this.player.x, this.player.radius, this.mapWidth - this.player.radius);
        this.player.y = Utils.clamp(this.player.y, this.player.radius, this.mapHeight - this.player.radius);
        
        // 更新相机
        this.updateCamera();
        
        // 检查玩家死亡
        if (this.player.isDead()) {
            this.gameOver();
            return;
        }
        
        // 更新僵尸生成器
        this.spawner.update(deltaTime);
        
        // 更新僵尸
        this.updateZombies(deltaTime);
        
        // 更新子弹
        this.updateBullets(deltaTime);
        
        // 更新投射物
        this.updateProjectiles(deltaTime);
        
        // 更新粒子
        this.updateParticles(deltaTime);
        
        // 检查交互
        this.checkInteractions();
        
        // 更新UI
        this.updateUI();
    }

    // 更新僵尸
    updateZombies(deltaTime) {
        this.zombies.forEach(zombie => {
            // 保存旧位置用于碰撞检测
            const oldX = zombie.x;
            const oldY = zombie.y;
            
            // 检查僵尸是否需要攻击家园的门或围墙
            // 优先级：门 > 墙 > 玩家
            const homeBaseDoor = this.findHomeBaseDoorToAttack(zombie);
            const homeBaseWall = this.findHomeBaseWallToAttack(zombie);
            
            if (homeBaseDoor) {
                // 僵尸攻击家园的门（最高优先级）
                const doorCenterX = this.homeBase.door.x + this.homeBase.door.width / 2;
                const doorCenterY = this.homeBase.door.y + this.homeBase.door.height / 2;
                zombie.update(deltaTime, { x: doorCenterX, y: doorCenterY }, null);
                
                // 直接检查僵尸到门的距离，而不是依赖aiState
                const distToDoor = Utils.distance(zombie.x, zombie.y, doorCenterX, doorCenterY);
                const attackRange = zombie.attackRange + zombie.radius + 40; // 40是门的半径
                
                if (distToDoor <= attackRange && zombie.attackCooldown <= 0) {
                    // 直接造成伤害，不通过attack方法
                    zombie.attackCooldown = zombie.attackSpeed;
                    zombie.isAttacking = true;
                    setTimeout(() => { zombie.isAttacking = false; }, 200);
                    
                    this.homeBase.damageDoor(zombie.damage);
                    this.createHitParticles(doorCenterX, doorCenterY, '#8b4513');
                }
            } else if (homeBaseWall) {
                // 僵尸攻击家园围墙（次优先级）
                zombie.update(deltaTime, { x: homeBaseWall.x, y: homeBaseWall.y }, null);
                
                // 直接检查僵尸到墙的距离
                const distToWall = Utils.distance(zombie.x, zombie.y, homeBaseWall.x, homeBaseWall.y);
                const attackRange = zombie.attackRange + zombie.radius + 20;
                
                if (distToWall <= attackRange && zombie.attackCooldown <= 0) {
                    zombie.attackCooldown = zombie.attackSpeed;
                    zombie.isAttacking = true;
                    setTimeout(() => { zombie.isAttacking = false; }, 200);
                    
                    this.homeBase.damageWall(zombie.damage * 0.5); // 围墙受到的伤害减半
                    this.createHitParticles(homeBaseWall.x, homeBaseWall.y, '#6b4423');
                }
            } else {
                // 僵尸攻击玩家（最低优先级）
                zombie.update(deltaTime, this.player, null);
                
                // 检查僵尸是否能看到玩家（视线检测）
                const canSeePlayer = this.canZombieSeePlayer(zombie);
                
                if (canSeePlayer) {
                    const attack = zombie.attack(this.player);
                    if (attack) {
                        if (attack.type === 'melee') {
                            this.player.takeDamage(attack.damage);
                        } else if (attack.type === 'ranged') {
                            this.createProjectile(attack);
                        }
                    }
                }
            }
            
            // 检查僵尸与家园围墙的碰撞
            if (this.homeBase) {
                const collision = this.homeBase.checkZombieCollision(
                    zombie.x, zombie.y, zombie.radius, oldX, oldY
                );
                if (collision.blocked) {
                    zombie.x = collision.x;
                    zombie.y = collision.y;
                }
            }
        });
        
        // 移除死亡僵尸
        this.zombies = this.zombies.filter(zombie => zombie.isAlive);
    }

    // 检查僵尸是否能看到玩家（视线检测）
    canZombieSeePlayer(zombie) {
        if (!this.homeBase) return true;
        
        // 如果僵尸和玩家都在家园内或都在家园外，可以看到
        const zombieInside = this.homeBase.isPointInside(zombie.x, zombie.y);
        const playerInside = this.homeBase.isPointInside(this.player.x, this.player.y);
        
        if (zombieInside === playerInside) {
            return true; // 同一区域，可以看到
        }
        
        // 如果一个在内一个在外，检查围墙是否阻挡
        // 围墙已被摧毁则可以看到
        if (this.homeBase.wallHealth <= 0) {
            return true;
        }
        
        // 检查门是否可以通过（门开着或损坏）
        if (this.homeBase.canZombiePassDoor()) {
            // 检查视线是否经过门的位置
            const door = this.homeBase.door;
            const doorCenterX = door.x + door.width / 2;
            const doorCenterY = door.y + door.height / 2;
            
            // 简化检测：如果僵尸靠近门，且门可以通过，则可以看到玩家
            const distToDoor = Utils.distance(zombie.x, zombie.y, doorCenterX, doorCenterY);
            if (distToDoor < 150) {
                return true;
            }
        }
        
        // 围墙阻挡视线
        return false;
    }

    // 查找僵尸需要攻击的家园门
    findHomeBaseDoorToAttack(zombie) {
        if (!this.homeBase) return null;
        
        // 检查僵尸是否在家园内
        if (this.homeBase.isPointInside(zombie.x, zombie.y)) {
            return null; // 已经在家园内，不需要攻击门
        }
        
        // 检查家园门是否锁定且未损坏
        if (this.homeBase.canZombiePassDoor()) {
            return null; // 门未锁定或已损坏，僵尸可以通过
        }
        
        // 检查玩家是否在家园内（僵尸只有在追踪家园内的玩家时才会攻击门）
        if (!this.homeBase.isPointInside(this.player.x, this.player.y)) {
            return null; // 玩家不在家园内，僵尸直接追玩家
        }
        
        // 计算僵尸到门的距离
        const doorCenterX = this.homeBase.door.x + this.homeBase.door.width / 2;
        const doorCenterY = this.homeBase.door.y + this.homeBase.door.height / 2;
        const distToDoor = Utils.distance(zombie.x, zombie.y, doorCenterX, doorCenterY);
        
        // 计算僵尸到家园中心的距离
        const homeCenterX = this.homeBase.x + this.homeBase.width / 2;
        const homeCenterY = this.homeBase.y + this.homeBase.height / 2;
        const distToHome = Utils.distance(zombie.x, zombie.y, homeCenterX, homeCenterY);
        
        // 如果僵尸靠近家园，优先攻击门
        // 门是进入家园的唯一入口，所以僵尸应该优先攻击门
        if (distToHome < this.homeBase.width + 100) {
            // 僵尸在家园附近，引导它去攻击门
            if (distToDoor < 100) {
                return this.homeBase.door; // 已经靠近门，攻击门
            }
            // 返回门作为目标，让僵尸移动到门的位置
            return this.homeBase.door;
        }
        
        return null;
    }

    // 查找僵尸需要攻击的家园围墙
    findHomeBaseWallToAttack(zombie) {
        if (!this.homeBase) return null;
        
        // 检查僵尸是否在家园内
        if (this.homeBase.isPointInside(zombie.x, zombie.y)) {
            return null; // 已经在家园内
        }
        
        // 检查玩家是否在家园内（僵尸只有在追踪家园内的玩家时才会攻击围墙）
        if (!this.homeBase.isPointInside(this.player.x, this.player.y)) {
            return null; // 玩家不在家园内，僵尸直接追玩家
        }
        
        // 检查围墙是否还有血量
        if (this.homeBase.wallHealth <= 0) {
            return null; // 围墙已被摧毁
        }
        
        // 检查门是否可以通过，如果可以则不攻击围墙
        if (this.homeBase.canZombiePassDoor()) {
            return null; // 门可以通过，僵尸会从门进入
        }
        
        // 找到僵尸最近的围墙点
        const home = this.homeBase;
        const wall = home.wallThickness;
        
        // 计算僵尸到家园各边的距离
        const distToTop = Math.abs(zombie.y - home.y);
        const distToBottom = Math.abs(zombie.y - (home.y + home.height));
        const distToLeft = Math.abs(zombie.x - home.x);
        const distToRight = Math.abs(zombie.x - (home.x + home.width));
        
        // 找到最近的边
        const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
        
        let wallPoint = null;
        
        // 根据最近的边确定攻击点
        if (minDist === distToTop && zombie.x > home.x && zombie.x < home.x + home.width) {
            wallPoint = { x: zombie.x, y: home.y + wall / 2 };
        } else if (minDist === distToBottom && zombie.x > home.x && zombie.x < home.x + home.width) {
            // 下边需要排除门的位置
            const door = home.door;
            if (zombie.x < door.x || zombie.x > door.x + door.width) {
                wallPoint = { x: zombie.x, y: home.y + home.height - wall / 2 };
            }
        } else if (minDist === distToLeft && zombie.y > home.y && zombie.y < home.y + home.height) {
            wallPoint = { x: home.x + wall / 2, y: zombie.y };
        } else if (minDist === distToRight && zombie.y > home.y && zombie.y < home.y + home.height) {
            wallPoint = { x: home.x + home.width - wall / 2, y: zombie.y };
        }
        
        // 只有当僵尸靠近围墙时才攻击
        if (wallPoint) {
            const dist = Utils.distance(zombie.x, zombie.y, wallPoint.x, wallPoint.y);
            if (dist < zombie.radius + wall + 10) {
                return wallPoint;
            }
        }
        
        return null;
    }

    // 更新子弹
    updateBullets(deltaTime) {
        this.bullets.forEach(bullet => {
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            bullet.traveled += Math.sqrt(bullet.velocityX ** 2 + bullet.velocityY ** 2);
            
            // 检查是否超出范围
            if (bullet.traveled >= bullet.range) {
                bullet.active = false;
                return;
            }
            
            // 检查是否击中僵尸
            this.zombies.forEach(zombie => {
                if (!zombie.isAlive) return;
                
                const dist = Utils.distance(bullet.x, bullet.y, zombie.x, zombie.y);
                if (dist < zombie.radius + 5) {
                    const killed = zombie.takeDamage(bullet.damage, bullet.velocityX, bullet.velocityY);
                    bullet.active = false;
                    
                    if (killed) {
                        this.onZombieKilled(zombie);
                    }
                    
                    this.createHitParticles(bullet.x, bullet.y);
                }
            });
            
            // 检查是否超出地图范围
            if (bullet.x < 0 || bullet.x > this.mapWidth || bullet.y < 0 || bullet.y > this.mapHeight) {
                bullet.active = false;
            }
        });
        
        this.bullets = this.bullets.filter(bullet => bullet.active !== false);
    }

    // 更新投射物（僵尸攻击）
    updateProjectiles(deltaTime) {
        this.projectiles.forEach(proj => {
            proj.x += proj.velocityX;
            proj.y += proj.velocityY;
            proj.traveled += Math.sqrt(proj.velocityX ** 2 + proj.velocityY ** 2);
            
            // 检查是否击中玩家
            const dist = Utils.distance(proj.x, proj.y, this.player.x, this.player.y);
            if (dist < this.player.radius + 5) {
                this.player.takeDamage(proj.damage);
                proj.active = false;
                this.createHitParticles(proj.x, proj.y, '#00ff00');
            }
            
            // 检查是否超出范围或地图边界
            if (proj.traveled >= 300 || proj.x < 0 || proj.x > this.mapWidth || proj.y < 0 || proj.y > this.mapHeight) {
                proj.active = false;
            }
        });
        
        this.projectiles = this.projectiles.filter(proj => proj.active !== false);
    }

    // 创建投射物
    createProjectile(attack) {
        const dx = attack.targetX - attack.x;
        const dy = attack.targetY - attack.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.projectiles.push({
            x: attack.x,
            y: attack.y,
            velocityX: (dx / dist) * 5,
            velocityY: (dy / dist) * 5,
            damage: attack.damage,
            traveled: 0,
            active: true
        });
    }

    // 更新粒子
    updateParticles(deltaTime) {
        this.particles.forEach(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.life -= deltaTime;
            particle.alpha = particle.life / particle.maxLife;
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
    }

    // 创建击中粒子
    createHitParticles(x, y, color = '#ff0000') {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(1, 3);
            
            this.particles.push({
                x: x,
                y: y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: color,
                size: Utils.random(3, 6),
                life: 300,
                maxLife: 300,
                alpha: 1
            });
        }
    }

    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存画布状态
        this.ctx.save();
        
        // 应用相机偏移
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 绘制地图背景
        this.renderMapBackground();
        
        // 绘制家园
        if (this.homeBase) {
            this.homeBase.render(this.ctx);
        }
        
        // 绘制粒子
        this.renderParticles();
        
        // 绘制投射物
        this.renderProjectiles();
        
        // 绘制子弹
        this.renderBullets();
        
        // 绘制僵尸
        this.zombies.forEach(zombie => zombie.render(this.ctx));
        
        // 绘制玩家
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // 恢复画布状态
        this.ctx.restore();
        
        // 绘制交互提示（在屏幕坐标系中）
        this.renderInteractionHint();
    }

    // 渲染地图背景
    renderMapBackground() {
        // 绘制地面（草地/泥土）
        this.ctx.fillStyle = '#3d5c3d';
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
        
        // 绘制网格线（帮助感知移动）
        this.ctx.strokeStyle = '#2d4c2d';
        this.ctx.lineWidth = 1;
        const gridSize = 100;
        
        for (let x = 0; x <= this.mapWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.mapHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.mapHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.mapWidth, y);
            this.ctx.stroke();
        }
        
        // 绘制地图边界
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, this.mapWidth, this.mapHeight);
    }

    // 渲染子弹
    renderBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 渲染投射物
    renderProjectiles() {
        this.ctx.fillStyle = '#00ff00';
        this.projectiles.forEach(proj => {
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    // 渲染粒子
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    // 玩家攻击
    playerAttack() {
        const attackData = this.player.attack();
        if (!attackData) return;
        
        if (attackData.type === 'melee') {
            this.meleeAttack(attackData);
        } else if (attackData.type === 'ranged' && attackData.bullets) {
            attackData.bullets.forEach(bullet => {
                bullet.active = true;
                this.bullets.push(bullet);
            });
        }
    }

    // 近战攻击 - 360度范围攻击
    meleeAttack(attackData) {
        const weapon = attackData.weapon;
        if (!weapon) return;
        
        // 攻击范围 = 玩家半径 + 武器范围
        const attackRange = this.player.radius + weapon.range;
        
        this.zombies.forEach(zombie => {
            if (!zombie.isAlive) return;
            
            // 计算玩家到僵尸的距离
            const dist = Utils.distance(this.player.x, this.player.y, zombie.x, zombie.y);
            
            // 如果僵尸在攻击范围内
            if (dist < attackRange + zombie.radius) {
                // 计算击退方向（从玩家指向僵尸）
                const dx = zombie.x - this.player.x;
                const dy = zombie.y - this.player.y;
                const knockbackDist = Math.sqrt(dx * dx + dy * dy);
                const knockbackX = knockbackDist > 0 ? dx / knockbackDist : 0;
                const knockbackY = knockbackDist > 0 ? dy / knockbackDist : 0;
                
                const killed = zombie.takeDamage(attackData.damage, knockbackX, knockbackY);
                
                if (killed) {
                    this.onZombieKilled(zombie);
                }
                
                this.createHitParticles(zombie.x, zombie.y);
            }
        });
    }

    // 僵尸被击杀
    onZombieKilled(zombie) {
        this.kills++;
        this.player.earnMoney(zombie.reward);
        this.totalMoney += zombie.reward;
        this.spawner.onZombieKilled();
        
        // 创建死亡粒子
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.randomFloat(2, 5);
            
            this.particles.push({
                x: zombie.x,
                y: zombie.y,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed,
                color: zombie.color,
                size: Utils.random(4, 8),
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    }

    // 添加僵尸
    addZombie(zombie) {
        this.zombies.push(zombie);
    }

    // 获取家园（兼容旧代码）
    getHouse() {
        return this.homeBase;
    }

    // 获取家园
    getHomeBase() {
        return this.homeBase;
    }

    // 锁定/解锁家园门
    toggleDoorLock(doorId) {
        // 现在只有家园门
        return this.toggleHomeBaseDoorLock();
    }

    // 锁定/解锁家园门
    toggleHomeBaseDoorLock() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        if (this.homeBase.door.isBroken) {
            return { success: false, message: '家园门已损坏，无法锁定' };
        }
        
        this.homeBase.toggleDoorLock();
        const status = this.homeBase.door.isLocked ? '已锁定' : '已解锁';
        return { success: true, message: `家园门${status}` };
    }

    // 锁定所有门（现在只有家园门）
    lockAllDoors() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        if (this.homeBase.door.isBroken) {
            return { success: false, message: '家园门已损坏，无法锁定' };
        }
        
        if (this.homeBase.door.isLocked) {
            return { success: false, message: '家园门已经锁定' };
        }
        
        this.homeBase.lockDoor();
        return { success: true, message: '家园门已锁定' };
    }

    // 解锁所有门
    unlockAllDoors() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        this.homeBase.unlockDoor();
        return { success: true, message: '家园门已解锁' };
    }

    // 修复门
    repairDoor(doorId) {
        return this.repairHomeBaseDoor();
    }

    // 修复家园门
    repairHomeBaseDoor() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        if (this.homeBase.door.health >= this.homeBase.door.maxHealth) {
            return { success: false, message: '家园门不需要修复' };
        }
        
        this.homeBase.repairDoor(50);
        return { success: true, message: '家园门已修复' };
    }

    // 升级门
    upgradeDoor(doorId) {
        return this.upgradeHomeBaseDoor();
    }

    // 升级家园门
    upgradeHomeBaseDoor() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        if (this.homeBase.door.level >= 5) {
            return { success: false, message: '家园门已满级' };
        }
        
        this.homeBase.upgradeDoor();
        return { success: true, message: `家园门已升级到 ${this.homeBase.door.level} 级` };
    }

    // 升级家园
    upgradeHomeBase() {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        if (this.homeBase.level >= 5) {
            return { success: false, message: '家园已满级' };
        }
        
        const cost = this.homeBase.getUpgradeCost();
        if (this.player.money < cost) {
            return { success: false, message: `金币不足！需要 ${cost} 💰` };
        }
        
        this.player.spendMoney(cost);
        this.homeBase.upgrade();
        return { success: true, message: `家园已升级到 ${this.homeBase.level} 级` };
    }

    // 存入物品到家园存储箱
    storeItemToHome(itemId, quantity = 1) {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        const invItem = this.player.inventory.find(i => i.id === itemId);
        if (!invItem || invItem.quantity < quantity) {
            return { success: false, message: '物品不足' };
        }
        
        // 先尝试存入，成功后再从背包移除
        if (this.homeBase.storeItem(itemId, quantity)) {
            this.player.removeItem(itemId, quantity);
            return { success: true, message: '物品已存入存储箱' };
        } else {
            return { success: false, message: '存储空间不足' };
        }
    }

    // 从家园存储箱取出物品
    retrieveItemFromHome(itemId, quantity = 1) {
        if (!this.homeBase) {
            return { success: false, message: '家园不存在' };
        }
        
        const result = this.homeBase.retrieveItem(itemId, quantity);
        if (result) {
            this.player.addItem(result.id, result.quantity);
            return { success: true, message: '物品已取出' };
        } else {
            return { success: false, message: '物品不存在' };
        }
    }

    // 检查交互
    checkInteractions() {
        this.interactionHint = null;
        
        if (!this.homeBase) return;
        
        // 检查是否靠近存储箱
        if (this.homeBase.isNearStorageBox(this.player.x, this.player.y)) {
            this.interactionHint = {
                text: '按 E 打开存储箱',
                type: 'storage'
            };
        }
        // 检查是否靠近床
        else if (this.homeBase.isNearBed(this.player.x, this.player.y)) {
            this.interactionHint = {
                text: '按 E 休息（恢复生命）',
                type: 'bed'
            };
        }
        // 检查是否靠近工作台
        else if (this.homeBase.isNearWorkbench(this.player.x, this.player.y)) {
            this.interactionHint = {
                text: '按 E 打开工作台',
                type: 'workbench'
            };
        }
    }

    // 执行交互
    interact() {
        if (!this.interactionHint) return { success: false, message: '附近没有可交互的物品' };
        
        switch (this.interactionHint.type) {
            case 'storage':
                // 打开存储界面（由UI处理）
                return { success: true, action: 'openStorage' };
            case 'bed':
                // 休息恢复生命
                const healAmount = this.player.heal(30);
                if (healAmount > 0) {
                    return { success: true, message: `休息恢复了 ${healAmount} 点生命` };
                } else {
                    return { success: false, message: '生命值已满' };
                }
            case 'workbench':
                // 打开工作台界面（由UI处理）
                return { success: true, action: 'openWorkbench' };
            default:
                return { success: false, message: '未知交互' };
        }
    }

    // 渲染交互提示
    renderInteractionHint() {
        if (!this.interactionHint) return;
        
        const ctx = this.ctx;
        const text = this.interactionHint.text;
        
        ctx.save();
        
        // 在屏幕底部中央显示提示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textWidth = ctx.measureText(text).width;
        const padding = 15;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 40;
        const x = this.canvas.width / 2;
        const y = this.canvas.height - 100;
        
        // 背景框
        ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
        
        // 边框
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }

    // 更新UI
    updateUI() {
        // 更新生命值
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar && healthText) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthBar.style.width = healthPercent + '%';
            healthText.textContent = Math.ceil(this.player.health);
        }
        
        // 更新饥饿值
        const hungerBar = document.getElementById('hunger-bar');
        const hungerText = document.getElementById('hunger-text');
        if (hungerBar && hungerText) {
            const hungerPercent = (this.player.hunger / this.player.maxHunger) * 100;
            hungerBar.style.width = hungerPercent + '%';
            hungerText.textContent = Math.ceil(this.player.hunger);
        }
        
        // 更新金钱
        const moneyText = document.getElementById('money-text');
        if (moneyText) {
            moneyText.textContent = this.player.money;
        }
        
        // 更新波次
        const waveText = document.getElementById('wave-text');
        if (waveText) {
            waveText.textContent = `第 ${this.spawner.getWave()} 波`;
        }
    }

    // 游戏结束
    gameOver() {
        // 检查是否有复活币
        if (this.player.getReviveTokens() > 0) {
            // 暂停游戏，显示复活确认对话框
            this.isPaused = true;
            UI.showReviveDialog(this.player.getReviveTokens());
            return;
        }
        
        // 没有复活币，真正的游戏结束
        this.finalGameOver();
    }

    // 最终游戏结束（无法复活）
    finalGameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        
        // 保存最高分
        Storage.saveHighScore({
            wave: this.spawner.getWave(),
            kills: this.kills,
            money: this.totalMoney
        });
        
        // 显示游戏结束界面
        document.getElementById('final-wave').textContent = this.spawner.getWave();
        document.getElementById('final-kills').textContent = this.kills;
        document.getElementById('final-money').textContent = this.totalMoney;
        
        UI.showScreen('gameover-screen');
    }

    // 使用复活币复活
    revivePlayer() {
        if (!this.player.useReviveToken()) {
            return false;
        }
        
        // 复活玩家
        this.player.health = this.player.maxHealth;
        this.player.hunger = Math.max(50, this.player.hunger); // 至少50饱食度
        
        // 传送到家园重生点
        if (this.homeBase) {
            const spawnPoint = this.homeBase.getSpawnPoint();
            this.player.x = spawnPoint.x;
            this.player.y = spawnPoint.y;
        }
        
        // 清除附近的僵尸（给玩家一些喘息空间）
        const safeRadius = 200;
        this.zombies = this.zombies.filter(zombie => {
            const dist = Utils.distance(zombie.x, zombie.y, this.player.x, this.player.y);
            return dist > safeRadius;
        });
        
        // 给玩家短暂无敌时间
        this.player.invincible = true;
        this.player.invincibleTimer = 3000; // 3秒无敌
        
        // 继续游戏
        this.isPaused = false;
        
        Utils.showToast('💫 你已复活！', 'success');
        
        return true;
    }

    // 拒绝复活，直接结束游戏
    declineRevive() {
        this.finalGameOver();
    }

    // 获取游戏状态（用于保存）
    getState() {
        return {
            player: this.player.serialize(),
            homeBase: this.homeBase ? this.homeBase.serialize() : null,
            inventory: this.player.inventory,
            equippedWeapon: this.player.equippedWeapon,
            stats: {
                wave: this.spawner.getWave(),
                kills: this.kills,
                totalMoney: this.totalMoney,
                playTime: this.playTime
            }
        };
    }

    // 停止游戏
    stop() {
        this.isRunning = false;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}