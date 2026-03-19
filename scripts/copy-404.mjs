import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const indexHtml = join(distDir, 'index.html');
const notFoundHtml = join(distDir, '404.html');

async function main() {
  try {
    await mkdir(distDir, { recursive: true });
    await cp(indexHtml, notFoundHtml);
    // eslint-disable-next-line no-console
    console.log('Created dist/404.html from dist/index.html for GitHub Pages SPA fallback.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create dist/404.html:', err);
    process.exitCode = 1;
  }
}

void main();

