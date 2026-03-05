# Copilot Instructions - Tribu

## Proyecto
Plataforma de conocimiento comunitario: Agricultura Comunitaria, Vida Tribal, Merrali.
Comparte sabiduría ancestral: cultivo, construcción natural, conservación, supervivencia, caza, herramientas, aventuras tribales.

## URL producción
**https://tribu.centralchat.pro/**

## Stack técnico
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (NO frameworks, NO TypeScript)
- **Auth**: JWT
- **Upload**: Multer (imágenes hasta 8MB)
- **NO compilación**. NUNCA usar `run_build`.

## Repositorio Git
- **Repo**: `https://github.com/JuanjoG92/tribu.git`
- **Branch**: `main`
- **Carpeta local**: `C:\tribu`

## VPS
- IP: `172.96.8.245`
- SSH: `ssh -i "$env:USERPROFILE\.ssh\nueva_llave" root@172.96.8.245`
- Ruta: `/var/www/tribu`
- Puerto: `3803`
- PM2: `tribu`
- Dominio: `tribu.centralchat.pro`
- Webhook autodeploy: `POST /api/webhook/github`

## Flujo de deploy
```powershell
cd C:\tribu; git add -A; git commit -m "descripción"; git push origin main
```
Deploy automático vía webhook → VPS auto-actualiza y reinicia PM2.

## Estructura
```
tribu/
├── public/
│   ├── css/app.css
│   ├── js/app.js       ← i18n 16 idiomas + helpers
│   ├── js/index.js     ← homepage posts grid
│   ├── js/post.js      ← detalle post
│   ├── js/new-post.js  ← formulario publicar
│   ├── uploads/
│   ├── index.html
│   ├── post.html
│   ├── new-post.html
│   ├── login.html
│   └── register.html
├── src/
│   ├── models/db.js    ← SQLite: users, posts, post_likes
│   ├── routes/auth.js  ← POST /api/auth/register|login
│   ├── routes/posts.js ← GET/POST /api/posts
│   └── routes/webhook.js
├── server.js           ← puerto 3803
└── package.json
```

## i18n - 16 idiomas
ES, EN, PT, DE, FR, IT, NL, RU, JA, PL, UK, SV, NO, ZH-TW, FI, AF
Sistema: atributos `data-i18n` + objeto LANGS en `public/js/app.js`

## Categorías de contenido
farming, gardening, preservation, building, hunting, tools, survival, adventures

## Paleta de colores
- Primary green: `#2d6a4f`
- Dark green: `#1b4332`
- Amber: `#d97706`
- BG: `#f8faf8`

## Sitios hermanos
- Merrali: https://merrali.centralchat.pro
- Campo Latam: https://campolatam.centralchat.pro
- Yeshua Cristiano (próximamente)
- Cangmakers (próximamente)
- Granjas Merrali (próximamente)
