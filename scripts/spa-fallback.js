// Static hosts like GitHub Pages serve 404.html for unknown paths.
// Copying the app shell there lets deep links such as /sessions?date=...
// load the SPA, which then routes on the client.
import { copyFileSync, existsSync } from 'node:fs';

if (existsSync('dist/index.html')) {
  copyFileSync('dist/index.html', 'dist/404.html');
  console.log('SPA fallback: dist/404.html written');
}
