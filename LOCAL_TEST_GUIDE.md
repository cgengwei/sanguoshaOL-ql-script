# 本地测试指南

## 环境要求

- Node.js >= 16.0.0 （必须）
- npm >= 8.0.0
- macOS 系统
- Google Chrome 浏览器已安装

## 测试步骤

### 1. 升级 Node.js 版本

当前环境使用的是 Node.js v15.0.0，版本过旧，无法支持现代 Puppeteer 版本。请按照以下步骤升级：

#### 方法1：使用 Homebrew 安装（推荐）

```bash
# 安装 nvm（Node Version Manager）
brew install nvm

# 创建 nvm 配置目录
mkdir -p ~/.nvm

# 在 .zshrc 文件中添加 nvm 配置
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"' >> ~/.zshrc
echo '[ -s "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm" ] && . "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm"' >> ~/.zshrc

# 重新加载 .zshrc
source ~/.zshrc

# 安装 Node.js 18
nvm install 18

# 使用 Node.js 18
nvm use 18

# 验证版本
node -v
npm -v
```

#### 方法2：直接下载安装包

从 [Node.js 官网](https://nodejs.org/) 下载 Node.js 18 或更高版本的安装包，直接安装。

### 2. 安装依赖

```bash
# 进入脚本目录
cd /Users/cgengwei/Documents/trae_projects/sanguosha-auto-sign

# 删除旧的 node_modules 和 package-lock.json（如果存在）
rm -rf node_modules package-lock.json

# 安装依赖
npm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写你的三国杀OL账号密码
nano .env
```

在 .env 文件中填写你的账号密码：
```
SANGUOSHA_USERNAME=你的账号
SANGUOSHA_PASSWORD=你的密码
```

### 4. 运行脚本

```bash
# 运行脚本
npm start
```

### 5. 验证脚本运行状态

脚本运行后，你将看到：

1. **浏览器自动打开**：Chrome浏览器会自动打开，显示三国杀OL登录页面
2. **自动登录**：脚本会自动填写账号密码并登录
3. **自动关闭弹窗**：登录成功后，脚本会自动关闭游戏弹窗
4. **保持在线状态**：脚本会显示保持在线状态，每3分钟执行一次操作
5. **日志输出**：控制台会实时输出运行状态
6. **截图保存**：关键步骤会自动截图到 `screenshots` 目录

## 预期行为

1. **登录阶段**：
   - 浏览器打开三国杀OL登录页面
   - 自动填写账号密码
   - 自动勾选协议
   - 自动点击登录按钮
   - 自动选择游戏版本
   - 自动点击进入游戏按钮

2. **游戏阶段**：
   - 自动关闭游戏弹窗
   - 显示保持在线状态
   - 每3分钟执行一次保持在线操作：
     - 点击游戏页面右下角个人按钮
     - 等待个人信息弹窗出现
     - 点击弹窗右上角关闭按钮

3. **结束阶段**：
   - 保持在线2小时后，自动关闭浏览器
   - 输出脚本执行结束日志

## 调试建议

1. **查看日志**：控制台会输出详细的运行日志，帮助你定位问题
2. **检查截图**：`screenshots` 目录下的截图可以帮助你了解脚本执行过程
3. **调整坐标**：如果点击位置不准确，可以调整 `clickRelative` 函数中的相对坐标值
4. **修改配置**：可以修改 `CONFIG` 对象中的配置项，如超时时间、保持在线时长等

## 常见问题

### Q: 浏览器无法启动
A: 检查 Chrome 浏览器路径是否正确，确保 Chrome 已安装

### Q: 登录失败
A: 检查账号密码是否正确，是否需要验证码

### Q: 弹窗关闭失败
A: 调整 `closeGamePopup` 函数中的相对坐标值

### Q: 保持在线操作失败
A: 调整 `performKeepAliveAction` 函数中的相对坐标值

## 测试验证完成

脚本测试完成后，你可以：

1. 将 `CONFIG.headless` 改为 `true`，切换到无头模式
2. 将脚本部署到青龙面板
3. 设置定时任务，让脚本自动执行

祝你测试顺利！
