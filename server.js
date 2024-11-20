const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 使用 JSON 中间件
app.use(bodyParser.json());

// 存储激活信息（实际项目中应该使用数据库）
const activations = new Map();

// 生成激活码
function generateActivationCode(deviceId) {
    const key = "your_secret_key_123";
    const input = `${deviceId}${key}`;
    return crypto
        .createHash('sha256')
        .update(input)
        .digest('hex')
        .substring(0, 16);
}

// 检查试用状态
app.post('/api/trial/check', (req, res) => {
    console.log('收到试用检查请求:', req.body);
    const { deviceId } = req.body;
    
    const deviceInfo = activations.get(deviceId);
    
    if (deviceInfo?.activated) {
        res.json({
            canTrial: false,
            isActivated: true,
            activationCode: deviceInfo.activationCode
        });
    } else {
        const now = Date.now();
        const trialEndTime = deviceInfo?.trialEndTime || (now + 60 * 1000); // 1分钟试用期
        
        res.json({
            canTrial: now < trialEndTime,
            remainingTime: Math.max(0, trialEndTime - now),
            trialEndTime: trialEndTime
        });
    }
});

// 激活设备
app.post('/api/activate', (req, res) => {
    console.log('收到激活请求:', req.body);
    const { deviceId, activationCode } = req.body;
    
    const expectedCode = generateActivationCode(deviceId);
    console.log('设备ID:', deviceId);
    console.log('收到的激活码:', activationCode);
    console.log('期望的激活码:', expectedCode);
    
    if (activationCode.toLowerCase() === expectedCode.toLowerCase()) {
        activations.set(deviceId, {
            activated: true,
            activationCode: activationCode,
            activationTime: Date.now()
        });
        
        res.json({ success: true, message: "激活成功" });
    } else {
        res.json({ success: false, message: "激活码无效" });
    }
});

// 健康检查接口
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Activation server is running' });
});

app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});
