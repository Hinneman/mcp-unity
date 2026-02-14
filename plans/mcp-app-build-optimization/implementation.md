# MCP App Build Optimization

## Goal
Minify and gzip the Unity dashboard HTML during the build and serve it via MCP blob contents to cut payload size by ~75-83% without changing resource URIs.

## Prerequisites
Make sure that the use is currently on the `mcp-app-build-optimization` branch before beginning implementation.
If not, move them to the correct branch. If the branch does not exist, create it from main.

### Step-by-Step Instructions

#### Step 1: Add Build-Time Minification
- [ ] Add the minifier dev dependency.
- [ ] Copy and paste code below into `Server~/package.json`:

```json
{
  "name": "mcp-unity-server",
  "version": "1.0.0",
  "description": "MCP Unity Server for executing Unity operations and request Editor information",
  "main": "dist/index.js",
  "type": "module",
  "mcpName": "io.github.codergamester/mcp-unity",
  "bin": {
    "mcp-unity-server": "./build/index.js"
  },
  "files": [
    "build"
  ],
  "scripts": {
    "build": "tsc && node scripts/copy-ui.mjs",
    "start": "node build/index.js",
    "watch": "tsc --watch",
    "inspector": "npx @modelcontextprotocol/inspector build/index.js",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch"
  },
  "keywords": [
    "mcp",
    "unity",
    "unity3d",
    "game",
    "engine"
  ],
  "author": "CoderGamester",
  "license": "MIT",
  "devDependencies": {
    "@modelcontextprotocol/inspector": "^0.20.0",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.13.10",
    "@types/uuid": "^10.0.0",
    "@types/winreg": "^1.2.36",
    "@types/ws": "^8.18.0",
    "html-minifier-terser": "^7.2.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.8.2"
  },
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.0.0",
    "@modelcontextprotocol/sdk": "^1.7.0",
    "axios": "^1.8.4",
    "cors": "^2.8.5",
    "express": "^5.0.1",
    "uuid": "^11.1.0",
    "winreg": "^1.2.5",
    "ws": "^8.18.1",
    "zod": "^3.24.4",
    "zod-to-json-schema": "^3.24.3"
  }
}
```

- [ ] Add HTML minification to the UI copy script.
- [ ] Copy and paste code below into `Server~/scripts/copy-ui.mjs`:

- [x] Add the minifier dev dependency.

- [x] Copy and paste code below into `Server~/package.json`:

```javascript
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
```

##### Step 1 Verification Checklist
- [x] Run `npm install` in `Server~` if needed after adding the dev dependency.
- [x] Run `npm run build` in `Server~` and confirm `Server~/build/ui/unity-dashboard.html` is minified.
- [x] Check file size is roughly 40-47 KB (down from ~74-77 KB).


#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 2: Add Gzip Compression via Blob Field
- [x] Add gzip compression and blob return in the dashboard resource.
- [x] Copy and paste code below into `Server~/src/resources/unityDashboardAppResource.ts`:

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { Logger } from '../utils/logger.js';

const gzipAsync = promisify(gzip);

const resourceName = 'unity_dashboard_app';
const appResourceUri = 'ui://unity-dashboard';
const legacyResourceName = 'unity_dashboard_app_legacy';
const legacyResourceUri = 'unity://ui/dashboard';
const resourceMimeType = RESOURCE_MIME_TYPE;

export function registerUnityDashboardAppResource(server: McpServer, logger: Logger) {
  logger.info(`Registering resource: ${resourceName}`);

  registerAppResource(
    server,
    resourceName,
    appResourceUri,
    {
      description: 'Unity dashboard MCP App UI',
    },
    async () => {
      try {
        return await readDashboardHtml();
      } catch (error) {
        logger.error(`Error reading dashboard HTML: ${error}`);
        throw error;
      }
    }
  );

  // Legacy URI for compatibility with older hosts / docs that expect unity://ui/dashboard
  server.resource(
    legacyResourceName,
    legacyResourceUri,
    {
      description: 'Unity dashboard MCP App UI (legacy resource URI)',
      mimeType: resourceMimeType
    },
    async () => {
      try {
        return await readDashboardHtml(legacyResourceUri);
      } catch (error) {
        logger.error(`Error reading dashboard HTML (legacy uri): ${error}`);
        throw error;
      }
    }
  );
}

async function readDashboardHtml(uriOverride?: string): Promise<ReadResourceResult> {
  const { text } = readUnityDashboardHtml();
  const uri = uriOverride ?? appResourceUri;
  const compressed = await gzipAsync(Buffer.from(text, 'utf8'));
  const blob = compressed.toString('base64');

  return {
    contents: [
      {
        uri,
        mimeType: resourceMimeType,
        blob,
        _meta: {
          // For hosts that still look for legacy view hints.
          view: 'mcp-app',
          ui: {
            prefersBorder: true,
            // Some hosts (notably VS Code webviews) apply a strict CSP by default.
            // The dashboard UI is currently shipped as a single HTML file with inline
            // <style> and <script>, so request permission for inline resources.
            csp: {
              resourceDomains: ["'unsafe-inline'", "'unsafe-eval'"],
            },
          }
        }
      }
    ]
  };
}

export function readUnityDashboardHtml(): { text: string; mimeType: string } {
  const htmlPath = resolveDashboardPath();
  const text = fs.readFileSync(htmlPath, 'utf8');

  return { text, mimeType: resourceMimeType };
}

function resolveDashboardPath(): string {
  // IMPORTANT: do not use process.cwd() here.
  // VS Code runs MCP servers with the CWD of the *client workspace*, which may be
  // unrelated to the server's install location.
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));

  const candidates = [
    // Works when running TS directly (src/resources -> src/ui)
    // and when running built JS with copied assets (build/resources -> build/ui)
    path.join(moduleDir, '..', 'ui', 'unity-dashboard.html'),

    // Fallback for dev repos where build output exists but UI wasn't copied.
    path.join(moduleDir, '..', '..', 'src', 'ui', 'unity-dashboard.html'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unity dashboard UI file is missing. Checked: ${candidates.join(', ')}`
  );
}
```

##### Step 2 Verification Checklist
- [x] Run `npm run build` in `Server~`.
- [x] Use the MCP Inspector to call `show_unity_dashboard` and confirm the dashboard renders.
- [x] Resource returns minified HTML as text (not gzipped blob - VS Code doesn't decompress blobs correctly).
- [x] Minified HTML: 48.33 KB (35% reduction from ~74-77 KB).
- [x] Fix tool to return simple success message; MCP host fetches resource automatically.

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
