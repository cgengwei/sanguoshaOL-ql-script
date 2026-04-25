#!/bin/bash

# 设置环境变量
export DISPLAY=:99
export CHROME_BIN=/usr/bin/chromium
export CHROMEDRIVER_PATH=/usr/bin/chromedriver
export NO_AT_BRIDGE=1
export GDK_BACKEND=x11

# 1. 启动 DBus 系统服务 (解决 Chromium/DBus 报错)
# 确保 machine-id 存在
if [ ! -f /var/lib/dbus/machine-id ]; then
    mkdir -p /var/lib/dbus
    dbus-uuidgen > /var/lib/dbus/machine-id
fi
mkdir -p /run/dbus
dbus-daemon --system --fork || true

# 2. 清理可能的旧 Xvfb 锁文件，防止因容器非正常关闭导致的启动失败
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99

# 3. 定义守护进程启动并监控函数
launch_xvfb() {
    while true; do
        echo "Starting Xvfb on :99..."
        Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset -nolisten tcp -shmem
        echo "Xvfb crashed. Restarting in 2s..."
        rm -f /tmp/.X99-lock /tmp/.X11-unix/X99
        sleep 2
    done
}

launch_fluxbox() {
    while true; do
        echo "Starting Fluxbox..."
        DISPLAY=:99 fluxbox
        echo "Fluxbox crashed. Restarting in 2s..."
        sleep 2
    done
}

launch_x11vnc() {
    while true; do
        echo "Starting x11vnc..."
        x11vnc -display :99 -forever -shared -nopw -rfbport 5900
        echo "x11vnc crashed. Restarting in 2s..."
        sleep 2
    done
}

launch_novnc() {
    while true; do
        echo "Starting noVNC on port 6080..."
        /usr/share/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080
        echo "noVNC crashed. Restarting in 2s..."
        sleep 2
    done
}

# 4. 后台运行守护进程
launch_xvfb &
# 等待 Xvfb 启动完成
MAX_RETRIES=10
RETRIES=0
while [ ! -e /tmp/.X11-unix/X99 ] && [ $RETRIES -lt $MAX_RETRIES ]; do
    echo "Waiting for Xvfb to be ready... ($RETRIES/$MAX_RETRIES)"
    sleep 1
    ((RETRIES++))
done

launch_fluxbox &
launch_x11vnc &
launch_novnc &

# 5. 启动 xterm (作为一个测试窗口)
DISPLAY=:99 xterm -geometry 80x24+10+10 -ls &

# 6. 启动青龙面板主进程 (使用 exec 接管进程)
echo "Starting Qinglong panel..."
exec /ql/docker/docker-entrypoint.sh
