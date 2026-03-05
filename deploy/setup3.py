import subprocess, os, glob

def run(cmd):
    print(f">> {cmd}")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout: print(r.stdout.strip())
    if r.stderr: print(r.stderr.strip())
    return r.returncode

# Buscar configs con tribu
print("=== Buscando configs con tribu ===")
for f in glob.glob('/etc/nginx/sites-enabled/*') + glob.glob('/etc/nginx/conf.d/*'):
    try:
        content = open(f).read()
        if 'tribu' in content:
            print(f"ENCONTRADO: {f}")
            print(content[:300])
            print("---")
    except: pass

# Remover configs viejas de tribu en conf.d
for f in glob.glob('/etc/nginx/conf.d/*'):
    try:
        if 'tribu' in open(f).read():
            os.remove(f)
            print(f"ELIMINADO: {f}")
    except: pass

# Escribir config limpia HTTP-only
http_conf = """server {
    listen 80;
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
run("ln -sf /etc/nginx/sites-available/tribu /etc/nginx/sites-enabled/tribu")
run("nginx -t 2>&1")
run("systemctl reload nginx")
print("Nginx OK")

# Certbot
print("=== Obteniendo SSL ===")
run("certbot certificates 2>&1")
code = run("certbot --nginx -d tribu.centralchat.pro --non-interactive --agree-tos --email admin@centralchat.pro --redirect 2>&1")
if code == 0:
    print("SSL OBTENIDO!")
else:
    # Intentar con --force-renewal
    print("Intentando con standalone...")
    run("systemctl stop nginx")
    code2 = run("certbot certonly --standalone -d tribu.centralchat.pro --non-interactive --agree-tos --email admin@centralchat.pro 2>&1")
    run("systemctl start nginx")
    if code2 == 0:
        # Poner config con SSL
        ssl_conf = """server {
    listen 80;
    server_name tribu.centralchat.pro;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name tribu.centralchat.pro;
    ssl_certificate /etc/letsencrypt/live/tribu.centralchat.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tribu.centralchat.pro/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
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
            f.write(ssl_conf)
        run("nginx -t && systemctl reload nginx")
        print("SSL standalone OK!")
    else:
        print("SSL FALLO - site funciona en HTTP: http://tribu.centralchat.pro")

run("nginx -t 2>&1")
run("systemctl reload nginx 2>&1")
print("\n=== FINAL ===")
run("pm2 status tribu")
print("Site: http://tribu.centralchat.pro")
