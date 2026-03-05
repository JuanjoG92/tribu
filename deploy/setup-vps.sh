#!/bin/bash
# Tribu VPS Setup - Node.js + PM2 + Nginx + SSL
set -e

APP="tribu"
REPO="https://github.com/JuanjoG92/tribu.git"
DIR="/var/www/tribu"
PORT=3803
DOMAIN="tribu.centralchat.pro"

echo "===== Tribu VPS Setup ====="

# 1. Clone or pull repo
if [ ! -d "$DIR" ]; then
  echo "Cloning repo..."
  git clone "$REPO" "$DIR"
else
  echo "Pulling latest..."
  cd "$DIR" && git pull origin main
fi

cd "$DIR"

# 2. Install dependencies
echo "Installing npm dependencies..."
npm install --production

# 3. Create .env
if [ ! -f "$DIR/.env" ]; then
  echo "Creating .env..."
  cat > "$DIR/.env" << ENV
PORT=$PORT
JWT_SECRET=$(openssl rand -hex 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)
ENV
  echo ".env created - save the secrets!"
fi

# 4. Create data dir
mkdir -p "$DIR/data"
mkdir -p "$DIR/public/uploads"

# 5. PM2
echo "Starting with PM2..."
pm2 describe "$APP" > /dev/null 2>&1 && pm2 restart "$APP" || pm2 start server.js --name "$APP" --cwd "$DIR"
pm2 save

# 6. Nginx config
echo "Configuring Nginx..."
cp "$DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$APP"
if [ ! -L "/etc/nginx/sites-enabled/$APP" ]; then
  ln -s "/etc/nginx/sites-available/$APP" "/etc/nginx/sites-enabled/$APP"
fi
nginx -t && systemctl reload nginx
echo "Nginx configured!"

# 7. SSL
echo "Setting up SSL..."
if command -v certbot &> /dev/null; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
    --email admin@centralchat.pro --redirect 2>/dev/null \
    || echo "SSL may already exist - check manually"
else
  echo "Install certbot: apt install certbot python3-certbot-nginx"
fi

# 8. GitHub Webhook secret
WEBHOOK_SECRET=$(grep WEBHOOK_SECRET "$DIR/.env" | cut -d= -f2)

echo ""
echo "===== DONE ====="
echo "Site: https://$DOMAIN"
echo "PM2: pm2 status"
echo ""
echo "Add GitHub Webhook:"
echo "  Repo → Settings → Webhooks → Add webhook"
echo "  URL: https://$DOMAIN/api/webhook/github"
echo "  Content-Type: application/json"
echo "  Secret: $WEBHOOK_SECRET"
echo "  Event: Just the push event"
