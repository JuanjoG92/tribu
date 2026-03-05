import subprocess

def run(cmd):
    print(f">> {cmd}")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout: print(r.stdout)
    if r.stderr: print(r.stderr)
    return r.returncode

# Nginx HTTP-only (sin SSL) para que certbot pueda verificar el dominio
http_conf = """server {
    listen 80;
    listen [::]:80;
    server_name tribu.centralchat.pro;
    client_max_body_size 20M;
    location / {
        proxy_pass http://127.0.0.1:3803;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
"""

with open('/etc/nginx/sites-available/tribu', 'w') as f:
    f.write(http_conf)
print("HTTP config written")

run("ln -sf /etc/nginx/sites-available/tribu /etc/nginx/sites-enabled/tribu")
run("nginx -t")
run("systemctl reload nginx")
print("Nginx HTTP OK")

# Limpiar estado roto de certbot
run("rm -rf /var/lib/letsencrypt/temp_checkpoint 2>/dev/null || true")

# Obtener SSL
code = run("certbot --nginx -d tribu.centralchat.pro --non-interactive --agree-tos --email admin@centralchat.pro --redirect")
if code == 0:
    print("SSL OK!")
else:
    print("SSL FALLO - verificar DNS de tribu.centralchat.pro")
    run("nslookup tribu.centralchat.pro")

run("nginx -t")
run("systemctl reload nginx")
run("pm2 status tribu")
print("\nURL: https://tribu.centralchat.pro")
