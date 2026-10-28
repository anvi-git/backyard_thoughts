import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxies (Google Cloud Run / Google Frontend)
app.set('trust proxy', 1);

// Middleware for CORS and iframe embedding
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.removeHeader('X-Frame-Options');
  next();
});

// Health check endpoints for Cloud Run
app.get(['/healthz', '/_health', '/ping'], (req, res) => {
  res.status(200).send('OK');
});

// Serve static files from root directory with .html extension resolution
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  maxAge: '0'
}));

// Fallback for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all fallback
app.use((req, res) => {
  const cleanPath = req.path.replace(/^\//, '');
  const filePath = path.join(__dirname, cleanPath);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(200).sendFile(path.join(__dirname, 'index.html'));
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backyard server running on http://0.0.0.0:${PORT}`);
});
