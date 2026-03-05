const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const router = express.Router();

router.post('/github', (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('Not configured');
  const sig = req.headers['x-hub-signature-256'] || '';
  const hmac = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(JSON.stringify(req.body)).digest('hex');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(hmac)))
      return res.status(401).send('Invalid signature');
  } catch { return res.status(401).send('Invalid'); }

  // Responder ANTES de reiniciar para evitar 502
  res.send('Deploying...');

  setTimeout(() => {
    exec(
      'cd /var/www/tribu && git pull origin main && npm install --production && pm2 restart tribu',
      { timeout: 90000 },
      (err) => { if (err) console.error('Deploy error:', err.message); }
    );
  }, 500);
});

module.exports = router;
