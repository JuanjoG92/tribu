import subprocess, os, glob

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(r.stdout.strip())
    if r.stderr.strip(): print("ERR:", r.stderr.strip())

# Ver TODOS los server blocks en todos los archivos nginx
print("=== TODOS los sites-enabled ===")
run("ls -la /etc/nginx/sites-enabled/")

print("\n=== TODOS los conf.d ===")
run("ls -la /etc/nginx/conf.d/")

print("\n=== Grep tribu en todo nginx ===")
run("grep -rl 'tribu' /etc/nginx/ 2>/dev/null")

print("\n=== server_name en sites-enabled ===")
for f in sorted(glob.glob('/etc/nginx/sites-enabled/*')):
    try:
        real = os.path.realpath(f)
        c = open(real).read()
        lines = [l.strip() for l in c.split('\n') if 'server_name' in l or 'listen' in l]
        print(f"\n{f} -> {real}")
        for l in lines: print(f"  {l}")
    except Exception as e:
        print(f"{f}: error {e}")

print("\n=== Curl directo al puerto 443 VPS ===")
run("curl -sk --resolve tribu.centralchat.pro:443:127.0.0.1 https://tribu.centralchat.pro/ -o /dev/null -w 'HTTP %{http_code} -> %{redirect_url}'")

print("\n=== Curl directo al puerto 3803 ===")
run("curl -s http://127.0.0.1:3803/ -o /dev/null -w 'HTTP %{http_code}'")
