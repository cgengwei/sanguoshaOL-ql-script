const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 1. 加载环境变量
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) process.env[key.trim()] = values.join('=').trim();
  });
}

const CONFIG = {
  url: 'https://web.sanguosha.com/',
  userDataDir: path.join(__dirname, 'chrome_data'),
  headless: false,
  timeout: 30000,
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  screenshotDir: path.join(__dirname, 'screenshots'),
  selectors: {
    usernameInput: '#SGS_login-account',
    passwordInput: '#SGS_login-password',
    submitButton: '#SGS_login-btn',
    agreementCheckbox: '#SGS_userProto',
    gameItemOl: 'div.game-item[gid="1100"]',
    goInGameBtn: '#goInGameBtn'
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const log = msg => console.log(`[${new Date().toLocaleString('zh-CN')}] ${msg}`);

async function takeScreenshot(page, name) {
  try {
    if (!fs.existsSync(CONFIG.screenshotDir)) fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
    const filename = path.join(CONFIG.screenshotDir, `${name}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    log(`截图已保存: ${filename}`);
  } catch (e) { log(`截图失败: ${e.message}`); }
}

async function createBrowser() {
  if (!process.env.DISPLAY) process.env.DISPLAY = ':99';
  const launchOptions = {
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1920,1080'],
    viewport: { width: 1920, height: 1080 },
  };
  if (CONFIG.chromePath && fs.existsSync(CONFIG.chromePath)) launchOptions.executablePath = CONFIG.chromePath;

  try {
    const context = await chromium.launchPersistentContext(CONFIG.userDataDir, launchOptions);
    log('Playwright 启动成功 (PersistentContext)');
    return context;
  } catch (e) {
    log(`持久化启动失败，尝试普通启动: ${e.message}`);
    const browser = await chromium.launch(launchOptions);
    log('Playwright 启动成功 (Non-Persistent)');
    return await browser.newContext(launchOptions);
  }
}

async function waitForLogin(page) {
  const timeout = 5 * 60 * 1000;
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const loggedIn = await page.evaluate(() => !!document.querySelector('div.game-item[gid="1100"]') || !!document.querySelector('.user-info'));
    if (loggedIn) return true;
    await sleep(2000);
  }
  throw new Error('等待登录超时');
}

async function login(page) {
  log('正在打开登录页面...');
  await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  if (await page.$(CONFIG.selectors.gameItemOl)) {
    log('检测到已自动登录');
  } else if (process.env.SANGUOSHA_USERNAME && process.env.SANGUOSHA_PASSWORD) {
    log('尝试账号密码登录...');
    try {
      await page.waitForSelector(CONFIG.selectors.usernameInput, { timeout: 10000 });
      await page.fill(CONFIG.selectors.usernameInput, process.env.SANGUOSHA_USERNAME);
      await page.fill(CONFIG.selectors.passwordInput, process.env.SANGUOSHA_PASSWORD);
      const checkbox = await page.$(CONFIG.selectors.agreementCheckbox);
      if (checkbox && !(await checkbox.isChecked())) {
        log('勾选协议复选框');
        await checkbox.click();
      }
      await page.click(CONFIG.selectors.submitButton);
      await sleep(5000);
      
      // 检查登录后是否需要手动验证码
      if (await page.$(CONFIG.selectors.usernameInput)) {
        log('登录失败或需要验证码，请手动完成...');
        await waitForLogin(page);
      }
    } catch (e) {
      log(`登录尝试失败: ${e.message}，请手动登录...`);
      await waitForLogin(page);
    }
  } else {
    log('未配置账号密码，请手动扫码登录...');
    await waitForLogin(page);
  }

  // 选择版本并进入
  try {
    await page.waitForSelector(CONFIG.selectors.gameItemOl, { timeout: 30000 });
    await page.click(CONFIG.selectors.gameItemOl);
    await sleep(2000);
    await page.waitForSelector('#goInGameBtn', { timeout: 10000 });
    await page.click('#goInGameBtn');
    log('已选择版本并点击进入游戏');
    
    // 等待跳转到主游戏页面（通常是 web.sanguosha.com/2/index.html 这种）
    await sleep(15000);
    await takeScreenshot(page, 'game_loaded');
  } catch (e) {
    log(`进入游戏失败: ${e.message}`);
    // 可能是已经在游戏页面了，尝试截图
    await takeScreenshot(page, 'after_login_state');
  }
}

async function main() {
  log('三国杀OL自动登录脚本启动');
  let context;
  try {
    context = await createBrowser();
    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    
    // 反检测注入
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => ({ length: 5 }) });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
    });

    await login(page);
    
    log('开始挂机，时长1分钟...');
    const totalMinutes = 120;
    for (let i = 0; i < totalMinutes; i++) {
      await sleep(60000);
      log(`挂机中... 已运行 ${i + 1} 分钟，剩余 ${totalMinutes - (i + 1)} 分钟`);
    }
    log('挂机时间到，脚本准备退出');
  } catch (e) {
    log(`脚本运行出错: ${e.message}`);
    if (e.stack) log(`堆栈信息: ${e.stack}`);
  } finally {
    if (context) {
      log('正在关闭浏览器...');
      await context.close();
    }
    log('脚本执行结束');
  }
}

main().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
