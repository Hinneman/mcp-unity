# MCP App Build Optimization

**Branch:** `feat/mcp-app-build-optimization`
**Description:** Minify and compress dashboard HTML to reduce context window usage by ~75-83%

## Goal
Optimize the Unity dashboard MCP app build process to reduce file size from ~78KB to ~13-20KB through automated minification and gzip compression. This will dramatically reduce context window consumption when the app is loaded.

## Current State
- **Dashboard file**: `Server~/src/ui/unity-dashboard.html` (1,939 lines)
  - Inline CSS: ~10 KB
  - Inline JavaScript: ~62 KB
  - Total: ~74-77 KB
- **Build process**: Simple file copy with no optimization
- **Serving**: Entire HTML returned as text blob to MCP client

## Implementation Steps

### Step 1: Add Build-Time Minification
**Files:** 
- `Server~/package.json` (add devDependency)
- `Server~/scripts/copy-ui.mjs` (add minification)

**What:** Install `html-minifier-terser` and update the build script to automatically minify the dashboard HTML during the build process. This will:
- Collapse whitespace
- Minify inline CSS
- Minify inline JavaScript  
- Remove comments
- Reduce file size by ~35-45% (targeting ~40-47 KB final size)

**Testing:** 
1. Run `npm run build` and verify `build/ui/unity-dashboard.html` is minified
2. Check file size reduction (should be ~40-47 KB vs ~74-77 KB)
3. Test `show_unity_dashboard` tool in MCP Inspector
4. Verify dashboard renders correctly and all functionality works
5. Verify logs tab, hierarchy tab, and refresh buttons work

### Step 2: Add Gzip Compression via Blob Field
**Files:**
- `Server~/src/resources/unityDashboardAppResource.ts` (add compression logic)
- `Server~/package.json` (no new deps needed - using Node.js built-in zlib)

**What:** After minification, gzip compress the HTML and return it via MCP's `blob` field (base64-encoded). This provides:
- Additional ~60-75% reduction on top of minification
- Final size: ~13-20 KB (vs ~78 KB original, 75-83% total reduction)
- Uses MCP SDK native binary content support

**Technical Details:**
- MCP SDK supports `BlobResourceContents` with base64-encoded binary data
- Base64 adds 33% overhead, but gzip compression (70-90%) more than compensates
- Return format: `{ blob: base64(gzip(minifiedHtml)), mimeType: 'text/html' }`
- MCP clients automatically handle decoding

**Implementation:**
```typescript
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);

// In readUnityDashboardHtml or resource handler:
const htmlText = fs.readFileSync(htmlPath, 'utf8');
const compressed = await gzipAsync(Buffer.from(htmlText, 'utf8'));
const base64Compressed = compressed.toString('base64');

return {
  contents: [{
    uri: appResourceUri,
    mimeType: 'text/html',
    blob: base64Compressed
  }]
};
```

**Benefits:**
- ✅ Dramatic size reduction (~75-83% total)
- ✅ Natively supported by MCP protocol
- ✅ No client-side changes needed (MCP SDK handles it)
- ✅ Uses Node.js built-in modules (no new dependencies)

**Testing:**
1. Verify blob field is populated with base64 data
2. Test dashboard still renders correctly in MCP Inspector
3. Measure actual size reduction (should be ~13-20 KB)
4. Verify mimeType is set correctly
5. Test that decompression works automatically in MCP clients

## Additional Optimization Recommendations

### Future Enhancements (separate PRs):
1. **Dev/Prod Split**: Extract CSS/JS to separate files for development, inline during build for production
   - Better development experience (syntax highlighting, linting)
   - Same production output (single minified HTML)
   - Would require esbuild or rollup bundler

2. **Source Maps**: Generate source maps for debugging minified code
   - Helpful for troubleshooting production issues
   - Minimal size overhead if compressed

3. **Lazy Loading**: Split large features into lazy-loaded modules
   - Limited benefit for single-page app
   - Only worth it if dashboard grows significantly

## Success Criteria

**Step 1 (Minification):**
- ✅ Dashboard HTML reduced from ~78 KB to ~47-50 KB (~40% reduction)
- ✅ Build process automated (no manual minification)
- ✅ All dashboard functionality preserved
- ✅ No breaking changes to API or resource URIs

**Step 2 (Optional Compression):**
- ✅ Dashboard further reduced to ~13-20 KB (~75-83% total reduction)
- ✅ Uses MCP SDK native blob field support
- ✅ All functionality preserved with blob-based delivery

## Risks & Mitigation
- **Risk**: Minification breaks inline JavaScript
  - **Mitigation**: Test thoroughly; html-minifier-terser uses terser which is battle-tested
  
- **Risk**: Debugging becomes harder with minified code
  - **Mitigation**: Keep source files unminified; only minify in build output

- **Risk**: Gzip compression via blob field not supported by all MCP clients
  - **Mitigation**: MCP SDK natively supports `BlobResourceContents` - this is a standard feature
  - **Fallback**: Can revert to text-only minification if issues arise

## Notes
- This optimization is non-breaking and fully backward compatible
- The dashboard is the only UI file in the codebase, so this is a focused change
- Current CSP allows `'unsafe-inline'`, so minification won't cause CSP issues
- **Compression Research**: MCP SDK supports binary content via `blob` field with base64 encoding
  - Gzip achieves ~80% compression on HTML
  - Base64 adds 33% overhead
  - Net result: ~75-83% total size reduction (78 KB → 13-20 KB)
  - Implementation uses Node.js built-in `zlib` module (no new dependencies)
