import os, subprocess

def run(cmd):
    print(f">> {cmd}")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout: print(r.stdout)
    if r.stderr: print(r.stderr)
    return r.returncode

# 1. .env
with open('/var/www/tribu/.env', 'w') as f:
    f.write("PORT=3803\n")
    f.write("JWT_SECRET=tribu_jwt_x9k2m4n8p3q7r1s5_prod\n")
    f.write("WEBHOOK_SECRET=tribu_hook_w6v3b8c1d4e7f2g\n")
print(".env OK")

# 2. Directorios
os.makedirs('/var/www/tribu/data', exist_ok=True)
os.makedirs('/var/www/tribu/public/uploads', exist_ok=True)
print("Dirs OK")

# 3. PM2 - pull main branch first
run("cd /var/www/tribu && git fetch origin && git checkout main && git pull origin main")
run("pm2 delete tribu 2>/dev/null || true")
run("cd /var/www/tribu && pm2 start server.js --name tribu")
run("pm2 save")
print("PM2 OK")

# 4. Nginx
nginx_conf = open('/var/www/tribu/deploy/nginx.conf').read()
with open('/etc/nginx/sites-available/tribu', 'w') as f:
    f.write(nginx_conf)
run("ln -sf /etc/nginx/sites-available/tribu /etc/nginx/sites-enabled/tribu")
run("nginx -t")
run("systemctl reload nginx")
print("Nginx OK")

# 5. SSL
run("certbot --nginx -d tribu.centralchat.pro --non-interactive --agree-tos --email admin@centralchat.pro --redirect")

# 6. Status
run("pm2 status")
print("\n=== DONE ===")
print("URL: https://tribu.centralchat.pro")
print("Webhook: https://tribu.centralchat.pro/api/webhook/github")
print("Secret: tribu_hook_w6v3b8c1d4e7f2g")
