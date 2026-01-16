# AWS EC2 Ubuntu 部署完整指南 - Barbie 项目

> **服务器信息**  
> - 域名: `uofa.ink`  
> - 公网 IP: `52.60.188.189`  
> - 区域: Canada (Central)

---

## 📋 部署架构

| 组件 | 端口 | 说明 |
|------|------|------|
| Nginx | 80 / 443 | 反向代理 + HTTPS + 静态文件 |
| Backend (Node.js) | 4273 | Express API 服务 (内部) |
| MongoDB | Atlas | 云数据库 |
| Redis | Upstash | 缓存服务 |

```
用户请求 (uofa.ink)
    ↓
┌─────────────────────────────────────┐
│         Nginx (:80/:443)            │
│  ┌─────────────┐  ┌───────────────┐ │
│  │ 静态文件     │  │  /api/* 代理  │ │
│  │ (Frontend)  │  │  → :4273      │ │
│  └─────────────┘  └───────────────┘ │
└─────────────────────────────────────┘
                         ↓
              ┌──────────────────┐
              │   Backend:4273   │
              │   (PM2 守护)     │
              └──────────────────┘
                         ↓
              ┌──────────────────┐
              │   MongoDB Atlas  │
              │   + Upstash Redis│
              └──────────────────┘
```

---

## 1️⃣ 连接服务器

```bash
# 使用密钥文件连接
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP

# 或者使用密码登录
ssh ubuntu@YOUR_SERVER_IP
```

---

## 2️⃣ 系统初始化

### 更新系统 & 安装基础工具

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 安装 Node.js 20.x

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt install -y nodejs

# 验证安装
node -v   # 应该显示 v20.x.x
npm -v    # 应该显示 10.x.x
```

### 安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 设置 PM2 开机自启
pm2 startup systemd
# 执行它输出的命令（类似 sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu）
```

---

## 3️⃣ 项目部署

### 克隆代码

```bash
cd /home/ubuntu
mkdir -p projects
cd projects
git clone https://github.com/1590703336/Barbie.git
cd Barbie
```

### 上传环境变量文件

**方法 1: 从本地电脑上传（在本地终端执行）**

```bash
scp -i your-key.pem /path/to/your/.env.production.local ubuntu@YOUR_SERVER_IP:/home/ubuntu/projects/Barbie/apps/backend/.env.production.local
```

**方法 2: 在服务器上手动创建**

```bash
nano /home/ubuntu/projects/Barbie/apps/backend/.env.production.local
```

粘贴以下内容（替换为你的实际值）：

```env
NODE_ENV = 'production'
PORT=4273
SERVER_URL=http://localhost:4273

# 替换为你的 MongoDB 连接字符串
DB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/

# 替换为你的 JWT 密钥
JWT_SECRET=YOUR_JWT_SECRET_HERE
JWT_EXPIRES_IN=1d

# 替换为你的 Arcjet 密钥
ARCJET_KEY=YOUR_ARCJET_KEY
ARCJET_ENV=production

# 替换为你的 Upstash Redis 配置
UPSTASH_REDIS_REST_URL="YOUR_UPSTASH_URL"
UPSTASH_REDIS_REST_TOKEN="YOUR_UPSTASH_TOKEN"
```

按 `Ctrl+X`，然后 `Y`，再 `Enter` 保存退出。

> ⚠️ **安全提示**: 永远不要将包含真实密钥的 `.env` 文件提交到 Git！

### 安装后端依赖 & 启动

```bash
cd /home/ubuntu/projects/Barbie/apps/backend

# 安装依赖
npm install

# 使用 PM2 启动后端（生产模式）
pm2 start npm --name "barbie-backend" -- start

# 查看状态
pm2 status

# 保存 PM2 进程列表（重启后自动恢复）
pm2 save
```

### 构建前端

```bash
cd /home/ubuntu/projects/Barbie/apps/frontend

# 安装依赖
npm install

# 构建生产版本
npm run build

# 验证构建结果
ls -la dist/
```

---

## 4️⃣ Nginx 配置

### 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 设置文件权限（重要！）

Nginx 需要权限访问前端静态文件：

```bash
# 让 www-data 用户能进入 ubuntu 的 home 目录
sudo chmod 755 /home/ubuntu

# 确保整个项目目录可读
sudo chmod -R 755 /home/ubuntu/projects

# 确保 dist 目录权限正确
sudo chown -R ubuntu:ubuntu /home/ubuntu/projects/Barbie/apps/frontend/dist
sudo chmod -R 755 /home/ubuntu/projects/Barbie/apps/frontend/dist
```

### 创建 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/barbie
```

粘贴以下内容（替换 `YOUR_DOMAIN` 为你的域名）：

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    # 前端静态文件
    root /home/ubuntu/projects/Barbie/apps/frontend/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理到后端
    location /api {
        proxy_pass http://127.0.0.1:4273;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }

    # SPA 路由支持 - 所有其他请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 启用配置

```bash
# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/barbie /etc/nginx/sites-enabled/

# 删除默认站点
sudo rm /etc/nginx/sites-enabled/default

# 测试配置语法
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## 5️⃣ 防火墙配置

### UFW 防火墙

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### AWS 安全组（重要！）

> ⚠️ **注意**: 确保 EC2 实例附加的安全组正确！查看方法：  
> EC2 → Instances → 选择实例 → Security 标签 → 确认安全组名称

在 AWS Console → EC2 → Security Groups → **选择正确的安全组** → Inbound rules → Edit：

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| SSH | TCP | 22 | 你的 IP 或 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |

