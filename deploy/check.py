import subprocess, os, glob

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.stdout: print(r.stdout.strip())
    if r.stderr: print(r.stderr.strip())
    return r.returncode

# Encontrar TODOS los archivos con tribu.centralchat.pro
print("=== Archivos nginx con tribu ===")
all_files = glob.glob('/etc/nginx/**/*', recursive=True)
for f in all_files:
    if os.path.isfile(f):
        try:
            c = open(f).read()
            if 'tribu.centralchat.pro' in c:
                print(f"ARCHIVO: {f}")
                print(c)
                print("---")
        except: pass
