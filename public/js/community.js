/* community.js — Tribu Merrali */

const CAT_ICONS = {
  farming:'fa-tractor', gardening:'fa-seedling', beekeeping:'fa-bug',
  medicinal:'fa-mortar-pestle', preservation:'fa-jar', building:'fa-house',
  hunting:'fa-fish', tools:'fa-hammer', survival:'fa-fire', adventures:'fa-mountain'
};

let currentCat = 'all';
let currentPage = 1;
let searchTimeout = null;

/* ── STATS ── */
async function loadStats() {
  try {
    const r = await fetch('/api/posts/stats');
    const d = await r.json();
    animateCount('statPosts', d.posts || 0);
    animateCount('statUsers', d.users || 0);
  } catch { /* silent */ }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let n = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const timer = setInterval(() => {
    n = Math.min(n + step, target);
    el.textContent = n;
    if (n >= target) clearInterval(timer);
  }, 40);
}

/* ── POSTS ── */
async function loadPosts() {
  const grid = document.getElementById('postsGrid');
  const empty = document.getElementById('postsEmpty');
  const loading = document.getElementById('postsLoading');
  if (!grid) return;

  loading && (loading.style.display = 'flex');
  empty && (empty.style.display = 'none');

  const q = document.getElementById('searchInput')?.value.trim() || '';
  const params = new URLSearchParams({ page: currentPage });
  if (currentCat !== 'all') params.set('cat', currentCat);
  if (q) params.set('q', q);

  try {
    const r = await fetch('/api/posts?' + params);
    const d = await r.json();
    loading && (loading.style.display = 'none');

    if (!d.posts || d.posts.length === 0) {
      grid.innerHTML = '';
      empty && (empty.style.display = 'flex');
    } else {
      empty && (empty.style.display = 'none');
      grid.innerHTML = d.posts.map(renderPostCard).join('');
      renderPagination(d.pages, d.page);
    }
  } catch {
    loading && (loading.style.display = 'none');
    grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;padding:40px">Error al cargar publicaciones.</p>';
  }
}

function renderPostCard(p) {
  const icon = CAT_ICONS[p.category] || 'fa-leaf';
  const img = p.photo
    ? `<div class="post-card-img"><img src="/uploads/${p.photo}" alt="${escHtml(p.title)}" loading="lazy"/></div>`
    : `<div class="post-card-img"><i class="fas ${icon}"></i></div>`;
  const preview = p.body ? p.body.substring(0, 120) + (p.body.length > 120 ? '...' : '') : '';
  const country = p.author_country ? ` · ${p.author_country}` : '';
  return `<div class="post-card" onclick="openPostDetail(${p.id})">
    ${img}
    <div class="post-card-body">
      <span class="post-card-cat badge-${p.category}"><i class="fas ${icon}"></i> ${t('cat_' + p.category)}</span>
      <h3 class="post-card-title">${escHtml(p.title)}</h3>
      <p class="post-card-body-text">${escHtml(preview)}</p>
      <div class="post-card-footer">
        <span class="post-card-author"><i class="fas fa-user-circle"></i> ${escHtml(p.author_name)}${escHtml(country)}</span>
        <span class="post-card-stats">
          <span><i class="fas fa-eye"></i> ${p.views||0}</span>
          <span><i class="fas fa-heart"></i> ${p.likes||0}</span>
        </span>
      </div>
    </div>
  </div>`;
}

function renderPagination(pages, current) {
  const el = document.getElementById('postsPagination');
  if (!el || pages <= 1) { if(el) el.innerHTML=''; return; }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn${i===current?' active':''}" onclick="goPage(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  loadPosts();
  document.getElementById('posts')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ── FILTER ── */
function filterCat(cat, el) {
  currentCat = cat;
  currentPage = 1;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  el && el.classList.add('active');
  loadPosts();
}

/* ── SEARCH ── */
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage=1; loadPosts(); }, 400);
}

