import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const uploadDir = resolve(root, '正式版_請上傳這個資料夾');
const indexPath = resolve(distDir, 'index.html');

let html = readFileSync(indexPath, 'utf8');

html = html.replace(
  /<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/,
  (_, href) => {
    const css = readFileSync(resolve(distDir, href), 'utf8');
    return `<style>${css}</style>`;
  }
);

html = html.replace(
  /<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/,
  (_, src) => {
    const js = readFileSync(resolve(distDir, src), 'utf8');
    return `<script type="module">${js}</script>`;
  }
);

writeFileSync(indexPath, html, 'utf8');

rmSync(uploadDir, { recursive: true, force: true });
mkdirSync(uploadDir, { recursive: true });
copyFileSync(indexPath, resolve(uploadDir, 'index.html'));

for (const fileName of readdirSync(distDir)) {
  if (/\.(jpe?g|png|webp|gif|svg)$/i.test(fileName)) {
    copyFileSync(resolve(distDir, fileName), resolve(uploadDir, fileName));
  }
}
