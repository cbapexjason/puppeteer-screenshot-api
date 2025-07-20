const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const API_SECRET = process.env.API_SECRET || 'super-secret-api-key';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' })); // accept HTML/CSS

app.post('/screenshot', authenticateRequest, async (req, res) => {

  const { html, viewport } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing HTML' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new', // could try true if still failing
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    if (viewport) {
      await page.setViewport(viewport);
    }

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const screenshot = await page.screenshot({ type: 'png' });

    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (err) {
    if (browser) await browser.close();
    console.error('❌ Error generating screenshot:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err.message,
      stack: err.stack
    });
  }
});

app.get('/', (req, res) => {
  res.send('Puppeteer Screenshot API is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function authenticateRequest(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing bearer token' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== API_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid API token' });
  }

  next();
}