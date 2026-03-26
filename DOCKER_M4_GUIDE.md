# M4 Mac Mini (ARM64) 青龙面板 "有头模式" 部署指南

此 Dockerfile 为 M4 Mac Mini (Apple Silicon) 优化，集成了 VNC 和 noVNC，允许你在浏览器中直接查看脚本运行时的 Chrome 界面。

## 1. 获取镜像
---
- 方式1 [网盘下载](https://pan.quark.cn/s/2f688345b578)
- 方式2 本地导出
 1. **导出镜像**:
   ```bash
   docker save -o ql-sanguosha-vnc-m4.tar ql-sanguosha-vnc:latest
   ```
   (已为您在本地生成了 `ql-sanguosha-vnc-m4.tar`)

 2. **在另一台机器上导入**:
   ```bash
   docker load -i ql-sanguosha-vnc-m4.tar
   ```

## 2. 运行容器

运行以下命令启动容器。我们将 5700 端口映射为青龙面板，6080 端口映射为浏览器监控界面。

```bash
docker run -d \
  --name qinglong \
  -p 5700:5700 \
  -p 6080:6080 \
  -v /Users/cgengwei/docker/qinglong/data:/ql/data \
  --restart unless-stopped \
  ql-sanguosha-vnc
```

## 3. 访问

*   **青龙面板**: [http://localhost:5700](http://localhost:5700) (默认账号密码请查看青龙官方文档)
*   **浏览器实时画面 (显示器模式)**: [http://localhost:6080](http://localhost:6080)
    *   **成功标志**: 打开后你应该能看到一个白色背景的终端窗口 (`xterm`)，这代表虚拟显示器和窗口管理器已正常启动。
    *   在这里你可以看到 Chrome 窗口的实时操作，方便处理验证码或观察挂机状态。

## 4. 依赖安装注意事项

在青龙面板中添加脚本后，如果运行报错 `Cannot find module 'playwright'`：
- 本镜像已预装了全局 `playwright` 和 `playwright-chromium`。
- 如果脚本运行仍找不到模块，请在青龙面板的 **“依赖管理” -> “Nodejs”** 中手动添加 `playwright` 依赖，或者在脚本运行命令前加上 `export NODE_PATH=/usr/local/lib/node_modules`。

## 5. 环境变量配置 (在青龙面板中)

在青龙面板的“环境变量”中添加：
- `SANGUOSHA_USERNAME`: 你的账号
- `SANGUOSHA_PASSWORD`: 你的密码
- `HEADLESS`: `false` (脚本已默认，可不填)

## 6. 常见问题

*   **M4 Mac 兼容性**: 基础镜像使用了 `whyour/qinglong:debian`，原生支持 ARM64 架构。
*   **黑屏问题**: 如果 6080 端口打开是黑屏，请等待容器完全启动，或者刷新页面。
