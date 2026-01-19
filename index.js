const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

const CONFIG = {
  url: 'https://web.sanguosha.com/',
  loginUrl: 'https://web.sanguosha.com/',
  userDataDir: path.join(__dirname, 'chrome_data'),
  headless: false, // 本地测试设置为false，显示浏览器界面
  timeout: 30000,
  chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  keepBrowserOpen: false,
  screenshotDir: path.join(__dirname, 'screenshots'),
  selectors: {
    loginButton: '.login-btn, [class*="login"]',
    usernameInput: '#SGS_login-account',
    passwordInput: '#SGS_login-password',
    submitButton: 'button[type="submit"], .submit-btn, [class*="submit"]',
    signButton: '.sign-btn, [class*="sign"], [class*="签到"]',
    moneyTreeButton: '.money-tree, [class*="发财树"], [class*="元宝"]',
    receiveButton: '.receive-btn, [class*="领取"]',
    closeButton: '.close-btn, [class*="close"]'
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function log(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  console.log(`[${timestamp}] ${message}`);
}

async function takeScreenshot(page, name) {
  try {
    if (!fs.existsSync(CONFIG.screenshotDir)) {
      fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(CONFIG.screenshotDir, `${name}_${timestamp}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    log(`截图已保存: ${filename}`);
    return filename;
  } catch (error) {
    log(`截图失败: ${error.message}`);
    return null;
  }
}

async function clickAt(page, x, y, description = '') {
  try {
    await page.mouse.move(x, y);
    await sleep(500);
    await page.mouse.down();
    await sleep(100);
    await page.mouse.up();
    log(`${description} 点击坐标: (${x}, ${y})`);
    return true;
  } catch (error) {
    log(`${description} 点击失败: ${error.message}`);
    return false;
  }
}

async function clickRelative(page, relativeX, relativeY, description = '') {
  try {
    const viewport = page.viewport();
    if (!viewport) {
      throw new Error('无法获取视口大小');
    }
    
    const x = Math.floor(viewport.width * relativeX);
    const y = Math.floor(viewport.height * relativeY);
    
    return await clickAt(page, x, y, description);
  } catch (error) {
    log(`${description} 相对坐标点击失败: ${error.message}`);
    return false;
  }
}

async function closeGamePopup(page) {
  log('正在尝试关闭游戏弹窗...');
  
  // 截图保存以便分析
  await takeScreenshot(page, 'game_popup');
  
  // 假设弹窗关闭按钮在右上角，使用相对坐标点击
  // 这里使用相对坐标(0.9, 0.1)，即右上角区域
  const success = await clickRelative(page, 0.9, 0.1, '关闭弹窗');
  
  if (success) {
    log('弹窗关闭成功');
  } else {
    log('弹窗关闭失败，可能需要调整坐标');
  }
  
  await sleep(2000);
  return success;
}

async function performKeepAliveAction(page) {
  log('开始执行保持在线操作...');
  
  // 1. 点击游戏页面中的个人按钮
  // 假设个人按钮在右下角，使用相对坐标(0.9, 0.9)
  log('1. 点击个人按钮');
  await clickRelative(page, 0.9, 0.9, '点击个人按钮');
  await sleep(3000);
  
  // 2. 等待个人信息弹窗出现
  log('2. 等待个人信息弹窗出现');
  await sleep(2000);
  await takeScreenshot(page, 'personal_info_popup');
  
  // 3. 点击个人信息弹窗上的关闭按钮
  log('3. 关闭个人信息弹窗');
  // 假设关闭按钮在弹窗右上角，使用相对坐标(0.85, 0.2)
  await clickRelative(page, 0.85, 0.2, '关闭个人信息弹窗');
  await sleep(2000);
  
  log('保持在线操作完成');
}

async function createBrowser() {
  log('正在配置浏览器选项...');
  
  let chromePath = CONFIG.chromePath;
  
  try {
    log('正在检查Chrome浏览器路径...');
    if (fs.existsSync(chromePath)) {
      log(`找到Chrome浏览器: ${chromePath}`);
    } else {
      log('默认Chrome路径不存在，尝试查找系统Chrome...');
      try {
        chromePath = execSync('which "Google Chrome"').toString().trim();
        log(`找到Chrome: ${chromePath}`);
      } catch {
        log('未找到Chrome浏览器，尝试使用Chromium...');
        try {
          chromePath = execSync('which chromium').toString().trim();
          log(`找到Chromium: ${chromePath}`);
        } catch {
          log('未找到Chromium');
          chromePath = undefined;
        }
      }
    }
  } catch (error) {
    log(`查找Chrome失败: ${error.message}`);
    log('将使用Puppeteer自带的Chromium');
    chromePath = undefined;
  }
  
  const options = {
    headless: true, // 强制使用无头模式，适合服务器环境
    userDataDir: CONFIG.userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--no-xshm',
      '--ignore-certificate-errors',
      '--disable-extensions',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      '--headless=new', // 现代无头模式
      '--disable-gpu-sandbox',
      '--disable-ipc-flooding-protection',
      '--disable-breakpad',
      '--disable-crash-reporter',
      '--disable-logging',
      '--disable-metrics',
      '--disable-metrics-reporting',
      '--disable-features=HttpsFirstBalancedModeAutoEnable',
      '--single-process',
      '--no-zygote',
      '--no-first-run',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      // 添加解决DBus和X服务器问题的参数
      '--disable-dbus',
      '--no-dbus',
      '--disable-xdg-runtime',
      '--display=:99',
      '--ignore-gpu-blacklist',
      '--ozone-platform=headless',
      '--use-gl=swiftshader',
      '--disable-crash-reporter',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=9222',
      '--disable-features=VizDisplayCompositor'
    ]
  };
  
  if (chromePath) {
    options.executablePath = chromePath;
  }
  
  log('正在启动Chrome浏览器...');
  try {
    const browser = await puppeteer.launch(options);
    log('Chrome浏览器启动成功');
    return browser;
  } catch (error) {
    log(`浏览器启动失败: ${error.message}`);
    log('尝试不使用userDataDir重新启动...');
    
    // 创建不包含userDataDir的新选项对象
    const optionsWithoutUserDataDir = {
      ...options,
      userDataDir: undefined
    };
    
    const browser = await puppeteer.launch(optionsWithoutUserDataDir);
    log('浏览器重新启动成功（不使用userDataDir）');
    return browser;
  }
}

async function login(page, username, password) {
  log('正在打开登录页面...');
  
  try {
    await page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    log('页面加载成功');
  } catch (error) {
    log(`页面加载失败: ${error.message}`);
    log('尝试使用主域名重新访问...');
    try {
      await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
      log('主页加载成功');
    } catch (retryError) {
      log(`主页加载也失败: ${retryError.message}`);
      log('请手动在浏览器中导航到三国杀OL官网');
    }
  }
  
  await sleep(3000);
  
  const isLoggedIn = await page.evaluate(() => {
    const loginIndicators = [
      '.user-info',
      '[class*="avatar"]',
      '[class*="user"]',
      '.login-success',
      '.logged-in',
      '.user-name',
      '[class*="nickname"]'
    ];
    return loginIndicators.some(selector => document.querySelector(selector) !== null);
  });
  
  const currentUrl = page.url();
  log(`当前页面URL: ${currentUrl}`);
  
  if (isLoggedIn && !currentUrl.includes('login')) {
    log('检测到已登录状态');
    return true;
  }
  
  if (username && password) {
    log('尝试使用账号密码登录...');
    
    try {
      let loginFrame = null;
      
      // 检查是否存在iframe，可能登录表单在iframe中
      const iframes = await page.$$('iframe');
      if (iframes.length > 0) {
        log(`发现 ${iframes.length} 个iframe，尝试在iframe中查找登录表单...`);
        for (let i = 0; i < iframes.length; i++) {
          try {
            const frame = await iframes[i].contentFrame();
            if (frame) {
              // 先尝试查找登录按钮，确定是否是登录iframe
              const hasLoginBtn = await frame.$eval('#SGS_login-btn, button[type="submit"]', el => el !== null).catch(() => false);
              if (hasLoginBtn) {
                log(`在第 ${i + 1} 个iframe中找到登录按钮，这是登录iframe`);
                loginFrame = frame;
                break;
              }
              
              // 如果没找到登录按钮，再尝试查找输入框
              const hasUsernameInput = await frame.$eval(CONFIG.selectors.usernameInput, el => el !== null).catch(() => false);
              const hasPasswordInput = await frame.$eval(CONFIG.selectors.passwordInput, el => el !== null).catch(() => false);
              if (hasUsernameInput || hasPasswordInput) {
                log(`在第 ${i + 1} 个iframe中找到登录输入框`);
                loginFrame = frame;
                break;
              }
            }
          } catch (e) {
            log(`检查第 ${i + 1} 个iframe时出错: ${e.message}`);
          }
        }
      }
      
      if (loginFrame) {
        log('在iframe中执行登录操作...');
        // 在iframe中输入账号密码
        await loginFrame.waitForSelector(CONFIG.selectors.usernameInput, { timeout: 10000 });
        await loginFrame.type(CONFIG.selectors.usernameInput, username);
        
        await loginFrame.waitForSelector(CONFIG.selectors.passwordInput, { timeout: 10000 });
        await loginFrame.type(CONFIG.selectors.passwordInput, password);
        
        await sleep(1000);
      } else {
        // 如果不在iframe中，直接在页面中查找
        log('在主页面中查找登录表单...');
        // 使用更长的超时时间，并且使用更灵活的选择器
        const usernameSelectors = ['#SGS_login-account', 'input[type="text"]', 'input[name="username"]', 'input[placeholder*="账号"]', 'input[id*="account"]', 'input[id*="username"]'];
        const passwordSelectors = ['#SGS_login-password', 'input[type="password"]', 'input[name="password"]', 'input[placeholder*="密码"]', 'input[id*="password"]'];
        
        let foundUsername = false;
        let foundPassword = false;
        
        // 尝试所有可能的账号选择器
        for (const selector of usernameSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            await page.type(selector, username);
            log(`使用选择器 "${selector}" 成功输入账号`);
            foundUsername = true;
            break;
          } catch (e) {
            log(`尝试选择器 "${selector}" 失败: ${e.message}`);
          }
        }
        
        // 尝试所有可能的密码选择器
        for (const selector of passwordSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            await page.type(selector, password);
            log(`使用选择器 "${selector}" 成功输入密码`);
            foundPassword = true;
            break;
          } catch (e) {
            log(`尝试选择器 "${selector}" 失败: ${e.message}`);
          }
        }
        
        if (!foundUsername || !foundPassword) {
          log('无法找到账号或密码输入框，尝试截图分析...');
          await takeScreenshot(page, 'login_page_debug');
          throw new Error('无法找到登录输入框');
        }
        
        await sleep(1000);
      }
      
      log('正在查找并勾选协议...');
      
      try {
        const agreementSelectors = [
          'input[type="checkbox"]',
          '.agreement-checkbox',
          '[class*="agreement"]',
          '[class*="protocol"]',
          '[class*="checkbox"]'
        ];
        
        let checkboxes = [];
        const activePage = loginFrame || page;
        
        for (const selector of agreementSelectors) {
          try {
            checkboxes = await activePage.$$(selector);
            if (checkboxes.length > 0) {
              log(`找到 ${checkboxes.length} 个复选框: ${selector}`);
              break;
            }
          } catch (e) {
          }
        }
        
        if (checkboxes.length > 0) {
          for (let i = 0; i < checkboxes.length; i++) {
            try {
              const isChecked = await (await checkboxes[i].getProperty('checked')).jsonValue();
              if (!isChecked) {
                log(`勾选第 ${i + 1} 个协议复选框`);
                await checkboxes[i].click();
                await sleep(500);
              } else {
                log(`第 ${i + 1} 个协议复选框已勾选`);
              }
            } catch (e) {
              log(`勾选第 ${i + 1} 个协议复选框失败: ${e.message}`);
            }
          }
        } else {
          log('未找到协议复选框，可能已勾选或页面结构不同');
        }
      } catch (error) {
        log(`勾选协议过程出错: ${error.message}`);
        log('继续尝试登录...');
      }
      
      await sleep(1000);
      
      log('正在查找并点击登录游戏按钮...');
      
      try {
        const activePage = loginFrame || page;
        const loginButton = await activePage.$('#SGS_login-btn');
        
        if (loginButton) {
          log('找到登录游戏按钮');
          await loginButton.click();
          log('已点击登录游戏按钮');
        } else {
          log('未找到登录游戏按钮，尝试使用备用方法');
          await activePage.click(CONFIG.selectors.submitButton);
        }
      } catch (error) {
        log(`点击登录按钮失败: ${error.message}`);
        log('尝试使用备用方法点击...');
        try {
          const activePage = loginFrame || page;
          await activePage.click(CONFIG.selectors.submitButton);
        } catch (e) {
          log('所有点击方法都失败，请手动点击登录按钮');
        }
      }
      
      log('等待游戏加载...');
      
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        
        const hasGameItem = await page.evaluate(() => {
          return document.querySelector('#gameItemOl') !== null;
        });
        
        if (hasGameItem) {
          log('检测到游戏版本选择页面');
          break;
        }
        
        if (i === 29) {
          log('等待超时，可能需要手动登录');
        }
      }
      
      const loginSuccess = await page.evaluate(() => {
        const loginIndicators = [
          '.user-info',
          '[class*="avatar"]',
          '[class*="user"]',
          '.login-success',
          '.logged-in',
          '.user-name',
          '[class*="nickname"]',
          '.game-container',
          '[class*="game"]',
          '#gameItemOl'
        ];
        return loginIndicators.some(selector => document.querySelector(selector) !== null);
      });
      
      if (loginSuccess) {
        log('登录成功！');
        
        log('正在选择三国杀OL版本...');
        await sleep(2000);
        
        try {
          const gameItemOl = await page.$('#gameItemOl');
          if (gameItemOl) {
            log('找到三国杀OL版本，点击选择...');
            await gameItemOl.click();
            await sleep(1000);
          } else {
            log('未找到三国杀OL版本选项');
          }
        } catch (e) {
          log(`点击三国杀OL版本失败: ${e.message}`);
        }
        
        log('正在点击进入游戏按钮...');
        await sleep(1000);
        
        try {
          const goInGameBtn = await page.$('#goInGameBtn');
          if (goInGameBtn) {
            log('找到进入游戏按钮，点击...');
            await goInGameBtn.click();
            log('已点击进入游戏按钮');
          } else {
            log('未找到进入游戏按钮');
          }
        } catch (e) {
          log(`点击进入游戏按钮失败: ${e.message}`);
        }
        
        log('等待页面跳转到游戏页面...');
        await sleep(10000);
        
        for (let i = 0; i < 60; i++) {
          await sleep(1000);
          
          const currentUrl = page.url();
          log(`等待中... 当前URL: ${currentUrl}`);
          
          if (!currentUrl.includes('login') && !currentUrl.includes('index.html')) {
            log('页面已跳转到游戏页面！');
            
            log('等待游戏页面完全加载...');
            await sleep(15000);
            
            log('游戏页面加载等待完成，准备执行签到操作');
            break;
          }
          
          if (i === 59) {
            log('等待超时，继续执行后续任务');
          }
        }
        
        await sleep(5000);
        
        return true;
      } else {
        log('账号密码登录失败，可能需要验证码或其他验证方式');
        
        log('请手动完成登录（支持扫码登录）');
        log('脚本将自动检测登录状态...');
        
        await waitForLogin(page);
        
        return true;
      }
    } catch (error) {
      log(`登录过程出错: ${error.message}`);
      
      log('请手动完成登录（支持扫码登录）');
      log('脚本将自动检测登录状态...');
      
      await waitForLogin(page);
      
      return true;
    }
  }
  
  return false;
}

async function waitForLogin(page) {
  // 添加超时机制，避免无限等待
  const timeoutMs = 5 * 60 * 1000; // 5分钟超时
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const currentUrl = page.url();
      const isLoggedIn = await page.evaluate(() => {
        const selectors = [
          '.user-info',
          '[class*="avatar"]',
          '[class*="user"]',
          '.login-success',
          '.logged-in',
          '.user-name',
          '[class*="nickname"]'
        ];
        return selectors.some(selector => document.querySelector(selector) !== null);
      });
      
      if (isLoggedIn && !currentUrl.includes('login')) {
        log(`检测到登录成功！当前URL: ${currentUrl}`);
        
        if (!currentUrl.includes('web.sanguosha.com')) {
          log('正在导航到主页...');
          await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
          await sleep(2000);
        }
        
        return true;
      }
      
      await sleep(2000);
    } catch (error) {
      log(`等待登录过程中出错: ${error.message}`);
      await sleep(2000);
    }
  }
  
  throw new Error('等待登录超时，请检查是否已完成登录');
}

async function doSignIn(page) {
  log('开始执行签到...');
  
  try {
    log('当前游戏页面，准备查找签到按钮...');
    await sleep(2000);
    
    await takeScreenshot(page, 'signin_page');
    
    log('正在查找签到按钮...');
    
    const signSelectors = [
      '.sign-btn',
      '[class*="sign"]',
      '[class*="签到"]',
      'a:contains("签到")',
      'button:contains("签到")',
      '.daily-sign',
      '.check-in'
    ];
    
    let signButton = null;
    for (const selector of signSelectors) {
      try {
        signButton = await page.$(selector);
        if (signButton) {
          log(`找到签到按钮: ${selector}`);
          break;
        }
      } catch (e) {
      }
    }
    
    if (signButton) {
      await signButton.click();
      await sleep(2000);
      log('签到成功！');
    } else {
      log('未找到签到按钮，可能已经签到过或页面结构已变化');
      
      const pageContent = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, div'));
        return buttons
          .filter(btn => btn.textContent && (btn.textContent.includes('签到') || btn.textContent.includes('签') || btn.textContent.includes('每日')))
          .map(btn => ({
            tag: btn.tagName,
            text: btn.textContent.trim().substring(0, 50),
            class: btn.className,
            id: btn.id,
            onclick: btn.onclick ? 'has-onclick' : 'no-onclick'
          }))
          .slice(0, 10);
      });
      
      log('页面中可能的签到元素:');
      if (pageContent.length === 0) {
        log('  未找到包含"签到"文字的元素');
        
        const allButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons
            .filter(btn => btn.textContent && btn.textContent.trim())
            .map(btn => ({
              tag: btn.tagName,
              text: btn.textContent.trim().substring(0, 30),
              class: btn.className,
              id: btn.id
            }))
            .slice(0, 20);
        });
        
        log('页面中的前20个按钮/链接:');
        allButtons.forEach((item, index) => {
          log(`  ${index + 1}. ${item.tag} - "${item.text}" - class: ${item.class}`);
        });
      } else {
        pageContent.forEach((item, index) => {
          log(`  ${index + 1}. ${item.tag} - "${item.text}" - class: ${item.class} - onclick: ${item.onclick}`);
        });
      }
    }
    
    const closeSelectors = ['.close-btn', '[class*="close"]', '.modal-close', '[aria-label*="关闭"]'];
    let closeButton = null;
    for (const selector of closeSelectors) {
      try {
        closeButton = await page.$(selector);
        if (closeButton) {
          await closeButton.click();
          await sleep(1000);
          break;
        }
      } catch (e) {
      }
    }
  } catch (error) {
    log(`签到过程出错: ${error.message}`);
  }
}

async function collectMoneyTree(page) {
  log('开始领取发财树元宝...');
  
  try {
    log('正在查找发财树入口...');
    
    const moneyTreeSelectors = [
      '.money-tree',
      '[class*="发财树"]',
      '[class*="元宝"]',
      '[class*="money"]',
      'a:contains("发财树")',
      'button:contains("发财树")',
      'a:contains("元宝")',
      'button:contains("元宝")'
    ];
    
    let moneyTreeButton = null;
    for (const selector of moneyTreeSelectors) {
      try {
        moneyTreeButton = await page.$(selector);
        if (moneyTreeButton) {
          log(`找到发财树入口: ${selector}`);
          break;
        }
      } catch (e) {
      }
    }
    
    if (moneyTreeButton) {
      await moneyTreeButton.click();
      await sleep(2000);
      
      log('正在查找领取按钮...');
      
      const receiveSelectors = [
        '.receive-btn',
        '[class*="领取"]',
        'button:contains("领取")',
        'a:contains("领取")',
        '.claim-btn',
        '[class*="claim"]'
      ];
      
      let receiveButton = null;
      for (const selector of receiveSelectors) {
        try {
          receiveButton = await page.$(selector);
          if (receiveButton) {
            log(`找到领取按钮: ${selector}`);
            break;
          }
        } catch (e) {
        }
      }
      
      if (receiveButton) {
        await receiveButton.click();
        await sleep(2000);
        log('发财树元宝领取成功！');
      } else {
        log('未找到领取按钮，可能已经领取过');
        
        const pageContent = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, div'));
          return buttons
            .filter(btn => btn.textContent && (btn.textContent.includes('领取') || btn.textContent.includes('元宝')))
            .map(btn => ({
              tag: btn.tagName,
              text: btn.textContent.trim().substring(0, 50),
              class: btn.className,
              id: btn.id,
              onclick: btn.onclick ? 'has-onclick' : 'no-onclick'
            }))
            .slice(0, 10);
        });
        
        log('页面中可能的领取元素:');
        if (pageContent.length === 0) {
          log('  未找到包含"领取"或"元宝"文字的元素');
        } else {
          pageContent.forEach((item, index) => {
            log(`  ${index + 1}. ${item.tag} - "${item.text}" - class: ${item.class} - onclick: ${item.onclick}`);
          });
        }
      }
      
      const closeSelectors = ['.close-btn', '[class*="close"]', '.modal-close', '[aria-label*="关闭"]'];
      let closeButton = null;
      for (const selector of closeSelectors) {
        try {
          closeButton = await page.$(selector);
          if (closeButton) {
            await closeButton.click();
            await sleep(1000);
            break;
          }
        } catch (e) {
        }
      }
    } else {
      log('未找到发财树入口');
      
      const pageContent = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, div'));
        return buttons
          .filter(btn => btn.textContent && (btn.textContent.includes('发财树') || btn.textContent.includes('元宝') || btn.textContent.includes('money')))
          .map(btn => ({
            tag: btn.tagName,
            text: btn.textContent.trim().substring(0, 50),
            class: btn.className,
            id: btn.id,
            onclick: btn.onclick ? 'has-onclick' : 'no-onclick'
          }))
          .slice(0, 10);
      });
      
      log('页面中可能的发财树元素:');
      if (pageContent.length === 0) {
        log('  未找到包含"发财树"、"元宝"或"money"文字的元素');
        
        const allButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          return buttons
            .filter(btn => btn.textContent && btn.textContent.trim())
            .map(btn => ({
              tag: btn.tagName,
              text: btn.textContent.trim().substring(0, 30),
              class: btn.className,
              id: btn.id
            }))
            .slice(0, 20);
        });
        
        log('页面中的前20个按钮/链接:');
        allButtons.forEach((item, index) => {
          log(`  ${index + 1}. ${item.tag} - "${item.text}" - class: ${item.class}`);
        });
      } else {
        pageContent.forEach((item, index) => {
          log(`  ${index + 1}. ${item.tag} - "${item.text}" - class: ${item.class} - onclick: ${item.onclick}`);
        });
      }
    }
  } catch (error) {
    log(`领取发财树元宝过程出错: ${error.message}`);
  }
}

async function main() {
  const username = process.env.SANGUOSHA_USERNAME;
  const password = process.env.SANGUOSHA_PASSWORD;
  
  log('三国杀OL自动登录脚本启动');
  log(`账号: ${username}`);
  
  let browser;
  try {
    log('正在启动浏览器...');
    browser = await createBrowser();
    log('浏览器启动成功');
    
    log('正在打开登录页面...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await login(page, username, password);
    
    log('登录成功！等待游戏页面加载...');
    log('将在2分钟后关闭浏览器...');
    
    // 等待游戏页面加载2分钟
    const twoMinutesInMs = 2 * 60 * 1000;
    for (let i = 0; i < 2; i++) {
      await sleep(60000);
      log(`游戏页面加载中... 已等待 ${i + 1} 分钟`);
    }
    
    log('已等待2分钟，准备关闭浏览器...');
    
    await page.close();
  } catch (error) {
    log(`脚本执行出错: ${error.message}`);
    log(`错误堆栈: ${error.stack}`);
    throw error;
  } finally {
    if (browser && !CONFIG.keepBrowserOpen) {
      log('正在关闭浏览器...');
      await browser.close();
      log('浏览器已关闭');
    } else if (browser && CONFIG.keepBrowserOpen) {
      log('浏览器保持打开状态，请手动查看和调试');
      log('按Ctrl+C关闭浏览器');
    }
    log('脚本执行结束');
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
