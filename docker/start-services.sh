#!/bin/bash

# 创建用户DBus会话
USER_UID=$(id -u)
USER_GID=$(id -g)
mkdir -p /run/user/$USER_UID
chown $USER_UID:$USER_GID /run/user/$USER_UID

echo "Starting DBus session service..."
dbus-daemon --session --address=unix:path=/tmp/dbus.sock --fork --nopidfile --syslog-only

echo "Starting Xvfb virtual display..."
# 启动Xvfb虚拟显示器
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset -nolisten tcp -shmem &
sleep 2

# 设置环境变量
export DISPLAY=:99
export CHROME_BIN=/usr/bin/chromium
export CHROMEDRIVER_PATH=/usr/bin/chromedriver
export DBUS_SESSION_BUS_ADDRESS=unix:path=/tmp/dbus.sock
export NO_AT_BRIDGE=1
export GDK_BACKEND=x11

# 确保环境变量被所有进程继承
echo "DISPLAY=:99" >> /etc/environment
echo "CHROME_BIN=/usr/bin/chromium" >> /etc/environment
echo "CHROMEDRIVER_PATH=/usr/bin/chromedriver" >> /etc/environment
echo "DBUS_SESSION_BUS_ADDRESS=unix:path=/tmp/dbus.sock" >> /etc/environment
echo "NO_AT_BRIDGE=1" >> /etc/environment
echo "GDK_BACKEND=x11" >> /etc/environment

# 启动青龙面板
echo "Starting Qinglong panel..."
/ql/scripts/start.sh