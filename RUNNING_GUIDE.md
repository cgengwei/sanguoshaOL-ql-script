# 本地运行指南 - 确保看到浏览器操作

## 环境要求

- macOS 系统
- Node.js >= 16.0.0 （必须）
- Google Chrome 浏览器已安装
- 具有图形界面的本地环境

## 详细步骤

### 1. 验证当前Node.js版本

打开终端，执行以下命令查看当前Node.js版本：

```bash
node -v
```

如果显示 `v16.0.0` 或更高版本，跳过步骤2，直接执行步骤3。

如果显示 `v15.0.0` 或更低版本，继续执行步骤2升级Node.js。

### 2. 升级Node.js版本

#### 方法1：使用Homebrew安装nvm（推荐）

```bash
# 安装nvm（Node Version Manager）
brew install nvm

# 创建nvm配置目录
mkdir -p ~/.nvm

# 在.zshrc文件中添加nvm配置
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"' >> ~/.zshrc
echo '[ -s "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm" ] && . "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm"' >> ~/.zshrc

# 重新加载.zshrc
source ~/.zshrc

# 安装Node.js 18
nvm install 18

# 使用Node.js 18
nvm use 18

# 验证版本
node -v  # 应显示 v18.x.x
npm -v   # 应显示 v8.x.x 或更高
```

#### 方法2：直接下载安装包

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 Node.js 18 或更高版本的安装包
3. 双击安装包，按照提示完成安装
4. 打开新终端，执行 `node -v` 验证版本

### 3. 重新安装项目依赖

```bash
# 进入项目目录
cd /Users/cgengwei/Documents/trae_projects/sanguosha-auto-sign

# 删除旧的依赖目录和锁文件
rm -rf node_modules package-lock.json

# 安装依赖
npm install
```

### 4. 配置账号密码

```bash
# 查看当前.env文件内容
cat .env

# 如果需要修改，使用编辑器打开
nano .env
```

确保.env文件包含以下内容：

```
SANGUOSHA_USERNAME=你的三国杀OL账号
SANGUOSHA_PASSWORD=你的三国杀OL密码
```

### 5. 验证脚本配置

确认脚本已配置为**有头模式**：

```bash
# 查看脚本配置
grep -A 10 "headless" index.js
```

应显示：

```javascript
const CONFIG = {
  // ...
  headless: false, // 本地测试设置为false，显示浏览器界面
  // ...
};
```

### 6. 运行脚本

```bash
# 运行脚本
npm start
```

## 预期看到的效果

1. **浏览器自动打开**：Chrome浏览器会弹出，显示三国杀OL登录页面
2. **自动登录流程**：
   - 自动填写账号密码
   - 自动勾选协议
   - 自动点击登录按钮 (`#SGS_login-btn`)
   - 自动选择游戏版本 (`#gameItemOl`)
   - 自动点击进入游戏按钮 (`#goInGameBtn`)
3. **自动关闭弹窗**：游戏加载后，自动点击右上角关闭弹窗
4. **保持在线操作**：每3分钟执行一次：
   - 点击游戏页面右下角个人按钮（相对坐标：0.9, 0.9）
   - 等待个人信息弹窗出现
   - 点击弹窗右上角关闭按钮（相对坐标：0.85, 0.2）
5. **实时日志**：终端会显示运行状态和剩余时间
6. **自动截图**：`screenshots`目录会保存关键步骤的截图

## 常见问题解决

### Q: 浏览器无法启动
A: 检查Chrome浏览器是否已安装，路径是否正确

### Q: 登录失败
A: 检查账号密码是否正确，是否需要验证码

### Q: 弹窗关闭失败
A: 调整 `closeGamePopup` 函数中的相对坐标值

### Q: 保持在线操作失败
A: 调整 `performKeepAliveAction` 函数中的相对坐标值

### Q: 脚本执行缓慢
A: 可以调整 `sleep` 函数的等待时间

## 脚本核心功能验证

脚本包含以下核心功能，运行时可逐一验证：

✅ 非无头模式运行（浏览器可见）
✅ 自动登录（支持账号密码）
✅ 自动选择游戏版本
✅ 自动进入游戏
✅ 智能弹窗处理
✅ 每3分钟保持在线操作
✅ 完整日志输出
✅ 自动截图保存
✅ 保持在线2小时后自动关闭

## 调试建议

1. **查看终端日志**：实时了解脚本运行状态
2. **检查截图文件**：`screenshots`目录下的截图可帮助分析执行过程
3. **调整坐标值**：根据实际游戏界面调整相对坐标
4. **修改等待时间**：根据网络速度调整 `sleep` 函数的等待时间
5. **临时修改headless**：如需后台运行，可将 `headless` 改为 `true`

## 下一步操作

脚本测试成功后，你可以：

1. 将脚本部署到青龙面板
2. 设置定时任务，自动执行
3. 调整CONFIG配置，优化运行效果
4. 根据实际游戏界面调整坐标值

祝你运行成功！
