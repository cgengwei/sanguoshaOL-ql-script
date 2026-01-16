# 青龙面板部署指南

## 准备工作

在开始部署之前，请确保：

1. ✅ 青龙面板已安装并正常运行
2. ✅ 可以访问青龙面板的Web界面
3. ✅ 了解基本的Linux命令操作
4. ✅ 已将脚本文件准备好

## 部署步骤

### 1. 上传脚本文件

#### 方法1：通过青龙面板Web界面上传

1. 登录青龙面板Web界面
2. 点击左侧菜单的 **"脚本管理"**
3. 点击 **"上传脚本"** 按钮
4. 选择 **"上传文件"** 选项
5. 将以下文件选中并上传：
   - `index.js`
   - `package.json`
   - `.env.example`
6. 上传完成后，会显示上传成功提示

#### 方法2：通过SSH上传

1. 通过SSH连接到青龙面板服务器
2. 进入脚本目录：
   ```bash
   cd /ql/scripts
   ```
3. 创建脚本目录：
   ```bash
   mkdir -p sanguosha-auto-sign
   ```
4. 使用scp命令将文件上传到服务器：
   ```bash
   # 在本地执行
   scp index.js package.json .env.example user@your-server:/ql/scripts/sanguosha-auto-sign/
   ```

### 2. 安装依赖

**注意**：根据实践经验，通过Web界面安装依赖的方式可能无法正常工作，推荐使用命令行安装。

#### 通过命令行安装依赖

1. 通过SSH连接到青龙面板服务器
2. 进入脚本目录：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   ```
3. 安装依赖：
   ```bash
   npm install --legacy-peer-deps
   ```
4. 等待安装完成（通常需要1-3分钟）

### 3. 配置环境变量

#### 通过青龙面板Web界面配置

1. 登录青龙面板Web界面
2. 点击左侧菜单的 **"环境变量"**
3. 点击 **"新建变量"** 按钮
4. 添加以下环境变量：
   - **名称**: `SANGUOSHA_USERNAME`
   - **值**: 你的三国杀OL账号
   - **备注**: 三国杀OL账号
   - **选择变量类型**: 普通变量
   - **是否启用**: 是
5. 点击 **"确定"** 保存
6. 重复步骤3-5，添加第二个环境变量：
   - **名称**: `SANGUOSHA_PASSWORD`
   - **值**: 你的三国杀OL密码
   - **备注**: 三国杀OL密码
   - **选择变量类型**: 普通变量
   - **是否启用**: 是

#### 通过命令行配置

1. 通过SSH连接到青龙面板服务器
2. 使用青龙面板命令添加环境变量：
   ```bash
   ql env set SANGUOSHA_USERNAME "你的账号"
   ql env set SANGUOSHA_PASSWORD "你的密码"
   ```
3. 确认环境变量添加成功：
   ```bash
   ql env list
   ```

### 4. 设置定时任务

#### 通过青龙面板Web界面设置

1. 登录青龙面板Web界面
2. 点击左侧菜单的 **"定时任务"**
3. 点击 **"新建任务"** 按钮
4. 填写定时任务信息：
   - **名称**: 三国杀OL自动签到
   - **命令**: 
     ```bash
     cd /ql/scripts/sanguosha-auto-sign && node index.js
     ```
   - **Cron表达式**: `0 2 * * *` （每天凌晨2点执行）
   - **备注**: 三国杀OL自动签到 - 保持在线2小时
   - **任务类型**: node
   - **是否启用**: 是
5. 点击 **"确定"** 保存

#### 通过命令行设置

1. 通过SSH连接到青龙面板服务器
2. 使用青龙面板命令添加定时任务：
   ```bash
   ql task add "三国杀OL自动签到" "cd /ql/scripts/sanguosha-auto-sign && node index.js" "0 2 * * *" "node" "三国杀OL自动签到 - 保持在线2小时"
   ```
3. 确认任务添加成功：
   ```bash
   ql task list
   ```

### 5. 手动执行测试

#### 通过Web界面测试

1. 在青龙面板Web界面中，点击左侧菜单的 **"定时任务"**
2. 找到刚创建的 **"三国杀OL自动签到"** 任务
3. 点击任务右侧的 **"运行"** 按钮（通常是▶️图标）
4. 系统会弹出一个确认对话框，点击 **"确定"** 开始执行
5. 点击任务右侧的 **"日志"** 按钮（通常是📄图标）
6. 查看执行日志，确认脚本是否正常运行

#### 通过命令行测试

1. 通过SSH连接到青龙面板服务器
2. 手动执行脚本：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   node index.js
   ```
