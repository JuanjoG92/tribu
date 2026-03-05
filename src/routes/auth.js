const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../models/db');
const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, country } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos requeridos' });
  if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
  try {
    const db = getDB();
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, country) VALUES (?,?,?,?)');
    const result = stmt.run(name, email.toLowerCase().trim(), hash, country || '');
    const user = { id: result.lastInsertRowid, name, email: email.toLowerCase().trim(), country: country || '' };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Campos requeridos' });
  try {
    const db = getDB();
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!u || !bcrypt.compareSync(password, u.password_hash))
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const user = { id: u.id, name: u.name, email: u.email, country: u.country };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
