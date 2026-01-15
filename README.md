# 三国杀OL自动签到脚本

基于Puppeteer的三国杀OL自动签到脚本，支持自动登录游戏并保持在线2小时，可部署到青龙面板定时执行。

## 功能特性

- 自动登录三国杀OL（支持账号密码登录和扫码登录）
- 自动选择游戏版本
- 自动进入游戏
- 保持在线2小时
- 实时输出运行状态
- 支持有头模式和有头模式切换
- 保存登录状态，避免重复登录
- 完善的错误处理和日志记录

## 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写你的账号信息：

```env
SANGUOSHA_USERNAME=your_username
SANGUOSHA_PASSWORD=your_password
```

### 3. 本地测试运行

```bash
npm start
```

首次运行时，如果账号密码登录失败，脚本会自动切换到有头模式，弹出浏览器窗口，你可以手动扫码登录。登录状态会保存在 `chrome_data` 目录中，后续运行将自动使用保存的登录状态。

## 青龙面板部署

### 准备工作

在开始部署之前，请确保你已经：

1. ✅ 安装了青龙面板（版本 >= 2.10.0）
2. ✅ 可以访问青龙面板的Web界面
3. ✅ 了解基本的Linux命令操作

### 部署步骤

#### 步骤1：准备脚本文件

在本地计算机上，将以下文件打包：

```
sanguosha-auto-sign/
├── package.json
├── index.js
├── .env.example
├── .gitignore
└── README.md
```

#### 步骤2：上传文件到青龙面板

**方法1：通过Web界面上传（推荐）**

1. 打开青龙面板Web界面（通常是 `http://your-server:5700`）
2. 点击左侧菜单的 **"脚本管理"**
3. 点击 **"上传脚本"** 按钮
4. 选择 **"上传文件"** 选项
5. 将 `package.json` 和 `index.js` 两个文件选中并上传
6. 上传完成后，会显示上传成功提示

**方法2：通过SSH上传**

1. 通过SSH连接到青龙面板服务器
2. 进入脚本目录：
   ```bash
   cd /ql/scripts
   ```
3. 创建新的脚本目录：
   ```bash
   mkdir sanguosha-auto-sign
   cd sanguosha-auto-sign
   ```
4. 将本地文件上传到服务器：
   ```bash
   # 使用scp命令
   scp package.json index.js user@your-server:/ql/scripts/sanguosha-auto-sign/
   
   # 或者使用rsync命令
   rsync -avz package.json index.js user@your-server:/ql/scripts/sanguosha-auto-sign/
   ```

#### 步骤3：安装依赖

**通过Web界面安装：**

1. 在青龙面板Web界面中，点击左侧菜单的 **"依赖管理"**
2. 点击 **"新建依赖"** 按钮
3. 选择依赖类型：**"NodeJS"**
4. 自动识别依赖名称：**"sanguosha-auto-sign"**
5. 点击 **"确定"** 按钮开始安装
6. 等待安装完成（通常需要1-3分钟）

**通过命令行安装：**

1. 通过SSH连接到青龙面板服务器
2. 进入脚本目录：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 等待安装完成

#### 步骤4：配置环境变量

**通过Web界面配置：**

1. 在青龙面板Web界面中，点击左侧菜单的 **"环境变量"**
2. 点击 **"新建变量"** 按钮
3. 填写环境变量信息：
   - **名称**: `SANGUOSHA_USERNAME`
   - **值**: 你的三国杀OL账号（例如：`cgengwei`）
   - **备注**: 三国杀OL账号
4. 点击 **"确定"** 按钮保存
5. 重复步骤3，添加第二个环境变量：
   - **名称**: `SANGUOSHA_PASSWORD`
   - **值**: 你的三国杀OL密码（例如：`Cgengwei123`）
   - **备注**: 三国杀OL密码
6. 确认两个环境变量都已添加成功

**通过命令行配置：**

1. 通过SSH连接到青龙面板服务器
2. 使用青龙面板命令添加环境变量：
   ```bash
   ql env set SANGUOSHA_USERNAME "cgengwei"
   ql env set SANGUOSHA_PASSWORD "Cgengwei123"
   ```
3. 确认环境变量添加成功：
   ```bash
   ql env list
   ```
   应该能看到刚添加的两个环境变量

#### 步骤5：设置定时任务

**通过Web界面设置：**

1. 在青龙面板Web界面中，点击左侧菜单的 **"定时任务"**
2. 点击 **"新建任务"** 按钮
3. 填写定时任务信息：
   - **名称**: 三国杀OL自动签到
   - **命令**: 
     ```bash
     cd /ql/scripts/sanguosha-auto-sign && node index.js
     ```
   - **Cron表达式**: `0 2 * * *`
     - 这表示每天凌晨2点执行一次
   - **备注**: 每天凌晨2点自动登录并保持在线2小时
4. 点击 **"确定"** 按钮保存定时任务

**通过命令行设置：**

