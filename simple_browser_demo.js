// 简单的浏览器演示脚本
const puppeteer = require('puppeteer');

async function demoBrowser() {
  console.log('🚀 正在启动浏览器...');
  
  try {
    // 配置浏览器选项
    const browser = await puppeteer.launch({
      headless: false, // 有头模式，显示浏览器
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('✅ 浏览器启动成功！');
    
    // 打开新页面
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🔗 正在打开百度首页...');
    await page.goto('https://www.baidu.com', { waitUntil: 'domcontentloaded' });
    
    console.log('✅ 页面加载成功！');
    
    // 演示简单操作
    console.log('📝 正在搜索"三国杀OL"...');
    await page.type('#kw', '三国杀OL');
    await page.click('#su');
    
    console.log('🔍 搜索完成！');
    
    // 等待3秒
    console.log('⏳ 等待3秒后关闭浏览器...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 关闭浏览器
    console.log('❌ 正在关闭浏览器...');
    await browser.close();
    
    console.log('✅ 浏览器已关闭');
    
  } catch (error) {
    console.error('❌ 浏览器演示失败:', error.message);
    console.error('💡 原因：当前Node.js v15.0.0版本过旧，与安装的Puppeteer版本不兼容');
    console.error('💡 解决方案：升级Node.js到v16.0.0或更高版本');
  }
}

// 执行演示
demoBrowser();
