const express = require('express');
const crypto = require('crypto');
const { execSync } = require('child_process');
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
  try {
    execSync('cd /var/www/tribu && git pull origin main', { timeout: 30000 });
    execSync('cd /var/www/tribu && npm install --production', { timeout: 60000 });
    execSync('pm2 restart tribu', { timeout: 10000 });
    res.send('Deployed OK');
  } catch (e) {
    res.status(500).send('Deploy failed: ' + e.message);
  }
});

module.exports = router;
