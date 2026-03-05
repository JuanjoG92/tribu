import subprocess

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(r.stdout.strip())
    if r.stderr.strip(): print("ERR:", r.stderr.strip())

# Nginx config: ambos puertos proxy directo al app (Cloudflare maneja SSL)
conf = """server {
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
    f.write(conf)
print("Config escrita")

run("nginx -t 2>&1")
run("systemctl reload nginx")
print("Nginx recargado")

run("curl -s http://127.0.0.1:3803/ -o /dev/null -w 'Puerto 3803: HTTP %{http_code}'")
run("curl -sk --resolve tribu.centralchat.pro:80:127.0.0.1 http://tribu.centralchat.pro/ -o /dev/null -w 'Puerto 80: HTTP %{http_code}'")
run("curl -sk --resolve tribu.centralchat.pro:443:127.0.0.1 https://tribu.centralchat.pro/ -o /dev/null -w 'Puerto 443: HTTP %{http_code}'")
print("Listo!")
