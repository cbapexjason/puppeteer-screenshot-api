const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '2mb' })); // accept HTML/CSS

app.post('/screenshot', async (req, res) => {
  const { html, viewport } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'Missing HTML payload' });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    if (viewport) {
      await page.setViewport(viewport);
    }

    const screenshotBuffer = await page.screenshot({ type: 'png' });

    await browser.close();

    res.set('Content-Type', 'image/png');
    res.send(screenshotBuffer);
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Puppeteer Screenshot API is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});