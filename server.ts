import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production' && (fs.existsSync('dist/routes-manifest.json') || fs.existsSync('.next/routes-manifest.json'));
const dev = !isProduction;
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
});
