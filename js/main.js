// 主入口文件 - 初始化游戏

// 全局游戏实例
let game = null;
let controls = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧟 僵尸围城 - 游戏初始化中...');
    
    // 获取画布
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('找不到游戏画布！');
        return;
    }
    
    // 创建游戏实例
    game = new Game(canvas);
    
    // 创建控制器
    controls = new Controls(game);
    
    // 初始化UI
    UI.init(game);
    
    // 阻止默认触摸行为（防止页面滚动）
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('#game-screen')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 阻止双击缩放
    document.body.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });
    
    // 处理页面可见性变化（切换标签页时暂停）
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game && game.isRunning && !game.isPaused) {
            UI.pauseGame();
        }
    });
    
    // 处理窗口失焦
    window.addEventListener('blur', () => {
        if (game && game.isRunning && !game.isPaused && !game.isGameOver) {
            // 停止玩家移动
            if (game.player) {
                game.player.stop();
            }
        }
    });
    
    // 键盘快捷键提示（桌面端）
    if (!Utils.isTouchDevice()) {
        console.log('⌨️ 键盘控制:');
        console.log('  WASD / 方向键 - 移动');
        console.log('  空格 / J - 攻击');
        console.log('  E / K - 使用物品');
        console.log('  R - 查看弹药');
        console.log('  B - 商店');
        console.log('  I - 背包');
        console.log('  ESC - 暂停');
    }
    
    console.log('✅ 游戏初始化完成！');
});

// 防止右键菜单
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#game-screen')) {
        e.preventDefault();
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('游戏错误:', e.error);
});

// 性能监控（开发用）
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    
    const updateFps = () => {
        frameCount++;
        const now = performance.now();
        
        if (now - lastFpsUpdate >= 1000) {
            // console.log(`FPS: ${frameCount}`);
            frameCount = 0;
            lastFpsUpdate = now;
        }
        
        requestAnimationFrame(updateFps);
    };
    
    // updateFps(); // 取消注释以启用FPS监控
}