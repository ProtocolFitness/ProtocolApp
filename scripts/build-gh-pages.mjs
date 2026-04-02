import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const repoName = path.basename(projectRoot);
const configuredBasePath = process.env.GH_PAGES_BASE_PATH?.trim();

const basePath = normalizeBasePath(configuredBasePath || `/${repoName}/`);

rewriteFile(path.join(distDir, 'index.html'), (content) =>
  content
    .replaceAll('href="/', `href="${basePath}`)
    .replaceAll('src="/', `src="${basePath}`)
);

for (const filePath of walkFiles(distDir)) {
  if (!filePath.endsWith('.js')) continue;

  rewriteFile(filePath, (content) =>
    content
      .replaceAll('"/_expo/', `"${basePath}_expo/`)
      .replaceAll('"/assets/', `"${basePath}assets/`)
      .replaceAll('"/favicon.ico"', `"${basePath}favicon.ico"`)
  );
}

fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));

console.log(`Prepared dist for GitHub Pages base path: ${basePath}`);

function normalizeBasePath(value) {
  let normalized = value.replace(/\\/g, '/').trim();

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

function rewriteFile(filePath, transform) {
  const current = fs.readFileSync(filePath, 'utf8');
  const next = transform(current);

  if (next !== current) {
    fs.writeFileSync(filePath, next, 'utf8');
  }
}

function walkFiles(rootDir) {
  const results = [];

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
      continue;
    }

    results.push(fullPath);
  }

  return results;
}
