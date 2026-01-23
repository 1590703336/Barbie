# Preview 环境部署指南

> 在同一台服务器上并行运行 Production 和 Preview 两套环境

## 当前状态

| 环境 | 路径 | 分支 | 后端端口 | 访问地址 |
|------|------|------|----------|----------|
| Production | `/home/ubuntu/projects/Barbie` | main | 4273 | uofa.ink/ |
| Preview | `/home/ubuntu/projects/Barbie-preview` | preview | 4274 | uofa.ink/preview/ |

---

## 1️⃣ 修改前端 Base Path

在 `Barbie-preview/apps/frontend/vite.config.js` 中：

```javascript
// 【生产环境】部署到根路径 uofa.ink/
// const base = '/';
//
// 【开发预览】部署到 uofa.ink/preview/
const base = '/preview/';
```
端口从 4273 改为4274

**确保 `const base = '/preview/';` 是生效的那行（取消注释），另一行注释掉。**

---

## 2️⃣ 安装依赖 & 构建前端

```bash
cd /home/ubuntu/projects/Barbie-preview/apps/frontend
npm install
npm run build
```

验证构建结果：
```bash
ls -la dist/
# 应该看到 index.html 和其他静态文件
```

---

## 3️⃣ 启动 Preview 后端

```bash
cd /home/ubuntu/projects/Barbie-preview/apps/backend
npm install
pm2 start npm --name "barbie-backend-preview" -- start
pm2 save
```

验证后端运行：
```bash
pm2 status
# 应该看到 barbie-backend (4273) 和 barbie-backend-preview (4274) 都在运行

curl http://localhost:4274/api/v1/auth/sign-up
# 应该返回 JSON 响应
```

---

## 4️⃣ 更新 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/barbie
```

**在你现有配置的 `location / { ... }` 之后、`listen 443 ssl;` 之前，添加以下 Preview 配置：**

```nginx
    # ==========================================
    #              PREVIEW
    # ==========================================

    # Preview API - 重写路径后代理到 4274 端口
    location /preview/api {
        rewrite ^/preview/api(.*)$ /api$1 break;
        proxy_pass http://127.0.0.1:4274;
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

    # Preview 静态文件
    location /preview {
        alias /home/ubuntu/projects/Barbie-preview/apps/frontend/dist;
        try_files $uri $uri/ /preview/index.html;
    }
```

**完整配置应该是这样：**

```nginx
server {
    server_name uofa.ink;
    
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
    
    # Production API 代理到后端
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

    # ==========================================
    #              PREVIEW (新增)
    # ==========================================

    # Preview API - 重写路径后代理到 4274 端口
    location /preview/api {
        rewrite ^/preview/api(.*)$ /api$1 break;
        proxy_pass http://127.0.0.1:4274;
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

    # Preview 静态文件
    location /preview {
        alias /home/ubuntu/projects/Barbie-preview/apps/frontend/dist;
        try_files $uri $uri/ /preview/index.html;
    }

    # ===== 以下是 Certbot 自动生成的 SSL 配置，保持不变 =====
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/uofa.ink/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/uofa.ink/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = uofa.ink) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name uofa.ink;
    return 404; # managed by Certbot
}
```

**应用配置：**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5️⃣ 设置权限

```bash
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 /home/ubuntu/projects/Barbie-preview
```

---

## 6️⃣ 验证部署

```bash
# 测试 Production
curl -I http://localhost
curl http://localhost/api/v1/auth/sign-up

# 测试 Preview
curl -I http://localhost/preview/
curl http://localhost/preview/api/v1/auth/sign-up
```

从外部访问测试：
- Production: https://uofa.ink/
- Preview: https://uofa.ink/preview/

---

## 📝 常用命令

```bash
# 查看所有 PM2 进程
pm2 status

# 查看日志
pm2 logs barbie-backend-preview --lines 50

# 重启 Preview 后端
pm2 restart barbie-backend-preview

# 更新 Preview 代码
cd /home/ubuntu/projects/Barbie-preview
git pull origin preview
cd apps/backend && npm install && pm2 restart barbie-backend-preview
cd ../frontend && npm install && npm run build
```

---

## 🔧 故障排查

**404 错误？**
- 检查 `vite.config.js` 的 base 是否正确设置为 `/preview/`
- 检查 Nginx alias 路径是否正确

**API 请求失败？**
- 确认前端代码中 API 请求使用相对路径 `/api/...`（Vite 的 base path 会自动处理）
- 检查 PM2 进程是否在运行：`pm2 status`

**权限问题？**
```bash
sudo chmod -R 755 /home/ubuntu/projects/Barbie-preview
```
