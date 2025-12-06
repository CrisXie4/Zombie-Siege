// Node.js 服务器 - 僵尸围城游戏

const http = require('http');
const fs = require('fs');
const path = require('path');

// 服务器配置
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 解析URL
    let url = req.url;
    
    // 默认页面
    if (url === '/') {
        url = '/index.html';
    }
    
    // 构建文件路径
    const filePath = path.join(__dirname, url);
    
    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    
    // 获取MIME类型
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // 读取并发送文件
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - 页面未找到</h1><p>请检查URL是否正确。</p>');
            } else {
                // 服务器错误
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 - 服务器错误</h1>');
            }
            return;
        }
        
        // 设置响应头
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        
        // 发送文件内容
        res.end(data);
    });
});

// 启动服务器
server.listen(PORT, HOST, () => {
    console.log('');
    console.log('🧟 ================================');
    console.log('🧟   僵尸围城 - 游戏服务器');
    console.log('🧟 ================================');
    console.log('');
    console.log(`📡 服务器运行中...`);
    console.log(`🌐 本地访问: http://localhost:${PORT}`);
    console.log(`📱 局域网访问: http://${getLocalIP()}:${PORT}`);
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('');
});

// 获取本地IP地址
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    
    return 'localhost';
}

// 错误处理
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请尝试其他端口。`);
        console.log(`💡 提示: 使用 PORT=3001 node server.js 指定其他端口`);
    } else {
        console.error('服务器错误:', err);
    }
    process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});