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
  } catch (error) {
    log(`截图失败: ${error.message}`);
  }
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
        chromePath = execSync('which chromium').toString().trim();
      }
    }
  } catch (error) {
    log(`查找Chrome失败: ${error.message}`);
    log('将使用Puppeteer自带的Chromium');
    chromePath = undefined;
  }
  
  const options = {
    headless: true,
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
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    delete options.userDataDir;
    const browser = await puppeteer.launch(options);
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
      await page.waitForSelector(CONFIG.selectors.usernameInput, { timeout: 5000 });
      await page.type(CONFIG.selectors.usernameInput, username);
      
      await page.waitForSelector(CONFIG.selectors.passwordInput, { timeout: 5000 });
      await page.type(CONFIG.selectors.passwordInput, password);
      
      await sleep(1000);
      
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
        for (const selector of agreementSelectors) {
          try {
            checkboxes = await page.$$(selector);
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
        const loginButton = await page.$('#SGS_login-btn');
        
        if (loginButton) {
          log('找到登录游戏按钮');
          await loginButton.click();
          log('已点击登录游戏按钮');
        } else {
          log('未找到登录游戏按钮，尝试使用备用方法');
          await page.click(CONFIG.selectors.submitButton);
        }
      } catch (error) {
        log(`点击登录按钮失败: ${error.message}`);
        log('尝试使用备用方法点击...');
        try {
          await page.click(CONFIG.selectors.submitButton);
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

async function waitForLogin(page) {
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
  
  log('三国杀OL自动签到脚本启动');
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
    
    log('登录成功！保持在线状态...');
    log('等待2小时后自动关闭浏览器...');
    
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < 120; i++) {
      await sleep(60000);
      
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, twoHoursInMs - elapsed);
      const minutes = Math.floor(remaining / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      
      log(`保持在线中... 已运行 ${Math.floor(elapsed / (60 * 1000))} 分钟，剩余 ${minutes} 分 ${seconds} 秒`);
    }
    
    log('已保持在线2小时，准备关闭浏览器...');
    
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
