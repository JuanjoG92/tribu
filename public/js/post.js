/* post.js — Tribu: página de detalle de publicación */

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadPost() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showError(); return; }

  try {
    const p = await api('GET', '/posts/' + id, null, false);

    document.title = p.title + ' · Tribu';

    const badge   = document.getElementById('pdCatBadge');
    const title   = document.getElementById('pdTitle');
    const meta    = document.getElementById('pdMeta');
    const img     = document.getElementById('pdImg');
    const body    = document.getElementById('pdBody');
    const video   = document.getElementById('pdVideo');
    const author  = document.getElementById('pdAuthor');
    const actions = document.getElementById('pdActions');

    if (badge)  badge.innerHTML = catBadgeHTML(p.category);
    if (title)  title.textContent = p.title;

    if (meta) {
      meta.innerHTML = `
        <span><i class="fas fa-user-circle"></i> ${esc(p.author_name)}${p.author_country ? ', ' + esc(p.author_country) : ''}</span>
        <span><i class="fas fa-calendar"></i> ${formatDate(p.created_at)}</span>
        <span><i class="fas fa-eye"></i> ${p.views} ${t('views')}</span>
        <span><i class="fas fa-heart"></i> <span id="likeCount">${p.likes}</span> ${t('likes')}</span>
      `;
    }

    if (p.photo && img) {
      img.src = '/uploads/' + p.photo;
      img.alt = p.title;
      img.style.display = 'block';
    }

    if (body) body.textContent = p.body;

    const ytId = getYoutubeId(p.video_url);
    if (video) {
      if (ytId) {
        video.innerHTML = `
          <div class="pd-video">
            <h4><i class="fas fa-play-circle"></i> Video</h4>
            <div class="pd-video-frame">
              <iframe src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
            </div>
          </div>`;
      } else if (p.video_url) {
        video.innerHTML = `<div class="pd-video" style="margin-top:20px"><a href="${esc(p.video_url)}" target="_blank" class="btn btn-outline"><i class="fas fa-play"></i> Ver video</a></div>`;
      }
    }

    if (author) {
      author.innerHTML = `
        <div class="pd-author-icon"><i class="fas fa-user"></i></div>
        <div class="pd-author-info">
          <strong>${esc(p.author_name)}</strong>
          <span>${esc(p.author_country || '')}${p.author_bio ? ' · ' + esc(p.author_bio) : ''}</span>
        </div>
      `;
    }

    if (actions) {
      actions.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="likePost(${p.id})">
          <i class="fas fa-heart"></i> <span id="likeBtn">${p.likes}</span> ${t('likes')}
        </button>
        <a href="/" class="btn btn-primary btn-sm"><i class="fas fa-arrow-left"></i> ${t('nav_home')}</a>
      `;
    }

    document.getElementById('postLoading').style.display = 'none';
    document.getElementById('postContent').style.display = 'block';
  } catch {
    showError();
  }
}

function showError() {
  document.getElementById('postLoading').style.display = 'none';
  document.getElementById('postError').style.display = 'block';
}

async function likePost(id) {
  if (!isLoggedIn()) { alert(t('must_login')); return; }
  try {
    const data = await api('POST', '/posts/' + id + '/like', {});
    const lc = document.getElementById('likeCount');
    const lb = document.getElementById('likeBtn');
    if (lc) lc.textContent = data.likes;
    if (lb) lb.textContent = data.likes;
  } catch {}
}

document.addEventListener('DOMContentLoaded', loadPost);