1. 通过SSH连接到青龙面板服务器
2. 使用青龙面板命令添加定时任务：
   ```bash
   ql task add "三国杀OL自动签到" "cd /ql/scripts/sanguosha-auto-sign && node index.js" "0 2 * * *"
   ```
3. 确认定时任务添加成功：
   ```bash
   ql task list
   ```
   应该能看到刚添加的定时任务

#### 步骤6：手动执行测试

**通过Web界面测试：**

1. 在青龙面板Web界面中，点击左侧菜单的 **"定时任务"**
2. 找到刚创建的 **"三国杀OL自动签到"** 任务
3. 点击任务右侧的 **"运行"** 按钮（通常是▶️图标）
4. 系统会弹出一个确认对话框，点击 **"确定"** 开始执行
5. 点击任务右侧的 **"日志"** 按钮（通常是📄图标）
6. 查看执行日志，确认脚本是否正常运行

**通过命令行测试：**

1. 通过SSH连接到青龙面板服务器
2. 手动执行脚本：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   node index.js
   ```
3. 观察输出日志，确认脚本是否正常运行

#### 步骤7：查看执行日志

**通过Web界面查看：**

1. 在青龙面板Web界面中，点击左侧菜单的 **"定时任务"**
2. 找到 **"三国杀OL自动签到"** 任务
3. 点击任务右侧的 **"日志"** 按钮
4. 可以看到详细的执行日志，包括：
   - 脚本启动时间
   - 登录过程
   - 保持在线状态
   - 执行完成时间
   - 任何错误信息

**通过命令行查看：**

1. 通过SSH连接到青龙面板服务器
2. 查看日志文件：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   # 查看最新的日志
   ls -lt *.log | head -1
   
   # 查看日志内容
   cat <最新的日志文件>
   ```

### 常见问题排查

#### 问题1：依赖安装失败

**症状**: 安装依赖时报错

**错误示例**:
```
npm warn deprecated puppeteer@21.11.0: < 24.15.0 is no longer supported
npm error code 1
npm error command failed
npm error ERROR: Failed to set up chrome-headless-shell
npm error Client network socket disconnected before secure TLS connection was established
```

**解决方案**:

**方案1：设置环境变量跳过Chromium下载（推荐）**

Puppeteer在安装时会尝试下载Chromium，如果网络连接失败会导致安装错误。可以通过设置环境变量跳过下载，使用系统已安装的Chrome：

```bash
# 在安装依赖之前设置环境变量
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

# 然后安装依赖
cd /ql/scripts/sanguosha-auto-sign
npm install
```

**方案2：使用系统已安装的Chrome**

如果服务器已经安装了Chrome或Chromium，可以配置Puppeteer使用系统浏览器：

1. 检查Chrome是否已安装：
   ```bash
   google-chrome --version
   chromium --version
   ```

2. 如果已安装，在运行脚本时设置环境变量：
   ```bash
   export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome)
   cd /ql/scripts/sanguosha-auto-sign
   node index.js
   ```

**方案3：检查Node.js版本**

Puppeteer 21.x版本要求Node.js >= 18.0.0：

```bash
# 检查Node.js版本
node -v

# 如果版本过低，升级Node.js
# 使用nvm升级
nvm install 18
nvm use 18

# 或者使用包管理器升级
# Debian/Ubuntu
apt-get update
apt-get install -y nodejs

# CentOS/RHEL
yum install -y nodejs
```

**方案4：重新安装依赖**

如果安装过程中出错，清理缓存后重新安装：

```bash
cd /ql/scripts/sanguosha-auto-sign

# 删除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 清理npm缓存
npm cache clean --force

# 重新安装
npm install
```

**方案5：使用国内镜像源**

如果网络连接问题是因为访问国外源慢，可以使用国内镜像：

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或者使用华为镜像
npm config set registry https://mirrors.huaweicloud.com/repository/npm/

# 然后安装
npm install
```

**方案6：手动下载Chromium**

如果自动下载失败，可以手动下载Chromium：

```bash
# 下载Chromium
cd /ql/scripts/sanguosha-auto-sign
wget https://github.com/puppeteer/puppeteer/releases/download/v21.11.0/chromium-linux-1205149219.zip

# 解压
unzip chromium-linux-1205149219.zip

# 设置环境变量
export PUPPETEER_EXECUTABLE_PATH=/ql/scripts/sanguosha-auto-sign/chromium-linux-1205149219/chrome-linux/chrome

