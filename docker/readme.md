- 构建命令
```dockerfile
docker build -t qinglong-chrome-arm:debian .
```
- 导出命令
``` 
docker save -o my-app.tar qinglong-chrome-arm:debian

```
- 导入命令
```
docker load -i my-app.tar
```
- 运行命令
```docker
docker run -dit \
  -v /Users/cgengwei/docker/qinglong/data:/ql/data \
  -p 5700:5700 \
  -e QlBaseUrl="/" \
  -e QlPort="5700" \
  --name qinglong \
  --hostname qinglong \
  --restart unless-stopped \
  qinglong-chrome-arm:debian
```

```docker
docker run -dit \
  -p 5700:5700 \
  -e QlBaseUrl="/" \
  -e QlPort="5700" \
  --name qinglong-gui \
  --hostname qinglong-gui \
  --restart unless-stopped \
  qinglong-arm-gui:latest
```