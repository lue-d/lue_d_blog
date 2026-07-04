#!/bin/bash
set -e

SERVER="root@122.51.117.106"
REMOTE_DIR="/var/www/blog"

echo "🔨 构建中..."
npm run build

echo "📦 上传到服务器..."
rsync -avz --delete out/ "$SERVER:$REMOTE_DIR/"

echo "✅ 部署完成！https://lued.top"
