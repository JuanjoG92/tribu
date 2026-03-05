/* new-post.js — Tribu: formulario de publicación con términos */

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location = '/login?redirect=/new-post';
    return;
  }
  // Set lang select to current lang
  const fLang = document.getElementById('fLang');
  if (fLang) fLang.value = currentLang || 'es';
});

function checkTerms() {
  const chk = document.getElementById('termsCheck');
  const btn = document.getElementById('termsNextBtn');
  if (btn) btn.disabled = !chk.checked;
}

function showForm() {
  document.getElementById('termsStep').style.display = 'none';
  document.getElementById('uploadCard').style.display = 'block';
}

function updateCount() {
  const ta = document.getElementById('fBody');
  const sp = document.getElementById('bodyCount');
  if (sp && ta) sp.textContent = ta.value.length;
}

function previewPhoto(input) {
  const preview = document.getElementById('photoPreview');
  const drop    = document.getElementById('fileDrop');
  if (input.files && input.files[0]) {
    if (input.files[0].size > 8 * 1024 * 1024) {
      alert('La imagen no puede superar los 8MB');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      if (drop) drop.innerHTML = '<i class="fas fa-check-circle" style="color:var(--green)"></i> <span>Imagen seleccionada</span>';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function submitPost(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const msg = document.getElementById('uploadMsg');

  const cat   = document.getElementById('fCat').value;
  const title = document.getElementById('fTitle').value.trim();
  const body  = document.getElementById('fBody').value.trim();
  const video = document.getElementById('fVideo').value.trim();
  const lang  = document.getElementById('fLang').value;
  const photo = document.getElementById('fPhoto').files[0];

  if (!cat || !title || !body) {
    showMsg(t('error_required'), 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  showMsg('', '');

  try {
    const formData = new FormData();
    formData.append('category', cat);
    formData.append('title', title);
    formData.append('body', body);
    formData.append('video_url', video);
    formData.append('lang', lang);
    formData.append('terms', 'true');
    if (photo) formData.append('photo', photo);

    const token = getToken();
    const r = await fetch('/api/posts', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Error al publicar');

    showMsg('✅ Publicado correctamente. Redirigiendo...', 'success');
    setTimeout(() => { window.location = '/post?id=' + data.id; }, 1500);
  } catch (err) {
    showMsg(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + t('btn_publish') + '</span>';
  }
}

function showMsg(text, type) {
  const m = document.getElementById('uploadMsg');
  if (!m) return;
  if (!text) { m.style.display = 'none'; return; }
  m.textContent = text;
  m.className = 'upload-msg ' + type;
  m.style.display = 'block';
}