---

## 6️⃣ HTTPS 配置（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取并安装证书（替换为你的域名）
sudo certbot --nginx -d YOUR_DOMAIN

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 7️⃣ MongoDB Atlas 配置

需要在 MongoDB Atlas 添加服务器 IP 到白名单：

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 进入你的 Cluster → **Network Access**
3. **Add IP Address** → 输入你的服务器公网 IP
4. 或添加 `0.0.0.0/0` 允许所有（不推荐用于生产）

---

## 8️⃣ 验证部署

### 检查服务状态

```bash
# PM2 进程状态
pm2 status

# PM2 日志
pm2 logs barbie-backend --lines 50

# Nginx 状态
sudo systemctl status nginx

# Nginx 错误日志
sudo tail -20 /var/log/nginx/error.log
```

### 测试连接

```bash
# 测试后端（在服务器上）
curl http://localhost:4273/api/v1/auth/sign-up

# 测试前端（在服务器上）
curl -I http://localhost

# 测试外部访问（在本地电脑上）
curl -I http://YOUR_SERVER_IP
curl -I https://YOUR_DOMAIN
```

---

## 📝 常用运维命令

### PM2 命令

```bash
pm2 list                          # 查看所有进程
pm2 logs barbie-backend           # 查看日志
pm2 logs barbie-backend --lines 50  # 查看最近 50 行日志
pm2 restart barbie-backend        # 重启应用
pm2 stop barbie-backend           # 停止应用
pm2 delete barbie-backend         # 删除应用
pm2 monit                         # 实时监控
pm2 save                          # 保存进程列表
```

### Nginx 命令

```bash
sudo systemctl status nginx       # 状态
sudo systemctl start nginx        # 启动
sudo systemctl stop nginx         # 停止
sudo systemctl restart nginx      # 重启
sudo systemctl reload nginx       # 重载配置
sudo nginx -t                     # 测试配置语法
```

### 更新代码部署

```bash
# 进入项目目录
cd /home/ubuntu/projects/Barbie

# 拉取最新代码
git pull origin main

# 更新后端
cd apps/backend
npm install
pm2 restart barbie-backend

# 更新前端
cd ../frontend
npm install
npm run build
# Nginx 会自动使用新的静态文件，无需重启
```

---

## 🔧 故障排查

### 网络问题排查

```bash
# 检查端口监听
sudo ss -tlnp | grep :80
sudo ss -tlnp | grep :4273

# 检查 UFW 防火墙
sudo ufw status

# 从服务器测试外网连接
curl -I http://google.com

# DNS 解析检查
nslookup YOUR_DOMAIN
```

### Nginx 权限问题

如果看到 `Permission denied` 错误：

```bash
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 /home/ubuntu/projects
sudo systemctl restart nginx
```

### 后端无法启动

```bash
# 检查日志
pm2 logs barbie-backend --lines 100

# 检查环境变量文件是否存在
ls -la /home/ubuntu/projects/Barbie/apps/backend/.env.production.local

# 手动运行测试
cd /home/ubuntu/projects/Barbie/apps/backend
NODE_ENV=production node src/app.js
```

### 证书续期

Let's Encrypt 证书有效期 90 天，Certbot 会自动续期。手动续期：

```bash
sudo certbot renew
```

---

## 📁 目录结构

```
/home/ubuntu/
└── projects/
    └── Barbie/
        ├── apps/
        │   ├── backend/
        │   │   ├── .env.production.local  ← 环境变量（不要提交到 Git！）
        │   │   ├── src/
        │   │   ├── node_modules/
        │   │   └── package.json
        │   └── frontend/
        │       ├── dist/                   ← Nginx 服务的静态文件
        │       ├── node_modules/
        │       └── package.json
        └── ...

/etc/nginx/
├── sites-available/
│   └── barbie                              ← Nginx 配置
└── sites-enabled/
    └── barbie -> ../sites-available/barbie
```

---

## 🚀 快速部署命令汇总

连接服务器后，按顺序执行：

```bash
# === 系统准备 ===
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# === Node.js ===
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# === PM2 ===
sudo npm install -g pm2

# === 克隆代码 ===
cd /home/ubuntu && mkdir -p projects && cd projects
git clone https://github.com/1590703336/Barbie.git
cd Barbie

# === 后端 ===
cd apps/backend
npm install
# (先上传 .env.production.local)
pm2 start npm --name "barbie-backend" -- start
pm2 save

# === 前端 ===
cd ../frontend
npm install
npm run build

# === 权限 ===
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 /home/ubuntu/projects

# === Nginx ===
sudo apt install -y nginx
# (创建 /etc/nginx/sites-available/barbie 配置文件)
sudo ln -s /etc/nginx/sites-available/barbie /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# === 防火墙 ===
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# === PM2 开机自启 ===
pm2 startup systemd
# 执行输出的命令
pm2 save

# === HTTPS ===
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

---

## ⚠️ 重要提醒

1. **安全组**: 确保 EC2 实例附加的安全组开放了 80 和 443 端口
2. **MongoDB Atlas**: 添加服务器 IP 到白名单
3. **环境变量**: `.env.production.local` 包含敏感信息，**永远不要提交到 Git**
4. **备份**: 定期备份数据库和重要配置文件
5. **密钥轮换**: 如果密钥泄露，立即更换所有敏感配置

---

**最后更新**: 2026-01-15  
**项目地址**: https://github.com/1590703336/Barbie
