
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// 1. 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const APP_ID = '201906176073'; // 直接硬编码
const APP_SECRET = '39fe382fb26565d0c0cd071c43689ebf'; // 直接硬编码
const API_URL = 'https://api.xunhupay.com/payment/do.html'; // 恢复主域名

console.log('--- 虎皮椒支付调试脚本 (主域名) ---');
console.log(`测试 APPID: "${APP_ID}"`);
console.log(`测试 SECRET: "${APP_SECRET ? '******' : '未配置'}"`);

if (!APP_ID || !APP_SECRET) {
    console.error('错误: .env.local 中缺少 XUNHU_APP_ID 或 XUNHU_APP_SECRET');
    process.exit(1);
}

// 2. 签名函数 (与项目逻辑一致)
function generateHash(data, secret) {
    const sortedKeys = Object.keys(data).sort();
    const pairs = [];

    for (const key of sortedKeys) {
        const value = data[key];
        if (value !== '' && value !== null && value !== undefined && key !== 'hash') {
            pairs.push(`${key}=${value}`);
        }
    }

    // 尝试方式 B: 直接拼接 Secret
    const signString = pairs.join('&') + secret;
    console.log(`\n待签名字符串 (直接拼接模式): ${signString}`);

    return crypto.createHash('md5').update(signString).digest('hex');
}

// 3. 构造请求参数
// 3. 构造请求参数 (强制所有值为纯净字符串)
const params = {
    version: '1.1',
    appid: APP_ID,
    trade_order_id: String('TEST' + Date.now()),
    total_fee: '1.00', // 使用标准的两位小数
    title: 'TestOrder', // 纯字母
    time: String(Math.floor(Date.now() / 1000)),
    notify_url: 'https://pikadesign.me/api/payment/notify', // 纯净URL
    return_url: 'https://pikadesign.me/pricing', // 移除参数尝试
    nonce_str: Math.random().toString(36).substring(2, 12),
};

params.hash = generateHash(params, APP_SECRET);
console.log(`生成签名: ${params.hash}`);

// 4. 发起请求 (使用 curl.exe 绕过 Node.js 网络解析问题)
const { execSync } = require('child_process');

async function runTest() {
    console.log('\n正在发起请求到虎皮椒 (通过 curl.exe)...');

    const postData = new URLSearchParams();
    for (const key in params) {
        postData.append(key, params[key]);
    }
    const postDataString = postData.toString();

    try {
        const cmd = `curl.exe -s -X POST -H "Referer: https://pikadesign.me" -H "User-Agent: Mozilla/5.0" -d "${postDataString}" "${API_URL}"`;
        const responseBody = execSync(cmd).toString();

        try {
            const result = JSON.parse(responseBody);
            console.log('\n--- 虎皮椒返回结果 ---');
            console.log(JSON.stringify(result, null, 2));

            if (result.errcode === 0) {
                console.log('\n✅ 接口调用成功!');
                console.log(`支付链接: ${result.url}`);
            } else if (result.errcode === 29) {
                console.log('\n❌ 接口调用失败: "29 未知的APPID"');
                console.log('原因分析: 这通常意味着 APPID 不存在、未激活，或者与当前请求的支付渠道不匹配。');
                console.log('建议: 请登录虎皮椒后台核对 APPID (201906176073) 是否属于“我的支付渠道”中已激活的条目。');
            } else {
                console.log('\n❌ 接口调用失败:', result.errmsg || '未知错误');
            }
        } catch (e) {
            console.log('\n解析返回结果失败 (可能不是 JSON):', responseBody);
        }
    } catch (e) {
        console.error('\n执行 curl 异常:', e.message);
    }
}

runTest();
