const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../models/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const router = express.Router();

const VALID_CATS = ['farming','gardening','preservation','building','hunting','tools','survival','adventures'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'post_' + Date.now() + '_' + Math.random().toString(36).slice(2) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    cb(ok ? null : new Error('Solo imágenes'), ok);
  }
});

// GET /api/posts
router.get('/', optionalAuth, (req, res) => {
  const { cat, page = 1, q } = req.query;
  const limit = 12;
  const offset = (parseInt(page) - 1) * limit;
  const db = getDB();
  let where = "p.status = 'active'";
  const params = [];
  if (cat && cat !== 'all' && VALID_CATS.includes(cat)) {
    where += ' AND p.category = ?'; params.push(cat);
  }
  if (q && q.trim()) {
    where += ' AND (p.title LIKE ? OR p.body LIKE ?)';
    params.push('%' + q.trim() + '%', '%' + q.trim() + '%');
  }
  try {
    const total = db.prepare(`SELECT COUNT(*) as n FROM posts p WHERE ${where}`).get(...params).n;
    const rows = db.prepare(`
      SELECT p.*, u.name as author_name, u.country as author_country
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    res.json({ posts: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET /api/posts/stats
router.get('/stats', (req, res) => {
  const db = getDB();
  try {
    const posts = db.prepare("SELECT COUNT(*) as n FROM posts WHERE status='active'").get().n;
    const users = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    res.json({ posts, users });
  } catch { res.json({ posts: 0, users: 0 }); }
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDB();
  try {
    db.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(req.params.id);
    const post = db.prepare(`
      SELECT p.*, u.name as author_name, u.country as author_country, u.bio as author_bio
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.id = ? AND p.status = 'active'
    `).get(req.params.id);
    if (!post) return res.status(404).json({ error: 'No encontrado' });
    res.json(post);
  } catch { res.status(500).json({ error: 'Error' }); }
});

// POST /api/posts
router.post('/', authMiddleware, upload.single('photo'), (req, res) => {
  const { category, title, body, video_url, lang, terms } = req.body;
  if (!category || !title || !body) return res.status(400).json({ error: 'Campos requeridos' });
  if (!VALID_CATS.includes(category)) return res.status(400).json({ error: 'Categoría inválida' });
  if (terms !== 'true' && terms !== true) return res.status(400).json({ error: 'Debes aceptar los términos' });
  if (title.length > 120) return res.status(400).json({ error: 'Título muy largo' });
  if (body.length > 3000) return res.status(400).json({ error: 'Contenido muy largo' });
  try {
    const db = getDB();
    const photo = req.file ? req.file.filename : '';
    const result = db.prepare(
      'INSERT INTO posts (user_id, category, title, body, video_url, photo, lang) VALUES (?,?,?,?,?,?,?)'
    ).run(req.user.id, category, title.trim(), body.trim(), video_url || '', photo, lang || 'es');
    res.json({ id: result.lastInsertRowid, message: 'Publicado correctamente' });
  } catch { res.status(500).json({ error: 'Error al publicar' }); }
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, (req, res) => {
  const db = getDB();
  try {
    db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?,?)').run(req.params.id, req.user.id);
    const likes = db.prepare('SELECT COUNT(*) as n FROM post_likes WHERE post_id = ?').get(req.params.id).n;
    db.prepare('UPDATE posts SET likes = ? WHERE id = ?').run(likes, req.params.id);
    res.json({ likes });
  } catch { res.status(500).json({ error: 'Error' }); }
});

module.exports = router;