# 安装依赖
npm install --ignore-scripts
```

#### 问题2：环境变量未生效

**症状**: 脚本运行时提示找不到环境变量

**解决方案**:
1. 检查环境变量名称是否正确（区分大小写）
2. 确认环境变量已添加：
   ```bash
   ql env list
   ```
3. 如果环境变量存在但未生效，重启青龙面板：
   ```bash
   ql restart
   ```
4. 重新执行脚本测试

#### 问题3：定时任务不执行

**症状**: 定时任务到了时间但没有执行

**解决方案**:
1. 检查Cron表达式是否正确：
   - `0 2 * * *` 表示每天凌晨2点
   - `*/30 * * * *` 表示每30分钟执行一次
2. 检查青龙面板服务是否正常运行：
   ```bash
   ql status
   ```
3. 如果服务未运行，启动服务：
   ```bash
   ql start
   ```
4. 查看系统时间是否正确：
   ```bash
   date
   ```

#### 问题4：登录失败

**症状**: 脚本提示登录失败

**解决方案**:
1. 检查账号密码是否正确
2. 检查网络连接是否正常
3. 查看日志中的详细错误信息
4. 如果需要验证码，脚本会自动切换到有头模式
5. 可以临时修改脚本，将 `headless` 设置为 `false`，观察登录过程

#### 问题5：浏览器无法启动

**症状**: 脚本提示无法启动浏览器

**解决方案**:
1. 检查服务器是否安装了Chrome或Chromium：
   ```bash
   google-chrome --version
   chromium --version
   ```
2. 如果未安装，安装Chromium：
   ```bash
   # Debian/Ubuntu
   apt-get update
   apt-get install -y chromium
   
   # CentOS/RHEL
   yum install -y chromium
   ```
3. 如果服务器是ARM架构，可能需要安装ARM版本的Chromium

## 配置说明

脚本支持通过修改 `index.js` 中的 `CONFIG` 对象来自定义配置：

```javascript
const CONFIG = {
  url: 'https://web.sanguosha.com/',
  loginUrl: 'https://web.sanguosha.com/login/index.html',
  userDataDir: path.join(__dirname, 'chrome_data'),
  headless: true,
  timeout: 30000,
  keepOnlineMinutes: 120,
  selectors: {
    username: '#username',
    password: '#password',
    submitButton: '#SGS_login-btn',
    gameItemOl: '#gameItemOl',
    goInGameBtn: '#goInGameBtn'
  }
};
```

### 主要配置项

- `headless`: 是否使用无头模式（true=后台运行，false=显示浏览器窗口）
- `timeout`: 页面加载超时时间（毫秒）
- `userDataDir`: Chrome用户数据目录，用于保存登录状态
- `keepOnlineMinutes`: 保持在线时长（分钟），默认120分钟（2小时）

## 注意事项

1. **首次运行**: 首次运行时，建议将 `headless` 设置为 `false`，以便观察登录过程和调试
2. **登录状态**: 登录状态会保存在 `chrome_data` 目录中，请勿删除此目录
3. **页面变化**: 如果三国杀OL网站页面结构发生变化，可能需要更新 `selectors` 中的选择器
4. **验证码**: 如果遇到验证码，脚本会自动切换到有头模式，需要手动处理
5. **网络问题**: 如果网络不稳定，可以适当增加 `timeout` 值
6. **保持在线**: 脚本会保持在线2小时，期间会每分钟输出运行状态
7. **资源占用**: 在青龙面板中运行时，会占用一定的CPU和内存资源

## 日志输出

脚本会输出详细的执行日志，包括：

- 时间戳
- 当前操作状态
- 成功/失败信息
- 错误详情
- 保持在线状态（每分钟更新一次）

示例日志：

```
[2026/01/15 02:00:00] 三国杀OL自动签到脚本启动
[2026/01/15 02:00:00] 账号: cgengwei
[2026/01/15 02:00:01] 正在启动浏览器...
[2026/01/15 02:00:02] Chrome浏览器启动成功
[2026/01/15 02:00:03] 正在打开登录页面...
[2026/01/15 02:00:05] 页面加载成功
[2026/01/15 02:00:06] 尝试使用账号密码登录...
[2026/01/15 02:00:08] 找到登录游戏按钮
[2026/01/15 02:00:09] 已点击登录游戏按钮
[2026/01/15 02:00:10] 检测到游戏版本选择页面
[2026/01/15 02:00:11] 登录成功！
[2026/01/15 02:00:12] 正在选择三国杀OL版本...
[2026/01/15 02:00:13] 找到三国杀OL版本，点击选择...
[2026/01/15 02:00:14] 正在点击进入游戏按钮...
[2026/01/15 02:00:15] 已点击进入游戏按钮
[2026/01/15 02:00:16] 等待页面跳转到游戏页面...
[2026/01/15 02:00:26] 页面已跳转到游戏页面！
[2026/01/15 02:00:27] 等待游戏页面完全加载...
[2026/01/15 02:00:42] 游戏页面加载等待完成，准备执行签到操作
[2026/01/15 02:00:43] 登录成功！保持在线状态...
[2026/01/15 02:00:43] 等待2小时后自动关闭浏览器...
[2026/01/15 02:01:43] 保持在线中... 已运行 1 分钟，剩余 119 分 0 秒
[2026/01/15 02:02:43] 保持在线中... 已运行 2 分钟，剩余 118 分 0 秒
...
[2026/01/15 04:00:43] 已保持在线2小时，准备关闭浏览器...
[2026/01/15 04:00:43] 脚本执行结束
```

## 许可证

MIT License

## 免责声明

本脚本仅供学习和个人使用，请勿用于商业用途。使用本脚本所产生的一切后果由使用者自行承担。