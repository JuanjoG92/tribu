require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const fs = require('fs');
const { initDB } = require('./src/models/db');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/posts',   require('./src/routes/posts'));
app.use('/api/webhook', require('./src/routes/webhook'));

const PAGES = ['login', 'register', 'dashboard', 'post', 'new-post', 'community'];
PAGES.forEach(p => {
  app.get('/' + p, (req, res) =>
    res.sendFile(path.join(__dirname, 'public', p + '.html'))
  );
});

const PORT = process.env.PORT || 3803;
initDB();
app.listen(PORT, () => console.log('Tribu running on port ' + PORT));
