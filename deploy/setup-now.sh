#!/bin/bash
# Tribu - Setup completo en VPS
set -e

DIR="/var/www/tribu"

# .env
cp /tmp/tribu.env $DIR/.env
echo ".env copiado"

# Directorios
mkdir -p $DIR/data $DIR/public/uploads
echo "Dirs OK"

# PM2
cd $DIR
pm2 describe tribu > /dev/null 2>&1 && pm2 restart tribu || pm2 start server.js --name tribu
pm2 save
echo "PM2 OK"

# Nginx
cp $DIR/deploy/nginx.conf /etc/nginx/sites-available/tribu
ln -sf /etc/nginx/sites-available/tribu /etc/nginx/sites-enabled/tribu
nginx -t && systemctl reload nginx
echo "Nginx OK"

# SSL
certbot --nginx -d tribu.centralchat.pro --non-interactive --agree-tos --email admin@centralchat.pro --redirect 2>&1 || echo "SSL - verificar manualmente"

# Webhook secret
HOOK=$(grep WEBHOOK_SECRET $DIR/.env | cut -d= -f2)
echo ""
echo "===== LISTO ====="
echo "URL: https://tribu.centralchat.pro"
echo "Webhook URL: https://tribu.centralchat.pro/api/webhook/github"
echo "Webhook Secret: $HOOK"
pm2 status
