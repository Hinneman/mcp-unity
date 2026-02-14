import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..');

const srcHtml = path.join(serverRoot, 'src', 'ui', 'unity-dashboard.html');
const outDir = path.join(serverRoot, 'build', 'ui');
const outHtml = path.join(outDir, 'unity-dashboard.html');

async function main() {
  if (!fs.existsSync(srcHtml)) {
    console.error(`UI source file not found: ${srcHtml}`);
    process.exit(1);
  }

  const html = fs.readFileSync(srcHtml, 'utf8');
  const minified = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outHtml, minified, 'utf8');

  console.log(`Minified UI: ${srcHtml} -> ${outHtml}`);
}

main().catch((error) => {
  console.error(`Failed to minify UI: ${error}`);
  process.exit(1);
});
 
