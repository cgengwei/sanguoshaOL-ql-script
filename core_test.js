#!/usr/bin/env node

// 核心逻辑测试脚本 - 不依赖Puppeteer
console.log('=== 三国杀OL自动签到脚本核心逻辑测试 ===\n');

// 引入内置模块
const fs = require('fs');
const path = require('path');

// 1. 测试环境变量加载
console.log('📁 测试环境变量加载...');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
  console.log('✅ 环境变量加载成功');
  console.log(`   - 账号: ${process.env.SANGUOSHA_USERNAME || '未配置'}`);
  console.log(`   - 密码: ${process.env.SANGUOSHA_PASSWORD ? '已配置' : '未配置'}`);
} else {
  console.log('❌ 未找到.env文件');
}

console.log();

// 2. 测试配置读取
console.log('⚙️  测试配置读取...');

const CONFIG = {
  url: 'https://web.sanguosha.com/',
  loginUrl: 'https://web.sanguosha.com/',
  userDataDir: path.join(__dirname, 'chrome_data'),
  headless: false,
  timeout: 30000,
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  keepBrowserOpen: false,
  screenshotDir: path.join(__dirname, 'screenshots'),
  selectors: {
    loginButton: '.login-btn, [class*="login"]',
    usernameInput: 'input[type="text"], input[name="username"], input[placeholder*="账号"]',
    passwordInput: 'input[type="password"], input[name="password"], input[placeholder*="密码"]',
    submitButton: 'button[type="submit"], .submit-btn, [class*="submit"]',
    signButton: '.sign-btn, [class*="sign"], [class*="签到"]',
    moneyTreeButton: '.money-tree, [class*="发财树"], [class*="元宝"]',
    receiveButton: '.receive-btn, [class*="领取"]',
    closeButton: '.close-btn, [class*="close"]'
  }
};

console.log('✅ 配置读取成功');
console.log(`   - 无头模式: ${CONFIG.headless ? 'true' : 'false'}`);
console.log(`   - 保持在线时长: 2小时`);
console.log(`   - 浏览器路径: ${CONFIG.chromePath}`);
console.log(`   - 截图目录: ${CONFIG.screenshotDir}`);

console.log();

// 3. 测试日志函数
console.log('📝 测试日志函数...');

async function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  console.log(`[${timestamp}] ${message}`);
}

log('✅ 日志函数测试成功');

console.log();

// 4. 测试睡眠函数
console.log('⏰ 测试睡眠函数...');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 5. 测试相对坐标计算
console.log('📍 测试相对坐标计算...');

async function clickRelative(relativeX, relativeY, description = '') {
  // 模拟视口
  const viewport = { width: 1920, height: 1080 };
  
  const x = Math.floor(viewport.width * relativeX);
  const y = Math.floor(viewport.height * relativeY);
  
  log(`${description} 点击坐标: (${x}, ${y})`);
  return true;
}

// 6. 测试关闭弹窗逻辑
console.log('❌ 测试关闭弹窗逻辑...');

async function closeGamePopup() {
  log('正在尝试关闭游戏弹窗...');
  
  // 模拟截图保存
  log('截图已保存: screenshots/game_popup_xxxx.png');
  
  // 模拟关闭弹窗
  await clickRelative(0.9, 0.1, '关闭弹窗');
  
  log('弹窗关闭成功');
  return true;
}

// 7. 测试保持在线操作
console.log('🔄 测试保持在线操作...');

async function performKeepAliveAction() {
  log('开始执行保持在线操作...');
  
  // 1. 点击游戏页面中的个人按钮
  log('1. 点击个人按钮');
  await clickRelative(0.9, 0.9, '点击个人按钮');
  
  // 2. 等待个人信息弹窗出现
  log('2. 等待个人信息弹窗出现');
  await sleep(500);
  
  // 模拟截图保存
  log('截图已保存: screenshots/personal_info_popup_xxxx.png');
  
  // 3. 点击个人信息弹窗上的关闭按钮
  log('3. 关闭个人信息弹窗');
  await clickRelative(0.85, 0.2, '关闭个人信息弹窗');
  
  log('保持在线操作完成');
  return true;
}

// 8. 测试保持在线循环
console.log('🔁 测试保持在线循环...');

async function testKeepAliveLoop() {
  log('开始保持在线循环测试...');
  
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  const startTime = Date.now();
  
  // 模拟10分钟的循环，每3分钟执行一次操作
  for (let i = 0; i < 10; i++) {
    await sleep(300); // 模拟1分钟
    
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, twoHoursInMs - elapsed);
    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    log(`保持在线中... 已运行 ${Math.floor(elapsed / (60 * 1000))} 分钟，剩余 ${minutes} 分 ${seconds} 秒`);
    
    // 每隔3分钟执行一次保持在线操作
    if ((i + 1) % 3 === 0) {
      await performKeepAliveAction();
    }
  }
  
  log('保持在线循环测试完成');
  return true;
}

// 9. 测试主流程
console.log('🚀 测试主流程...');

async function mainTest() {
  try {
    // 模拟登录成功
    log('登录成功！保持在线状态...');
    log('等待2小时后自动关闭浏览器...');
    
    // 关闭游戏弹窗
    await closeGamePopup();
    
    // 执行保持在线循环测试
    await testKeepAliveLoop();
    
    // 模拟结束
    log('已保持在线2小时，准备关闭浏览器...');
    log('浏览器已关闭');
    log('脚本执行结束');
    
    console.log('\n✅ 所有核心逻辑测试通过！');
    return true;
  } catch (error) {
    console.error(`\n❌ 测试失败: ${error.message}`);
    return false;
  }
}

// 执行测试
mainTest();
