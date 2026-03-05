/* index.js — Tribu homepage: posts grid, categories, search, post modal */

let currentCat = 'all';
let currentPage = 1;
let searchTimer = null;

async function loadStats() {
  try {
    const data = await api('GET', '/posts/stats', null, false);
    const eu = document.getElementById('statUsers');
    const ep = document.getElementById('statPosts');
    if (eu) eu.textContent = data.users || 0;
    if (ep) ep.textContent = data.posts || 0;
  } catch {}
}

async function loadPosts(page = 1) {
  currentPage = page;
  const grid    = document.getElementById('postsGrid');
  const empty   = document.getElementById('postsEmpty');
  const loading = document.getElementById('postsLoading');
  const pag     = document.getElementById('pagination');

  if (loading) { loading.style.display = 'block'; }
  if (grid)    { grid.innerHTML = ''; }
  if (empty)   { empty.style.display = 'none'; }
  if (pag)     { pag.innerHTML = ''; }

  const q   = (document.getElementById('searchInput') || {}).value || '';
  const cat = currentCat === 'all' ? '' : currentCat;

  try {
    const params = new URLSearchParams({ page, ...(cat && { cat }), ...(q.trim() && { q: q.trim() }) });
    const data   = await api('GET', '/posts?' + params, null, false);

    if (loading) loading.style.display = 'none';

    if (!data.posts || data.posts.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }

    data.posts.forEach(p => {
      const card = buildPostCard(p);
      grid.appendChild(card);
    });

    buildPagination(data.page, data.pages);
  } catch (e) {
    if (loading) loading.style.display = 'none';
    if (grid) grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-light)">Error al cargar publicaciones.</p>';
  }
}

function buildPostCard(p) {
  const div = document.createElement('div');
  div.className = 'post-card';
  div.onclick = () => openPost(p.id);

  const photoHTML = p.photo
    ? `<img src="/uploads/${p.photo}" alt="${p.title}" loading="lazy"/>`
    : `<div class="pc-img-placeholder"><i class="fas ${catIcon(p.category)}"></i></div>`;

  const videoHTML = p.video_url
    ? `<span class="pc-video-badge"><i class="fas fa-play-circle"></i> Video</span>`
    : '';

  div.innerHTML = `
    <div class="pc-img">
      ${photoHTML}
      <div class="pc-cat">${catBadgeHTML(p.category)}</div>
      ${videoHTML ? `<div style="position:absolute;bottom:10px;right:10px">${videoHTML}</div>` : ''}
    </div>
    <div class="pc-body">
      <div class="pc-title">${esc(p.title)}</div>
      <div class="pc-excerpt">${esc(p.body)}</div>
      <div class="pc-footer">
        <span class="pc-author"><i class="fas fa-user-circle"></i> ${esc(p.author_name)}${p.author_country ? ' · ' + esc(p.author_country) : ''}</span>
        <span class="pc-meta">
          <span><i class="fas fa-eye"></i> ${p.views || 0}</span>
          <span><i class="fas fa-heart"></i> ${p.likes || 0}</span>
        </span>
      </div>
    </div>
  `;
  return div;
}

function catIcon(cat) {
  const icons = { farming:'fa-tractor', gardening:'fa-seedling', preservation:'fa-jar', building:'fa-house', hunting:'fa-fish', tools:'fa-hammer', survival:'fa-fire', adventures:'fa-mountain' };
  return icons[cat] || 'fa-leaf';
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildPagination(page, pages) {
  const pag = document.getElementById('pagination');
  if (!pag || pages <= 1) return;
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i === page ? ' active' : '');
    btn.textContent = i;
    btn.onclick = () => { loadPosts(i); window.scrollTo({ top: document.getElementById('posts').offsetTop - 80, behavior: 'smooth' }); };
    pag.appendChild(btn);
  }
}

function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadPosts(1);
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadPosts(1), 400);
}

async function openPost(id) {
  const modal = document.getElementById('postModal');
  const body  = document.getElementById('postDetailBody');
  const badge = document.getElementById('pdCatBadge');
  if (!modal || !body) return;

  body.innerHTML = '<div class="posts-loading"><i class="fas fa-spinner fa-spin"></i></div>';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const p = await api('GET', '/posts/' + id, null, false);
    if (badge) badge.innerHTML = catBadgeHTML(p.category);

    const ytId = getYoutubeId(p.video_url);
    const videoSection = ytId
      ? `<div class="pd-video"><h4><i class="fas fa-play-circle"></i> Video</h4><div class="pd-video-frame"><iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe></div></div>`
      : (p.video_url ? `<div class="pd-video"><a href="${esc(p.video_url)}" target="_blank" class="btn btn-outline btn-sm"><i class="fas fa-play"></i> Ver video</a></div>` : '');

    const photoSection = p.photo
      ? `<img src="/uploads/${p.photo}" alt="${esc(p.title)}" class="pd-img"/>`
      : '';

    body.innerHTML = `
      <div class="pd-header">
        <h2 class="pd-title">${esc(p.title)}</h2>
        <div class="pd-meta">
          <span><i class="fas fa-user-circle"></i> ${esc(p.author_name)}${p.author_country ? ', ' + esc(p.author_country) : ''}</span>
          <span><i class="fas fa-calendar"></i> ${formatDate(p.created_at)}</span>
          <span><i class="fas fa-eye"></i> ${p.views} ${t('views')}</span>
          <span><i class="fas fa-heart"></i> ${p.likes} ${t('likes')}</span>
        </div>
      </div>
      ${photoSection}
      <div class="pd-body">${esc(p.body)}</div>
      ${videoSection}
      <div class="pd-author">
        <div class="pd-author-icon"><i class="fas fa-user"></i></div>
        <div class="pd-author-info">
          <strong>${esc(p.author_name)}</strong>
          <span>${p.author_country || ''} ${p.author_bio ? '· ' + esc(p.author_bio) : ''}</span>
        </div>
      </div>
      <div class="pd-actions">
        <button class="btn btn-outline btn-sm" onclick="likePost(${p.id}, this)">
          <i class="fas fa-heart"></i> <span id="likeCount_${p.id}">${p.likes}</span> ${t('likes')}
        </button>
        <a href="/post?id=${p.id}" class="btn btn-primary btn-sm">
          <i class="fas fa-external-link-alt"></i> ${t('read_more')}
        </a>
      </div>
    `;
  } catch {
    body.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-light)">Error al cargar.</p>';
  }
}

function closePostModal(e) {
  if (e && e.target !== document.getElementById('postModal')) return;
  document.getElementById('postModal').classList.remove('open');
  document.body.style.overflow = '';
}

async function likePost(id, btn) {
  if (!isLoggedIn()) { alert(t('must_login')); return; }
  try {
    const data = await api('POST', '/posts/' + id + '/like', {});
    const span = document.getElementById('likeCount_' + id);
    if (span) span.textContent = data.likes;
    btn.style.color = 'var(--green)';
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadPosts(1);
});