/* ── POST DETAIL ── */
async function openPostDetail(id) {
  const modal = document.getElementById('postModal');
  const body = document.getElementById('postDetailBody');
  const badge = document.getElementById('pdCatBadge');
  if (!modal) return;

  modal.classList.add('open');
  body.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--green)"></i></div>';

  try {
    const r = await fetch('/api/posts/' + id);
    const p = await r.json();
    if (p.error) { body.innerHTML = '<p>No encontrado.</p>'; return; }

    const icon = CAT_ICONS[p.category] || 'fa-leaf';
    if (badge) badge.innerHTML = `<span class="cat-badge badge-${p.category}"><i class="fas ${icon}"></i> ${t('cat_' + p.category)}</span>`;

    const ytId = getYoutubeId(p.video_url);
    const videoHtml = ytId
      ? `<div class="pd-video"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>` : '';
    const photoHtml = p.photo
      ? `<div class="pd-photo"><img src="/uploads/${p.photo}" alt="${escHtml(p.title)}"/></div>` : '';
    const country = p.author_country ? ` · ${p.author_country}` : '';
    const loggedIn = isLoggedIn();

    body.innerHTML = `
      <h2 class="pd-title">${escHtml(p.title)}</h2>
      <div class="pd-meta">
        <span><i class="fas fa-user-circle"></i> ${escHtml(p.author_name)}${escHtml(country)}</span>
        <span><i class="fas fa-calendar"></i> ${formatDate(p.created_at)}</span>
        <span><i class="fas fa-eye"></i> ${p.views||0} vistas</span>
        <span><i class="fas fa-heart"></i> <span id="likeCount">${p.likes||0}</span></span>
      </div>
      ${photoHtml}
      ${videoHtml}
      <div class="pd-body">${escHtml(p.body)}</div>
      <div class="pd-actions">
        ${loggedIn ? `<button class="btn btn-outline" onclick="likePost(${p.id})"><i class="fas fa-heart"></i> Me gusta</button>` : ''}
        <button class="btn btn-outline" onclick="closePostModal()"><i class="fas fa-times"></i> Cerrar</button>
      </div>`;
  } catch {
    body.innerHTML = '<p style="text-align:center;color:#999">Error al cargar.</p>';
  }
}

async function likePost(id) {
  try {
    const token = localStorage.getItem('tribu_token');
    const r = await fetch('/api/posts/' + id + '/like', {
      method:'POST', headers:{ Authorization:'Bearer ' + token }
    });
    const d = await r.json();
    const el = document.getElementById('likeCount');
    if (el && d.likes !== undefined) el.textContent = d.likes;
  } catch { /* silent */ }
}

function closePostModal(e) {
  if (e && e.target !== document.getElementById('postModal')) return;
  document.getElementById('postModal')?.classList.remove('open');
}

/* ── UPLOAD MODAL ── */
function openUploadModal() {
  if (!isLoggedIn()) { window.location.href = '/login'; return; }
  document.getElementById('uploadModal')?.classList.add('open');
  document.getElementById('termsStep').style.display = '';
  document.getElementById('uploadForm').style.display = 'none';
  document.getElementById('termsCheck').checked = false;
  document.getElementById('termsNextBtn').disabled = true;
  document.getElementById('uploadMsg').style.display = 'none';
  document.getElementById('bodyCount').textContent = '0/3000';
}

function closeUploadModal(e) {
  if (e && e.target !== document.getElementById('uploadModal')) return;
  document.getElementById('uploadModal')?.classList.remove('open');
}

function checkTerms() {
  document.getElementById('termsNextBtn').disabled = !document.getElementById('termsCheck').checked;
}

function showUploadForm() {
  document.getElementById('termsStep').style.display = 'none';
  document.getElementById('uploadForm').style.display = '';
}

function previewPhoto(input) {
  const prev = document.getElementById('photoPreview');
  if (!prev) return;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => { prev.src = e.target.result; prev.style.display = 'block'; };
    reader.readAsDataURL(input.files[0]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.getElementById('fBody');
  if (body) body.addEventListener('input', () => {
    document.getElementById('bodyCount').textContent = body.value.length + '/3000';
  });
});

async function submitPost(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const msg = document.getElementById('uploadMsg');
  btn.disabled = true;

  const fd = new FormData();
  fd.append('category', document.getElementById('fCat').value);
  fd.append('title', document.getElementById('fTitle').value);
  fd.append('body', document.getElementById('fBody').value);
  fd.append('video_url', document.getElementById('fVideo').value);
  fd.append('lang', document.getElementById('fLang').value);
  fd.append('terms', 'true');
  const photo = document.getElementById('fPhoto').files[0];
  if (photo) fd.append('photo', photo);

  try {
    const token = localStorage.getItem('tribu_token');
    const r = await fetch('/api/posts', {
      method:'POST',
      headers:{ Authorization:'Bearer ' + token },
      body: fd
    });
    const d = await r.json();
    msg.style.display = 'block';
    if (r.ok) {
      msg.className = 'upload-msg success';
      msg.textContent = '¡Publicado exitosamente!';
      setTimeout(() => { closeUploadModal(); loadPosts(); loadStats(); e.target.reset(); document.getElementById('photoPreview').style.display='none'; }, 1800);
    } else {
      msg.className = 'upload-msg error';
      msg.textContent = d.error || 'Error al publicar.';
      btn.disabled = false;
    }
  } catch {
    msg.style.display = 'block';
    msg.className = 'upload-msg error';
    msg.textContent = 'Error de conexión.';
    btn.disabled = false;
  }
}

/* ── HELPERS ── */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPosts();
});