3. 观察输出日志，确认脚本是否正常运行

## 注意事项

1. **关于任务命令**：
   - 推荐使用 `cd /ql/scripts/sanguosha-auto-sign && node index.js` 命令
   - 根据实践，也可以使用 `task sanguosha-auto-sign/index.js` 命令
   - 避免直接使用 `node index.js`，会导致找不到模块错误

2. **关于依赖安装**：
   - 必须使用命令行安装依赖
   - 添加 `--legacy-peer-deps` 参数避免依赖冲突
   - 安装时间可能较长，请耐心等待

3. **关于浏览器配置**：
   - 脚本已配置为无头模式，适合服务器环境运行
   - 浏览器启动参数已优化，适合服务器环境
   - 会自动使用系统已安装的Chrome/Chromium

4. **关于登录状态**：
   - 首次运行时，会保存登录状态到 `chrome_data` 目录
   - 后续运行会自动使用保存的登录状态
   - 若登录状态失效，需要重新登录

5. **关于保持在线**：
   - 脚本会保持在线2小时
   - 每3分钟执行一次保持在线操作
   - 操作包括：点击个人按钮 → 关闭个人信息弹窗

## 常见问题排查

### 问题1：依赖安装失败

**解决方案**：
```bash
# 删除旧的依赖和锁文件
rm -rf node_modules package-lock.json

# 清理npm缓存
npm cache clean --force

# 重新安装，使用国内镜像
npm config set registry https://registry.npmmirror.com
npm install --legacy-peer-deps
```

### 问题2：任务执行失败，提示"Cannot find module"

**解决方案**：
- 检查任务命令是否正确，必须包含完整的路径
- 确保依赖已正确安装
- 检查脚本文件是否上传完整

### 问题3：浏览器启动失败

**解决方案**：
- 确保服务器已安装Chrome/Chromium
- 安装必要的依赖库：
  ```bash
  # Debian/Ubuntu
  apt-get update && apt-get install -y chromium libnss3 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgbm1 libharfbuzz0b libdrm2
  
  # CentOS/RHEL
  yum update && yum install -y chromium libX11 libXcomposite libXcursor libXdamage libXext libXfixes libXi libXrandr libXtst cups-libs libpng libxcb libxkbcommon-x11 pango atk at-spi2-atk gtk3
  ```

### 问题4：登录失败

**解决方案**：
- 检查账号密码是否正确
- 检查网络连接是否正常
- 查看日志中的详细错误信息
- 首次运行可能需要手动登录一次

### 问题5：保持在线操作失败

**解决方案**：
- 检查游戏页面结构是否变化
- 可能需要调整相对坐标值
- 查看截图文件，分析实际页面结构

## 日志查看

### 通过Web界面查看

1. 登录青龙面板Web界面
2. 点击左侧菜单的 **"定时任务"**
3. 找到对应的任务
4. 点击任务右侧的 **"日志"** 按钮
5. 可以查看完整的执行日志

### 通过命令行查看

1. 通过SSH连接到青龙面板服务器
2. 查看青龙面板日志：
   ```bash
   cat /ql/log/task_run.log
   ```
3. 或者查看脚本日志：
   ```bash
   cd /ql/scripts/sanguosha-auto-sign
   ls -lt *.log | head -1
   cat <最新的日志文件>
   ```

## 升级和更新

当需要更新脚本时：

1. 上传新的脚本文件到服务器
2. 重新安装依赖（如果有依赖变化）
3. 重启青龙面板服务：
   ```bash
   ql restart
   ```
4. 运行任务测试

## 结束语

脚本已配置为适合青龙面板环境运行，按照以上步骤部署后，即可实现自动登录三国杀OL并保持在线2小时的功能。

如有任何问题，请查看日志文件或联系开发者。
