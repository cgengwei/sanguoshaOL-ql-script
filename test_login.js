const puppeteer = require('puppeteer');
const path = require('path');

const CONFIG = {
  loginUrl: 'https://web.sanguosha.com/login/index.html',
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  username: 'cgengwei',
  password: 'Cgengwei123'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CONFIG.chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  console.log('浏览器启动成功');
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('打开登录页面...');
  await page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);
  
  console.log('输入账号密码...');
  await page.type('input[placeholder*="账号"]', CONFIG.username);
  await sleep(500);
  await page.type('input[placeholder*="密码"]', CONFIG.password);
  await sleep(1000);
  
  console.log('勾选协议...');
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log(`找到 ${checkboxes.length} 个复选框`);
  
  for (let i = 0; i < checkboxes.length; i++) {
    try {
      const isChecked = await (await checkboxes[i].getProperty('checked')).jsonValue();
      if (!isChecked) {
        console.log(`勾选第 ${i + 1} 个复选框`);
        await checkboxes[i].click();
        await sleep(500);
      }
    } catch (e) {
      console.log(`勾选第 ${i + 1} 个复选框失败: ${e.message}`);
    }
  }
  
  await sleep(1000);
  
  console.log('查找登录按钮...');
  const loginButton = await page.$('#SGS_login-btn');
  
  if (loginButton) {
    console.log('找到登录游戏按钮');
    
    try {
      await loginButton.click();
      console.log('已点击登录游戏按钮');
    } catch (e) {
      console.log(`点击失败: ${e.message}`);
      console.log('尝试使用JavaScript点击...');
      await page.evaluate(() => {
        const btn = document.querySelector('#SGS_login-btn');
        if (btn) btn.click();
      });
      console.log('已使用JavaScript点击');
    }
    
    console.log('等待页面加载...');
  await sleep(10000);
  } else {
    console.log('未找到登录游戏按钮');
  }
  
  console.log('等待页面跳转...');
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const currentUrl = page.url();
    console.log(`等待中... 当前URL: ${currentUrl}`);
    
    if (!currentUrl.includes('login')) {
      console.log('页面已跳转！');
      break;
    }
    
    if (i === 29) {
      console.log('等待超时，可能需要手动登录');
    }
  }
  
  console.log('保持浏览器打开，请手动查看...');
  await new Promise(() => {});
}

testLogin().catch(console.error);