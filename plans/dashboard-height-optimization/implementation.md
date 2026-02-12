# Dashboard Height Optimization

## Goal
Optimize the Unity dashboard layout and styling so it fits constrained MCP app heights, adds collapsible Unity-style panels, and refines the visual design to match Unity Editor aesthetics.

## Prerequisites
Make sure that the use is currently on the `dashboard-height-optimization` branch before beginning implementation. If not, move them to the correct branch. If the branch does not exist, create it from main.

### Step-by-Step Instructions

#### Step 1: Compact Layout (Option A)
- [x] Replace the entire `<style>` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<style>
  :root{--bg:#0b1220;--card:#07101a;--muted:#9fb1c9;--accent:#4fd1c5}
  html,body{height:100%;margin:0}
  body{font-family:Inter,Segoe UI,Roboto,system-ui,Arial;background:linear-gradient(180deg,#071021 0%,#071627 100%);color:#e6eef8;padding:8px}
  .app{max-width:1100px;margin:0 auto}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  h1{font-size:18px;margin:0}
  .controls{display:flex;gap:8px}
  button{background:transparent;border:1px solid #163144;color:var(--muted);padding:6px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;transition:all 0.15s ease}
  button:active:not(:disabled){transform:scale(0.95);background:rgba(79,209,197,0.1)}
  button:disabled{opacity:0.3;cursor:not-allowed;border-color:#0a1420}
  button svg{width:16px;height:16px;fill:currentColor}
  button.primary{background:var(--accent);color:#022; border-color:transparent}
  button.primary:active:not(:disabled){background:rgba(79,209,197,0.85)}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .card{background:var(--card);border:1px solid #122432;padding:8px;border-radius:8px}
  .section-title{font-size:13px;color:var(--muted);margin-bottom:4px}
  .section-title-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
  #hierarchy{max-height:300px;overflow:auto;font-size:13px}
  .node{padding:6px 8px;border-radius:4px;color:#cfe6f8}
  .node:hover{background:#0f2940}
  .node.selected{background:#1b3b5a;color:#fff}
  .node.focused{outline:1px solid #ffd580;background:#14283e}
  .node.scene{color:#9fc5ff;font-weight:600}
  .logs{max-height:300px;overflow:auto;font-family:monospace;font-size:12px}
  .log.info{color:#9fc5ff}
  .log.warn{color:#ffd580}
  .log.error{color:#ff9b9b}
  .meta{font-size:12px;color:var(--muted)}
  .toolbar{display:flex;gap:6px;align-items:center}
  label{font-size:12px;color:var(--muted)}
  input[type=range]{width:120px}
  .status-row{display:flex;align-items:center;gap:8px;margin-top:6px}
  .status-badge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid #214256;color:#cfe6f8;text-transform:uppercase;letter-spacing:0.04em}
  .status-badge.playing{background:#0f3b2e;border-color:#1f8b6f;color:#a7f3d0}
  .status-badge.edit{background:#1a2232;border-color:#2a3b55;color:#cbd5e1}
  .status-badge.compiling{background:#2a1f10;border-color:#a16207;color:#fde68a}
  .status-badge.failed{background:#3b1313;border-color:#b91c1c;color:#fecaca}
  .status-badge.success{background:#0f2b1c;border-color:#22c55e;color:#bbf7d0}
  .spinner{width:10px;height:10px;border:2px solid #a16207;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .logs-panel{position:fixed;bottom:0;left:0;right:0;background:#0a1420;border-top:2px solid #1a3a5a;max-height:300px;overflow:auto;font-family:monospace;font-size:11px;z-index:9998;display:none}
  .logs-panel.visible{display:block}
  .logs-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0f1c2e;border-bottom:1px solid #1a3a5a}
  .logs-title{color:#4fd1c5;font-weight:600;font-size:12px}
  .logs-content{padding:6px 10px}
  .debug-panel{position:fixed;bottom:0;left:0;right:0;background:#0a1420;border-top:2px solid #1a3a5a;max-height:260px;overflow:auto;font-family:monospace;font-size:11px;z-index:9999;display:none}
  .debug-panel.visible{display:block}
  .debug-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0f1c2e;border-bottom:1px solid #1a3a5a}
  .debug-title{color:#4fd1c5;font-weight:600;font-size:12px}
  .debug-content{padding:6px 10px}
  .debug-log{padding:4px 0;color:#9fc5ff;border-bottom:1px solid #0f1c2e}
  .debug-log.error{color:#ff9b9b}
  .debug-log.success{color:#a7f3d0}
  .panel-toggle{position:fixed;bottom:10px;right:10px;background:#1a3a5a;border:1px solid #2a4a6a;color:#4fd1c5;padding:6px;border-radius:6px;cursor:pointer;z-index:10000;font-size:11px;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
  .panel-toggle svg{width:18px;height:18px;fill:currentColor}
  .panel-toggle.logs{right:54px}
  .node.flagged{outline:1px solid #ffd580;background:#14283e}
  .node-row{display:flex;align-items:center;gap:6px}
  .focus-btn{background:#0c1b2a;border:1px solid #1f3750;color:#5f6f84;padding:2px 6px;border-radius:6px;font-size:12px;min-width:20px;height:20px;line-height:1}
  .focus-btn:hover{border-color:#4fd1c5;color:#e6eef8}
  .focus-btn.focused{color:#ffd580;border-color:#5f4b1c;background:rgba(255,213,128,0.12)}
  .hierarchy-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
  #inspector{max-height:300px;overflow:auto;font-size:12px}
  .inspector-empty{color:var(--muted);font-size:12px;padding:6px 0}
  .component{border:1px solid #142a3d;background:#0b1726;padding:8px;border-radius:6px;margin:6px 0}
  .component-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
  .component-title{font-size:12px;color:#cfe6f8}
  .component-meta{font-size:11px;color:var(--muted)}
  .component-props{background:#0a1420;border:1px solid #122432;border-radius:6px;padding:8px;white-space:pre-wrap;font-family:monospace;font-size:11px;color:#9fc5ff;margin:0}
  .analysis-note{margin-top:6px;padding:6px;background:#0f2234;border:1px dashed #27425c;border-radius:6px;font-size:11px;color:#a7f3d0}
  .analyze-btn{background:#0c1b2a;border:1px solid #1f3750;color:#9fb1c9;padding:4px 8px;border-radius:6px;font-size:11px;height:24px}
  .analyze-btn:hover{border-color:#4fd1c5;color:#e6eef8}
  .log-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .log-actions{display:flex;align-items:center;gap:6px}
  .log-action-btn{background:#0c1b2a;border:1px solid #1f3750;color:#9fb1c9;padding:2px 6px;border-radius:6px;font-size:10px;height:22px}
  .log-action-btn:hover{border-color:#4fd1c5;color:#e6eef8}
</style>
```

- [x] Replace the entire `<div class="grid">` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<div class="grid">
  <div>
    <div class="card">
      <div class="section-title section-title-row">
        <span>Hierarchy</span>
        <span id="sceneInfo" class="meta">Loading scene info...</span>
      </div>
      <div class="hierarchy-toolbar">
        <label class="meta"><input id="focusFilter" type="checkbox" /> Show only focused</label>
        <span id="focusCount" class="meta"></span>
      </div>
      <div id="hierarchy">Loading hierarchy...</div>
    </div>
  </div>

  <div>
    <div class="card">
      <div class="section-title">Inspector</div>
      <div id="inspector" class="meta">Select a focused GameObject to inspect.</div>
    </div>
  </div>
</div>
```

##### Step 1 Verification Checklist
- [ ] Open the dashboard with `show_unity_dashboard` and confirm the body does not scroll.
- [ ] Confirm hierarchy and inspector panels scroll internally at 300px max height.
- [ ] Verify scene info now appears inline in the hierarchy header.
- [ ] Ensure all controls remain clickable at the tighter spacing.

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 2: Unity-Style Collapsible Sections (Option B)
- [ ] Replace the entire `<style>` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<style>
  :root{
    --unity-bg:#383838;
    --unity-card:#2a2a2a;
    --unity-card-alt:#222222;
    --unity-input:#191919;
    --unity-border:#1e1e1e;
    --unity-text:#d2d2d2;
    --unity-text-muted:#9b9b9b;
    --unity-hover:#2c2c2c;
    --unity-selected:#2c5d87;
    --unity-focus:#5A9FFF;
    --unity-accent:#6aa8ff;
    --transition-fast:150ms;
  }
  html,body{height:100%;margin:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:linear-gradient(180deg,#383838 0%,#323232 100%);color:var(--unity-text);padding:8px}
  .app{max-width:1100px;margin:0 auto}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  h1{font-size:13px;margin:0;color:var(--unity-text)}
  .controls{display:flex;gap:8px}
  button{background:var(--unity-card-alt);border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;transition:all var(--transition-fast) ease}
  button:active:not(:disabled){transform:scale(0.97);background:#1c1c1c}
  button:disabled{opacity:0.4;cursor:not-allowed;border-color:#0d0d0d}
  button svg{width:14px;height:14px;fill:currentColor}
  button.primary{background:var(--unity-selected);color:#e8f1ff;border-color:#1c4c73}
  button.primary:active:not(:disabled){background:#274f73}
  button:focus-visible{outline:2px solid var(--unity-focus);outline-offset:1px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .card{background:var(--unity-card);border:1px solid var(--unity-border);padding:8px;border-radius:6px}
  .panel-header{display:flex;align-items:center;gap:6px;height:24px}
  .panel-header[role="button"]{outline:none}
  .panel-title{font-size:13px;color:var(--unity-text);margin:0}
  .panel-meta{font-size:11px;color:var(--unity-text-muted)}
  .panel-spacer{flex:1}
  .collapse-toggle{background:transparent;border:none;color:var(--unity-text);width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:3px}
  .collapse-toggle svg{width:12px;height:12px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .collapse-toggle.collapsed svg{transform:rotate(-90deg)}
  .panel-collapsed .section-content{max-height:0;opacity:0;overflow:hidden;padding:0;margin:0}
  .section-content{max-height:600px;opacity:1;overflow:hidden;transition:max-height var(--transition-fast) ease,opacity var(--transition-fast) ease}
  .section-title{font-size:12px;color:var(--unity-text-muted);margin:0}
  .toolbar{display:flex;gap:6px;align-items:center}
  label{font-size:11px;color:var(--unity-text-muted)}
  input[type=range]{width:120px}
  input[type=checkbox]{accent-color:var(--unity-selected)}
  .meta{font-size:11px;color:var(--unity-text-muted)}

  #hierarchy{max-height:300px;overflow:auto;font-size:11px}
  .node{color:var(--unity-text)}
  .node-row{display:flex;align-items:center;gap:6px;height:22px;border-radius:3px;padding-right:6px}
  .node-row:hover{background:var(--unity-hover)}
  .node.selected .node-row{background:var(--unity-selected);color:#fff}
  .node.focused .node-row{outline:1px solid #ffd580;background:#2f2f2f}
  .node.scene{font-weight:600;color:#c9dcff}
  .hierarchy-toolbar{display:flex;align-items:center;justify-content:space-between;margin:4px 0 6px 0}
  .hierarchy-toggle{background:transparent;border:none;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:var(--unity-text);padding:0}
  .hierarchy-toggle svg{width:10px;height:10px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .hierarchy-toggle.collapsed svg{transform:rotate(-90deg)}
  .hierarchy-toggle.hidden{visibility:hidden}
  .gameobject-icon{width:12px;height:12px;display:inline-flex;align-items:center;justify-content:center;color:#bcbcbc}
  .gameobject-icon svg{width:12px;height:12px;fill:currentColor}
  .node-label{font-size:11px}
  .focus-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:#9b9b9b;padding:0 4px;border-radius:4px;font-size:10px;min-width:20px;height:20px;line-height:1}
  .focus-btn:hover{border-color:var(--unity-accent);color:#e6eef8}
  .focus-btn.focused{color:#ffd580;border-color:#5f4b1c;background:rgba(255,213,128,0.12)}

  #inspector{max-height:300px;overflow:auto;font-size:12px}
  .inspector-header{font-size:12px;color:var(--unity-text);margin-bottom:6px}
  .inspector-empty{color:var(--unity-text-muted);font-size:12px;padding:6px 0}
  .unity-component{border:1px solid var(--unity-border);background:var(--unity-card-alt);border-radius:4px;margin:6px 0;overflow:hidden}
  .unity-component-header{display:flex;align-items:center;gap:6px;height:24px;padding:0 6px;background:#2e2e2e}
  .unity-component-header:hover{background:var(--unity-hover)}
  .component-triangle{background:transparent;border:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;color:var(--unity-text);padding:0}
  .component-triangle svg{width:12px;height:12px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .component-triangle.collapsed svg{transform:rotate(-90deg)}
  .component-enabled{width:14px;height:14px}
  .component-icon{width:14px;height:14px;color:#bcbcbc;display:inline-flex;align-items:center;justify-content:center}
  .component-icon svg{width:12px;height:12px;fill:currentColor}
  .component-title{font-size:12px;color:var(--unity-text)}
  .header-spacer{flex:1}
  .component-gear{background:transparent;border:none;color:var(--unity-text-muted);opacity:0;transition:opacity var(--transition-fast) ease;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
  .unity-component-header:hover .component-gear{opacity:1}
  .unity-component-content{padding:6px;background:var(--unity-card)}
  .unity-component.collapsed .unity-component-content{max-height:0;opacity:0;overflow:hidden;padding:0}
  .component-grid{display:grid;grid-template-columns:40% 60%;gap:4px 8px;font-size:11px}
  .component-label{text-align:right;color:var(--unity-text-muted)}
  .component-value{background:var(--unity-input);border:1px solid #0d0d0d;border-radius:2px;padding:2px 4px;color:var(--unity-text);font-family:Consolas,Menlo,monospace;font-size:11px;white-space:pre-wrap}
  .analysis-note{margin-top:6px;padding:6px;background:#222;border:1px dashed #3a3a3a;border-radius:4px;font-size:11px;color:#a7f3d0}
  .analyze-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;font-size:11px;height:22px}
  .analyze-btn:hover{border-color:var(--unity-accent)}

  .logs{max-height:260px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px}
  .log.info{color:#9fc5ff}
  .log.warn{color:#ffd580}
  .log.error{color:#ff9b9b}
  .log-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .log-actions{display:flex;align-items:center;gap:6px}
  .log-action-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;font-size:10px;height:20px}
  .log-action-btn:hover{border-color:var(--unity-accent)}

  .status-row{display:flex;align-items:center;gap:6px;margin-top:6px}
  .status-badge{font-size:10px;padding:2px 6px;border-radius:999px;border:1px solid #2a2a2a;color:var(--unity-text-muted);text-transform:uppercase;letter-spacing:0.04em}
  .status-badge.playing{background:#1e3b2e;border-color:#1f8b6f;color:#a7f3d0}
  .status-badge.edit{background:#2a2a2a;border-color:#3a3a3a;color:#cbd5e1}
  .status-badge.compiling{background:#2a1f10;border-color:#a16207;color:#fde68a}
  .status-badge.failed{background:#3b1313;border-color:#b91c1c;color:#fecaca}
  .status-badge.success{background:#0f2b1c;border-color:#22c55e;color:#bbf7d0}
  .spinner{width:10px;height:10px;border:2px solid #a16207;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  .logs-panel{position:fixed;bottom:0;left:0;right:0;background:var(--unity-card);border-top:1px solid var(--unity-border);max-height:280px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px;z-index:9998;display:none}
  .logs-panel.visible{display:block}
  .logs-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--unity-card-alt);border-bottom:1px solid var(--unity-border)}
  .logs-title{color:var(--unity-text);font-weight:600;font-size:12px}
  .logs-content{padding:6px 10px}
  .debug-panel{position:fixed;bottom:0;left:0;right:0;background:var(--unity-card);border-top:1px solid var(--unity-border);max-height:240px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px;z-index:9999;display:none}
  .debug-panel.visible{display:block}
  .debug-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--unity-card-alt);border-bottom:1px solid var(--unity-border)}
  .debug-title{color:var(--unity-text);font-weight:600;font-size:12px}
  .debug-content{padding:6px 10px}
  .debug-log{padding:4px 0;color:#9fc5ff;border-bottom:1px solid #2a2a2a}
  .debug-log.error{color:#ff9b9b}
  .debug-log.success{color:#a7f3d0}
  .panel-toggle{position:fixed;bottom:10px;right:10px;background:var(--unity-card-alt);border:1px solid var(--unity-border);color:var(--unity-text);padding:6px;border-radius:6px;cursor:pointer;z-index:10000;font-size:11px;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
  .panel-toggle svg{width:18px;height:18px;fill:currentColor}
  .panel-toggle.logs{right:54px}
</style>
```

- [ ] Replace the entire `<div class="grid">` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<div class="grid">
  <div>
    <div class="card" id="hierarchyPanel" data-section="hierarchy">
      <div class="panel-header" id="hierarchyHeader" role="button" aria-expanded="true" tabindex="0">
        <button class="collapse-toggle" data-section="hierarchy" aria-controls="hierarchySection" aria-expanded="true" title="Collapse">
          <svg viewBox="0 0 10 10"><path d="M2 2 L8 5 L2 8 Z"/></svg>
        </button>
        <span class="panel-title">Hierarchy</span>
        <span id="sceneInfo" class="panel-meta">Loading scene info...</span>
        <span class="panel-spacer"></span>
        <button class="component-gear" title="Options" disabled>
          <svg viewBox="0 0 16 16"><path d="M9.6 1l.4 1.6a5.6 5.6 0 0 1 1.3.8l1.5-.6 1 1.8-1.3 1a5.2 5.2 0 0 1 0 1.6l1.3 1-1 1.8-1.5-.6a5.6 5.6 0 0 1-1.3.8L9.6 15H7.4l-.4-1.6a5.6 5.6 0 0 1-1.3-.8l-1.5.6-1-1.8 1.3-1a5.2 5.2 0 0 1 0-1.6l-1.3-1 1-1.8 1.5.6a5.6 5.6 0 0 1 1.3-.8L7.4 1h2.2zM8.5 6.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/></svg>
        </button>
      </div>
      <div class="section-content" id="hierarchySection">
        <div class="hierarchy-toolbar">
          <label class="meta"><input id="focusFilter" type="checkbox" /> Show only focused</label>
          <span id="focusCount" class="meta"></span>
        </div>
        <div id="hierarchy">Loading hierarchy...</div>
      </div>
    </div>
  </div>

  <div>
    <div class="card" id="inspectorPanel" data-section="inspector">
      <div class="panel-header" id="inspectorHeader" role="button" aria-expanded="true" tabindex="0">
        <button class="collapse-toggle" data-section="inspector" aria-controls="inspectorSection" aria-expanded="true" title="Collapse">
          <svg viewBox="0 0 10 10"><path d="M2 2 L8 5 L2 8 Z"/></svg>
        </button>
        <span class="panel-title">Inspector</span>
        <span class="panel-spacer"></span>
        <button class="component-gear" title="Options" disabled>
          <svg viewBox="0 0 16 16"><path d="M9.6 1l.4 1.6a5.6 5.6 0 0 1 1.3.8l1.5-.6 1 1.8-1.3 1a5.2 5.2 0 0 1 0 1.6l1.3 1-1 1.8-1.5-.6a5.6 5.6 0 0 1-1.3.8L9.6 15H7.4l-.4-1.6a5.6 5.6 0 0 1-1.3-.8l-1.5.6-1-1.8 1.3-1a5.2 5.2 0 0 1 0-1.6l-1.3-1 1-1.8 1.5.6a5.6 5.6 0 0 1 1.3-.8L7.4 1h2.2zM8.5 6.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/></svg>
        </button>
      </div>
      <div class="section-content" id="inspectorSection">
        <div id="inspector" class="meta">Select a focused GameObject to inspect.</div>
      </div>
    </div>
  </div>
</div>
```

- [ ] Replace the entire `<script>` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<script>
  const PROTOCOL_VERSION = '2026-01-26';
  const DEFAULT_TIMEOUT_MS = 15000;
  const TOOL_TIMEOUT_MS = 7000;
  let nextRequestId = 1;
  const pendingRequests = new Map();

  let hostReady = false;
  let resolveHostReady = null;
  const hostReadyPromise = new Promise((resolve) => {
    resolveHostReady = resolve;
  });
  let hostContext = null; // { displayMode, availableDisplayModes, ... }

  const STORAGE_KEYS = {
    hierarchyCollapsed: 'unity-dashboard-hierarchy-collapsed',
    inspectorCollapsed: 'unity-dashboard-inspector-collapsed',
    hierarchyExpandedNodes: 'unity-dashboard-hierarchy-expanded-nodes'
  };

  const debugLogs = [];
  const maxDebugLogs = 100;

  function debugLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const log = { timestamp, message, type };
    debugLogs.push(log);
    if (debugLogs.length > maxDebugLogs) debugLogs.shift();
    updateDebugPanel();

    // Also log to console if available
    if (type === 'error') console.error(message);
    else console.log(message);
  }

  function updateDebugPanel() {
    const debugContent = document.getElementById('debugContent');
    if (!debugContent) return;

    const html = debugLogs.slice().reverse().map(log =>
      `<div class="debug-log ${log.type}">[${log.timestamp}] ${log.message}</div>`
    ).join('');

    debugContent.innerHTML = html || '<div class="debug-log">No logs yet. Click Fullscreen or PiP to test.</div>';
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [value];
  }

  function readBool(key, fallback = false) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return raw === 'true';
    } catch {
      return fallback;
    }
  }

  function writeBool(key, value) {
    try {
      localStorage.setItem(key, value ? 'true' : 'false');
    } catch {
      // ignore
    }
  }

  function readJsonArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeJsonArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  function sendRpcMessage(message) {
    // MCP Apps use JSON-RPC over postMessage between the iframe and host.
    try {
      window.parent.postMessage(message, '*');
    } catch {
      // ignore
    }

    // Some hosts nest the iframe; top-level may be the host bridge.
    try {
      if (window.top && window.top !== window.parent) {
        window.top.postMessage(message, '*');
      }
    } catch {
      // ignore
    }
  }

  function rpcNotify(method, params) {
    sendRpcMessage({ jsonrpc: '2.0', method, params });
  }

  function rpcRequest(method, params, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const id = String(nextRequestId++);
    const message = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`RPC timeout calling ${method}`));
      }, timeoutMs);

      pendingRequests.set(id, { resolve, reject, timeout, method });
      sendRpcMessage(message);
    });
  }

  window.addEventListener('message', (event) => {
    const messages = toArray(event.data);
    for (const msg of messages) {
      if (!msg || msg.jsonrpc !== '2.0') continue;

      // Track host readiness notifications (non-blocking).
      if (typeof msg.method === 'string') {
        if (msg.method === 'ui/notifications/host-context-changed') {
          // Host context usually arrives here
          debugLog('Received host-context-changed: ' + JSON.stringify(msg.params));
          hostContext = (msg.params && (msg.params.hostContext || msg.params)) || hostContext;
          debugLog('Updated hostContext: ' + JSON.stringify(hostContext));
          if (!hostReady) {
            hostReady = true;
            if (resolveHostReady) resolveHostReady(true);
          }
          setDisplayButtonsState();
        }

        if (msg.method === 'ui/notifications/sandbox-proxy-ready') {
          if (!hostReady) {
            hostReady = true;
            if (resolveHostReady) resolveHostReady(true);
          }
        }

        // Notifications are not RPC responses
        continue;
      }

      // Only responses can satisfy pending requests.
      if (msg.id === undefined || msg.id === null) continue;

      const id = String(msg.id);
      const pending = pendingRequests.get(id);
      if (!pending) continue;

      clearTimeout(pending.timeout);
      pendingRequests.delete(id);

      if (msg.error) {
        const messageText = typeof msg.error.message === 'string' ? msg.error.message : 'Unknown RPC error';
        pending.reject(new Error(messageText));
      } else {
        pending.resolve(msg.result);
      }
    }
  });

  const state = {
    appReady: false,
    activeGameObject: null,
    currentPlayMode: null,
    recentErrors: [],
    lastSceneNames: [],
    lastCompilationState: 'idle',
    lastInspectorFocus: null,
    lastPlayModeState: null,
    lastErrorCount: 0,
    lastSceneInfo: null,
    lastHierarchy: null,
    lastLogs: null,
    lastPlayMode: null,
    focusedObjects: new Set(),
    focusFilterEnabled: false,
    focusedDetails: new Map(),
    focusRefreshInFlight: false,
    lastFocusIdsKey: '',
    lastFocusSignature: '',
    hierarchyIndex: new Map(),
    componentAnalyses: new Map(),
    logSignatures: new Set(),
    lastLogCount: 0,
    panelState: {
      hierarchyCollapsed: false,
      inspectorCollapsed: false
    },
    hierarchyExpandedNodes: new Set(),
    hierarchyExpandedInitialized: false
  };

  async function updateAgentContext(description, metadata) {
    try {
      // Prefer the stable spec method name.
      await rpcRequest('ui/update-model-context', {
        content: [{ type: 'text', text: description }],
        structuredContent: metadata || {}
      });
    } catch (error) {
      try {
        // Back-compat with earlier experimental implementations.
        await rpcRequest('ui/updateModelContext', {
          description,
          ...(metadata || {})
        });
      } catch {
        // Ignore context update failures to keep UI responsive.
      }
    }
  }

  async function initializeApp() {
    sceneInfo.textContent = 'Initializing...';
    hierarchy.textContent = 'Initializing...';
    logsContent.innerHTML = '<div class="log info">Initializing...</div>';

    // Give the host/proxy a brief moment to attach its listeners.
    try {
      await Promise.race([
        hostReadyPromise,
        new Promise((resolve) => setTimeout(resolve, 50)),
      ]);
    } catch {
      // ignore
    }

    await rpcRequest('ui/initialize', {
      appInfo: { name: 'unity-dashboard', version: '1.0.0' },
      appCapabilities: { tools: {} },
      protocolVersion: PROTOCOL_VERSION
    });

    rpcNotify('ui/notifications/initialized');
    state.appReady = true;
    debugLog('App initialized. Host context: ' + JSON.stringify(hostContext));

    setDisplayButtonsState();
  }

  async function callTool(name, args = {}) {
    return rpcRequest('tools/call', { name, arguments: args }, TOOL_TIMEOUT_MS);
  }

  async function readResourceJson(uri) {
    const result = await rpcRequest('resources/read', { uri }, TOOL_TIMEOUT_MS);
    const text = result && result.contents && result.contents[0] ? result.contents[0].text : '';
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  }

  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const stopIcon = document.getElementById('stopIcon');
  const pauseBtn = document.getElementById('pauseBtn');
  const stepBtn = document.getElementById('stepBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const syncBtn = document.getElementById('syncBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const pipBtn = document.getElementById('pipBtn');
  const autoRefresh = document.getElementById('autoRefresh');
  const interval = document.getElementById('interval');
  const intervalLabel = document.getElementById('intervalLabel');
  const sceneInfo = document.getElementById('sceneInfo');
  const hierarchy = document.getElementById('hierarchy');
  const focusFilter = document.getElementById('focusFilter');
  const focusCount = document.getElementById('focusCount');
  const inspector = document.getElementById('inspector');
  const hierarchyPanel = document.getElementById('hierarchyPanel');
  const inspectorPanel = document.getElementById('inspectorPanel');
  const hierarchyHeader = document.getElementById('hierarchyHeader');
  const inspectorHeader = document.getElementById('inspectorHeader');
  const hierarchySection = document.getElementById('hierarchySection');
  const inspectorSection = document.getElementById('inspectorSection');
  const logsToggle = document.getElementById('logsToggle');
  const logsPanel = document.getElementById('logsPanel');
  const logsContent = document.getElementById('logsContent');
  const logsClose = document.getElementById('logsClose');
  const debugToggle = document.getElementById('debugToggle');
  const debugPanel = document.getElementById('debugPanel');
  const debugClose = document.getElementById('debugClose');

  function applyPanelState(section, collapsed) {
    const panel = section === 'hierarchy' ? hierarchyPanel : inspectorPanel;
    const header = section === 'hierarchy' ? hierarchyHeader : inspectorHeader;
    const toggle = document.querySelector(`.collapse-toggle[data-section="${section}"]`);
    if (!panel || !header || !toggle) return;

    panel.classList.toggle('panel-collapsed', collapsed);
    header.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.classList.toggle('collapsed', collapsed);

    if (section === 'hierarchy') {
      state.panelState.hierarchyCollapsed = collapsed;
      writeBool(STORAGE_KEYS.hierarchyCollapsed, collapsed);
    } else {
      state.panelState.inspectorCollapsed = collapsed;
      writeBool(STORAGE_KEYS.inspectorCollapsed, collapsed);
    }
  }

  function togglePanel(section) {
    const collapsed = section === 'hierarchy'
      ? !state.panelState.hierarchyCollapsed
      : !state.panelState.inspectorCollapsed;
    applyPanelState(section, collapsed);
  }

  function setupPanelToggles() {
    state.panelState.hierarchyCollapsed = readBool(STORAGE_KEYS.hierarchyCollapsed, false);
    state.panelState.inspectorCollapsed = readBool(STORAGE_KEYS.inspectorCollapsed, false);

    applyPanelState('hierarchy', state.panelState.hierarchyCollapsed);
    applyPanelState('inspector', state.panelState.inspectorCollapsed);

    const toggles = document.querySelectorAll('.collapse-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        togglePanel(toggle.dataset.section);
      });
    });

    [hierarchyHeader, inspectorHeader].forEach(header => {
      if (!header) return;
      header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const section = header.id === 'hierarchyHeader' ? 'hierarchy' : 'inspector';
          togglePanel(section);
        }
      });
    });

    state.hierarchyExpandedNodes = new Set(readJsonArray(STORAGE_KEYS.hierarchyExpandedNodes));
  }

  function saveHierarchyExpandedNodes() {
    writeJsonArray(STORAGE_KEYS.hierarchyExpandedNodes, Array.from(state.hierarchyExpandedNodes));
  }

  function initializeHierarchyExpandedNodes(list) {
    if (state.hierarchyExpandedInitialized) return;
    if (state.hierarchyExpandedNodes.size > 0) {
      state.hierarchyExpandedInitialized = true;
      return;
    }

    const expanded = new Set();
    function visit(node, parentPath) {
      const name = node.name || 'GameObject';
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      const children = node.children || [];
      if (children.length > 0) {
        expanded.add(currentPath);
      }
      children.forEach(child => visit(child, currentPath));
    }

    list.forEach(scene => {
      const roots = scene.rootObjects || [];
      roots.forEach(root => visit(root, ''));
    });

    state.hierarchyExpandedNodes = expanded;
    state.hierarchyExpandedInitialized = true;
    saveHierarchyExpandedNodes();
  }

  function isNodeExpanded(path) {
    return state.hierarchyExpandedNodes.has(path);
  }

  function toggleNodeExpanded(path) {
    if (state.hierarchyExpandedNodes.has(path)) {
      state.hierarchyExpandedNodes.delete(path);
    } else {
      state.hierarchyExpandedNodes.add(path);
    }
    saveHierarchyExpandedNodes();
  }

  function getGameObjectIconType(name) {
    const lower = String(name || '').toLowerCase();
    if (lower.includes('camera')) return 'camera';
    if (lower.includes('light')) return 'light';
    return 'cube';
  }

  function getIconSvg(type) {
    if (type === 'camera') {
      return '<svg viewBox="0 0 16 16"><path d="M5 4h6l1 2h2v7H2V6h2l1-2zm3 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z"/></svg>';
    }
    if (type === 'light') {
      return '<svg viewBox="0 0 16 16"><path d="M8 1a4.5 4.5 0 0 0-2.6 8.2V12h5.2V9.2A4.5 4.5 0 0 0 8 1zM6 13h4v2H6z"/></svg>';
    }
    return '<svg viewBox="0 0 16 16"><path d="M8 1l6 3v8l-6 3-6-3V4l6-3zm0 2.2L4 4.6v6.8l4 2.1 4-2.1V4.6L8 3.2z"/></svg>';
  }

  function getComponentCollapseKey(gameObjectId, componentType) {
    const safeType = String(componentType || 'Component').replace(/\s+/g, '-');
    return `unity-dashboard-component-${gameObjectId}-${safeType}-collapsed`;
  }

  function isComponentCollapsed(key) {
    return readBool(key, false);
  }

  function setComponentCollapsed(key, collapsed) {
    writeBool(key, collapsed);
  }

  setupPanelToggles();

  logsToggle.onclick = () => {
    logsPanel.classList.toggle('visible');
    if (logsPanel.classList.contains('visible')) {
      debugPanel.classList.remove('visible');
    }
  };

  logsClose.onclick = () => {
    logsPanel.classList.remove('visible');
  };

  debugToggle.onclick = () => {
    debugPanel.classList.toggle('visible');
    if (debugPanel.classList.contains('visible')) {
      logsPanel.classList.remove('visible');
    }
  };

  debugClose.onclick = () => {
    debugPanel.classList.remove('visible');
  };

  playBtn.onclick = async () => {
    const isPlaying = state.lastPlayMode && state.lastPlayMode.isPlaying;
    const action = isPlaying ? 'stop' : 'play';
    await callTool('set_play_mode_status', { action }).catch(() => {});
    await fetchAll();
  };
  pauseBtn.onclick = async () => {
    await callTool('set_play_mode_status', { action: 'pause' }).catch(() => {});
    await fetchAll();
  };
  stepBtn.onclick = async () => {
    await callTool('set_play_mode_status', { action: 'step' }).catch(() => {});
    await fetchAll();
  };
  refreshBtn.onclick = fetchAll;
  syncBtn.onclick = () => syncToAgent('manual');

  fullscreenBtn && (fullscreenBtn.onclick = async () => {
    debugLog('Fullscreen button clicked');
    debugLog('Available modes: ' + JSON.stringify(getAvailableModes()));
    debugLog('Host context: ' + JSON.stringify(hostContext));
    try {
      fullscreenBtn.disabled = true;
      fullscreenBtn.style.opacity = '0.5';
      const result = await requestDisplayMode('fullscreen');
      debugLog('Fullscreen request result: ' + JSON.stringify(result), 'success');
      fullscreenBtn.style.opacity = '1';
      fullscreenBtn.disabled = false;
    } catch (error) {
      debugLog('Fullscreen request failed: ' + error.message, 'error');
      fullscreenBtn.style.opacity = '1';
      fullscreenBtn.style.borderColor = '#ff9b9b';
      setTimeout(() => {
        fullscreenBtn.style.borderColor = '';
        fullscreenBtn.disabled = false;
      }, 2000);
    }
  });

  pipBtn && (pipBtn.onclick = async () => {
    debugLog('PiP button clicked');
    debugLog('Available modes: ' + JSON.stringify(getAvailableModes()));
    debugLog('Host context: ' + JSON.stringify(hostContext));
    try {
      const modes = getAvailableModes();
      const targetMode = modes.includes('pip') ? 'pip' : 'fullscreen';
      debugLog('Requesting mode: ' + targetMode);
      pipBtn.disabled = true;
      pipBtn.style.opacity = '0.5';
      const result = await requestDisplayMode(targetMode);
      debugLog('PiP request result: ' + JSON.stringify(result), 'success');
      pipBtn.style.opacity = '1';
      pipBtn.disabled = false;
    } catch (error) {
      debugLog('PiP request failed: ' + error.message, 'error');
      pipBtn.style.opacity = '1';
      pipBtn.style.borderColor = '#ff9b9b';
      setTimeout(() => {
        pipBtn.style.borderColor = '';
        pipBtn.disabled = false;
      }, 2000);
    }
  });

  interval.oninput = () => { intervalLabel.textContent = interval.value + 's'; };

  function getAvailableModes() {
    const modes = hostContext && hostContext.availableDisplayModes;
    return Array.isArray(modes) ? modes : [];
  }

  async function requestDisplayMode(mode) {
    // This is the actual MCP Apps request:
    debugLog('Sending ui/request-display-mode with mode: ' + mode);
    const result = await rpcRequest('ui/request-display-mode', { mode }, DEFAULT_TIMEOUT_MS);
    debugLog('ui/request-display-mode response: ' + JSON.stringify(result));
    return result;
  }

  function setDisplayButtonsState() {
    // Fullscreen and PiP buttons are disabled (WIP)
    if (fullscreenBtn) {
      fullscreenBtn.disabled = true;
    }
    if (pipBtn) {
      pipBtn.disabled = true;
    }
  }

  function extractToolData(callToolResult) {
    if (!callToolResult) return null;

    // Some MCP App hosts strip non-standard fields (like `data`) from tool results.
    // Prefer it when present, but fall back to parsing `content[].text`.
    if (callToolResult.data) return callToolResult.data;
    const blocks = callToolResult.content || [];
    for (const block of blocks) {
      if (block && typeof block.text === 'string') {
        try { return JSON.parse(block.text); } catch { /* ignore */ }

        const sceneInfo = parseSceneInfoFromText(block.text);
        if (sceneInfo) return sceneInfo;

        const playMode = parsePlayModeFromText(block.text);
        if (playMode) return playMode;
      }
    }
    return null;
  }

  function parseSceneInfoFromText(text) {
    if (typeof text !== 'string') return null;
    if (!text.includes('Active Scene:')) return null;

    const nameMatch = text.match(/Active Scene:\s*(.+)\s*$/m);
    const rootMatch = text.match(/Root Count:\s*(\d+)\s*$/mi);
    const loadedMatch = text.match(/Is Loaded:\s*(true|false)\s*$/mi);

    const name = nameMatch ? nameMatch[1].trim() : null;
    const rootCount = rootMatch ? Number(rootMatch[1]) : null;
    const isLoaded = loadedMatch ? loadedMatch[1].toLowerCase() === 'true' : null;

    if (!name) return null;

    return {
      activeScene: {
        name,
        rootCount: Number.isFinite(rootCount) ? rootCount : 0,
        isLoaded: typeof isLoaded === 'boolean' ? isLoaded : true
      }
    };
  }

  function parsePlayModeFromText(text) {
    if (typeof text !== 'string') return null;
    const normalized = text.trim().toLowerCase();
    if (!normalized) return null;

    // Check for paused state first (more specific)
    if (normalized.includes('play mode') && normalized.includes('paused')) {
      return { isPlaying: true, isPaused: true };
    }

    if (normalized === 'play mode') {
      return { isPlaying: true, isPaused: false };
    }

    if (normalized === 'edit mode') {
      return { isPlaying: false, isPaused: false };
    }

    return null;
  }

  function normalizeLogType(type) {
    const raw = String(type || '').toLowerCase();
    if (raw === 'log' || raw === 'info') return 'info';
    if (raw === 'warning') return 'warning';
    if (raw === 'error' || raw === 'exception' || raw === 'assert') return 'error';
    return 'info';
  }

  function sortLogsBySeverity(items) {
    const priority = { error: 0, warning: 1, info: 2 };
    return items.slice().sort((a, b) => priority[a.type] - priority[b.type]);
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function updateScene(payload) {
    if (!payload) return;
    const active = payload.activeScene;
    if (!active) return;
    state.lastSceneInfo = payload;
    const rootCount = Number(active.rootCount ?? active.rootObjectCount ?? active.rootObjectsCount ?? 0);
    const isLoaded = active.isLoaded !== undefined ? Boolean(active.isLoaded) : true;
    sceneInfo.textContent = `${active.name} - Root Count: ${Number.isFinite(rootCount) ? rootCount : 0} - ${isLoaded ? 'Loaded' : 'Not loaded'}`;
  }

  function detectSceneChanges(sceneNames) {
    if (!sceneNames) return;
    if (sceneNames.length === 0 && state.lastSceneNames.length === 0) {
      return;
    }
    if (!arraysEqual(sceneNames, state.lastSceneNames)) {
      const added = sceneNames.filter(name => !state.lastSceneNames.includes(name));
      const removed = state.lastSceneNames.filter(name => !sceneNames.includes(name));
      updateAgentContext(
        `Unity scene changed. Now loaded: ${sceneNames.join(', ') || 'None'}`,
        {
          sceneChange: {
            loaded: sceneNames,
            added,
            removed
          }
        }
      );
    }
    state.lastSceneNames = sceneNames;
  }

  function setActiveGameObject(entry) {
    state.activeGameObject = entry;
  }

  function highlightSelection(element) {
    const previous = hierarchy.querySelector('.node.selected');
    if (previous && previous !== element) {
      previous.classList.remove('selected');
    }
    element.classList.add('selected');
  }

  function handleSelection(entry, element) {
    setActiveGameObject(entry);
    highlightSelection(element);
    updateAgentContext(
      `User selected GameObject "${entry.name}" (ID: ${entry.id}) in Unity Dashboard.`,
      {
        activeGameObject: { id: entry.id, name: entry.name, path: entry.path },
        recentAction: 'selection'
      }
    );
    renderInspector();
  }

  function isFocused(id) {
    return state.focusedObjects.has(id);
  }

  function toggleFocus(entry) {
    if (!entry || entry.id === undefined || entry.id === null) return;
    if (state.focusedObjects.has(entry.id)) {
      state.focusedObjects.delete(entry.id);
    } else {
      state.focusedObjects.add(entry.id);
      // Also select the object when focusing it to show it in the Inspector
      setActiveGameObject(entry);
      updateAgentContext(
        `User focused GameObject "${entry.name}" (ID: ${entry.id}) in Unity Dashboard.`,
        {
          activeGameObject: { id: entry.id, name: entry.name, path: entry.path },
          recentAction: 'focus'
        }
      );
      renderInspector();
    }
    renderHierarchy(state.lastHierarchy || []);
    refreshFocusedContext('focus-toggle');
  }

  function renderGameObjectNode(node, depth, parentPath, container) {
    const name = node.name || 'GameObject';
    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    const entry = {
      id: node.instanceId,
      name,
      path: currentPath
    };

    const element = document.createElement('div');
    element.className = 'node object';

    const row = document.createElement('div');
    row.className = 'node-row';
    row.style.paddingLeft = `${8 + depth * 12}px`;

    const children = node.children || [];
    const hasChildren = children.length > 0;
    const expanded = hasChildren ? isNodeExpanded(currentPath) : false;

    const toggle = document.createElement('button');
    toggle.className = 'hierarchy-toggle';
    toggle.innerHTML = '<svg viewBox="0 0 10 10"><path d="M2 2 L8 5 L2 8 Z"/></svg>';
    if (!hasChildren) {
      toggle.classList.add('hidden');
      toggle.disabled = true;
    }
    if (!expanded) {
      toggle.classList.add('collapsed');
    }
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleNodeExpanded(currentPath);
      renderHierarchy(state.lastHierarchy || []);
    });

    const icon = document.createElement('span');
    icon.className = 'gameobject-icon';
    icon.innerHTML = getIconSvg(getGameObjectIconType(name));

    const label = document.createElement('span');
    label.className = 'node-label';
    label.textContent = name;

    const focusBtn = document.createElement('button');
    focusBtn.className = 'focus-btn';
    focusBtn.textContent = '*';
    focusBtn.title = isFocused(entry.id) ? 'Unfocus' : 'Focus';
    if (isFocused(entry.id)) {
      focusBtn.classList.add('focused');
      element.classList.add('flagged');
    }

    focusBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFocus(entry);
    });

    row.appendChild(toggle);
    row.appendChild(icon);
    row.appendChild(label);
    row.appendChild(focusBtn);
    element.appendChild(row);

    if (state.activeGameObject && state.activeGameObject.id === entry.id) {
      element.classList.add('selected');
    }

    if (state.lastInspectorFocus && state.lastInspectorFocus.id === entry.id) {
      element.classList.add('focused');
    }

    element.addEventListener('click', (event) => {
      event.stopPropagation();
      handleSelection(entry, element);
    });

    container.appendChild(element);

    if (expanded) {
      children.forEach(child => renderGameObjectNode(child, depth + 1, currentPath, container));
    }
  }

  function renderHierarchy(list) {
    if (!list || list.length === 0) {
      hierarchy.textContent = 'No scene data';
      updateFocusCounter(0, 0);
      return;
    }

    initializeHierarchyExpandedNodes(list);
    pruneFocusedObjects(list);
    const totalCount = countGameObjects(list);
    const visibleList = getVisibleHierarchy(list);
    const visibleCount = countGameObjects(visibleList);

    if (state.focusFilterEnabled && state.focusedObjects.size === 0) {
      hierarchy.textContent = 'No focused objects';
      updateFocusCounter(totalCount, 0);
      return;
    }

    hierarchy.innerHTML = '';
    const container = document.createElement('div');

    visibleList.forEach(scene => {
      const sceneNode = document.createElement('div');
      sceneNode.className = 'node scene';
      sceneNode.textContent = scene.name || 'Scene';
      container.appendChild(sceneNode);

      const rootObjects = scene.rootObjects || [];
      rootObjects.forEach(root => renderGameObjectNode(root, 1, '', container));
    });

    hierarchy.appendChild(container);
    state.hierarchyIndex = buildHierarchyIndex(list);
    detectSceneChanges(list.map(scene => scene.name).filter(Boolean));
    updateFocusCounter(totalCount, visibleCount);
  }

  function isCompilationError(message) {
    const text = String(message || '').toLowerCase();
    return text.includes('compilererror') || text.includes('.cs(') || text.includes('cs(');
  }

  function detectCompilationState(logsList, errorItems) {
    const messages = logsList.map(item => String(item.message || '').toLowerCase());
    const isCompiling = messages.some(message => message.includes('compiling'));
    const compileErrors = errorItems.filter(item => isCompilationError(item.message));
    if (isCompiling) return { state: 'compiling', errorCount: compileErrors.length };
    if (compileErrors.length > 0) return { state: 'failed', errorCount: compileErrors.length };
    if (state.lastCompilationState === 'failed' || state.lastCompilationState === 'compiling') {
      return { state: 'success', errorCount: 0 };
    }
    return { state: state.lastCompilationState || 'idle', errorCount: 0 };
  }

  function getLogKey(item) {
    return `${item.timestamp}|${item.type}|${item.message}`;
  }

  function extractStackFrames(stackTrace, maxFrames = 5) {
    if (!stackTrace) return [];
    return String(stackTrace)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, maxFrames);
  }

  function extractGameObjectReference(item) {
    const sources = [item.message, item.stackTrace];
    for (const text of sources) {
      if (!text) continue;
      const match = String(text).match(/gameobject\s*['"]([^'"]+)['"]/i);
      if (match) return match[1];
      const pathMatch = String(text).match(/gameobject\s*[:=]\s*([A-Za-z0-9_\/\-\s]+)/i);
      if (pathMatch) return pathMatch[1].trim();
    }
    return null;
  }

  async function fetchStackTraceForLog(item) {
    if (item.stackTrace) return item.stackTrace;
    const result = await safeCallTool('get_console_logs', { limit: 50, includeStackTrace: true });
    const data = extractToolData(result);
    const logs = data && data.logs ? data.logs : [];
    const match = logs.find(entry => entry && entry.message === item.message && entry.timestamp === item.timestamp);
    return match && match.stackTrace ? match.stackTrace : '';
  }

  async function pushConsoleErrorToAgent(item, source, includeStackTrace) {
    const stackTrace = includeStackTrace ? await fetchStackTraceForLog(item) : item.stackTrace;
    const stackFrames = extractStackFrames(stackTrace, 5);
    const hint = extractGameObjectReference(item);
    let gameObjectContext = null;
    let gameObjectName = null;

    if (hint) {
      const result = await safeCallTool('get_gameobject', { idOrName: hint });
      const data = extractToolData(result);
      if (data && data.gameObject) {
        gameObjectContext = trimGameObjectForContext(data.gameObject);
        gameObjectName = data.gameObject.name || hint;
      }
    }

    if (!gameObjectContext && state.activeGameObject && state.activeGameObject.id !== undefined) {
      const result = await safeCallTool('get_gameobject', { idOrName: String(state.activeGameObject.id) });
      const data = extractToolData(result);
      if (data && data.gameObject) {
        gameObjectContext = trimGameObjectForContext(data.gameObject);
        gameObjectName = data.gameObject.name || state.activeGameObject.name;
      }
    }

    const summaryPrefix = item.type === 'warning' ? 'Warning' : 'Critical error';
    const objectSuffix = gameObjectName
      ? ` affecting GameObject "${gameObjectName}".`
      : ' with no specific GameObject reference.';
    const description = `${summaryPrefix} detected: ${item.message}${objectSuffix}`;

    await updateAgentContext(description, {
      consoleError: {
        message: item.message,
        type: item.type,
        timestamp: item.timestamp,
        stackFrames
      },
      gameObject: gameObjectContext,
      recentAction: 'console-error',
      pushSource: source
    });
  }

  async function updateLogs(payload) {
    logsContent.innerHTML = '';
    const items = Array.isArray(payload)
      ? payload
      : (payload && payload.logs ? payload.logs : null);
    if (!items || items.length === 0) {
      logsContent.innerHTML = '<div class="log info">No logs</div>';
      state.lastLogs = { logs: [] };
      return;
    }

    const normalized = items.map(item => ({
      message: item.message || item.text || '',
      timestamp: item.timestamp || '',
      type: normalizeLogType(item.level || item.type),
      stackTrace: item.stackTrace || item.stack || ''
    }));

    const ordered = sortLogsBySeverity(normalized);
    const errorItems = ordered.filter(item => item.type === 'error' || item.type === 'warning');

    if (ordered.length < state.lastLogCount) {
      state.logSignatures = new Set();
    }

    const newErrors = errorItems.filter(item => !state.logSignatures.has(getLogKey(item)));
    for (const item of newErrors) {
      state.logSignatures.add(getLogKey(item));
      await pushConsoleErrorToAgent(item, 'auto', false);
    }

    state.lastLogCount = ordered.length;
    state.lastErrorCount = errorItems.length;
    state.recentErrors = errorItems.slice(0, 3);
    state.lastLogs = { logs: ordered };

    const compilation = detectCompilationState(ordered, errorItems);
    if (compilation.state !== state.lastCompilationState) {
      updateAgentContext(
        `Unity compilation ${compilation.state}. ${compilation.errorCount > 0 ? compilation.errorCount + ' errors' : 'No errors'}`,
        {
          compilation: {
            state: compilation.state,
            errorCount: compilation.errorCount,
            timestamp: Date.now()
          }
        }
      );
      state.lastCompilationState = compilation.state;
    }

    ordered.forEach(item => {
      const row = document.createElement('div');
      row.className = 'log ' + item.type + ' log-row';

      const message = document.createElement('div');
      message.textContent = `[${item.timestamp}] ${item.type.toUpperCase()}: ${item.message}`;
      row.appendChild(message);

      if (item.type === 'error' || item.type === 'warning') {
        const actions = document.createElement('div');
        actions.className = 'log-actions';

        const pushBtn = document.createElement('button');
        pushBtn.className = 'log-action-btn';
        pushBtn.textContent = 'Push again';
        pushBtn.title = 'Push error context to agent';
        pushBtn.addEventListener('click', async (event) => {
          event.stopPropagation();
          await pushConsoleErrorToAgent(item, 'manual', true);
        });

        actions.appendChild(pushBtn);
        row.appendChild(actions);
      }

      logsContent.appendChild(row);
    });
  }

  function updatePlayMode(payload) {
    if (!payload) return;

    const isPlaying = Boolean(payload.isPlaying);
    const isPaused = Boolean(payload.isPaused);
    state.lastPlayMode = payload;

    const currentKey = `${isPlaying}-${isPaused}`;
    if (currentKey !== state.lastPlayModeState) {
      updateAgentContext(
        `Unity ${isPlaying ? 'entered Play mode' : 'exited Play mode'}.`,
        {
          unityState: {
            isPlaying,
            isPaused,
            timestamp: Date.now()
          }
        }
      );
      state.lastPlayModeState = currentKey;
    }

    // Update play/stop button
    if (isPlaying) {
      playIcon.style.display = 'none';
      stopIcon.style.display = 'block';
      playBtn.title = 'Stop';
    } else {
      playIcon.style.display = 'block';
      stopIcon.style.display = 'none';
      playBtn.title = 'Play';
    }

    // Update pause button highlighting
    if (isPlaying && isPaused) {
      pauseBtn.classList.add('primary');
    } else {
      pauseBtn.classList.remove('primary');
    }
  }

  function countGameObjects(hierarchyList) {
    let count = 0;
    function visit(node) {
      if (!node) return;
      count += 1;
      const children = node.children || [];
      children.forEach(child => visit(child));
    }

    if (Array.isArray(hierarchyList)) {
      hierarchyList.forEach(scene => {
        const roots = scene.rootObjects || [];
        roots.forEach(root => visit(root));
      });
    }
    return count;
  }

  function collectHierarchyIds(hierarchyList) {
    const ids = new Set();

    function visit(node) {
      if (!node) return;
      ids.add(node.instanceId);
      const children = node.children || [];
      children.forEach(child => visit(child));
    }

    if (Array.isArray(hierarchyList)) {
      hierarchyList.forEach(scene => {
        const roots = scene.rootObjects || [];
        roots.forEach(root => visit(root));
      });
    }

    return ids;
  }

  function pruneFocusedObjects(hierarchyList) {
    const ids = collectHierarchyIds(hierarchyList);
    let removed = false;
    for (const id of Array.from(state.focusedObjects)) {
      if (!ids.has(id)) {
        state.focusedObjects.delete(id);
        removed = true;
      }
    }
    return removed;
  }

  function filterNodeForFocus(node, focusedSet) {
    const children = node.children || [];
    const filteredChildren = children.map(child => filterNodeForFocus(child, focusedSet)).filter(Boolean);
    if (focusedSet.has(node.instanceId) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  function filterHierarchyForFocus(list, focusedSet) {
    if (!focusedSet || focusedSet.size === 0) return list;
    const filtered = [];
    list.forEach(scene => {
      const roots = scene.rootObjects || [];
      const filteredRoots = roots.map(root => filterNodeForFocus(root, focusedSet)).filter(Boolean);
      if (filteredRoots.length > 0) {
        filtered.push({ ...scene, rootObjects: filteredRoots });
      }
    });
    return filtered;
  }

  function getVisibleHierarchy(list) {
    if (state.focusFilterEnabled && state.focusedObjects.size > 0) {
      return filterHierarchyForFocus(list, state.focusedObjects);
    }
    return list;
  }

  function updateFocusCounter(totalCount, visibleCount) {
    if (!focusCount) return;
    if (state.focusFilterEnabled && state.focusedObjects.size > 0) {
      focusCount.textContent = `Showing ${visibleCount} of ${totalCount} objects`;
    } else {
      focusCount.textContent = `Showing ${totalCount} objects`;
    }
    if (state.focusedObjects.size > 0) {
      focusCount.textContent += ` | Focused ${state.focusedObjects.size}`;
    }
  }

  function buildHierarchyIndex(hierarchyList) {
    const index = new Map();

    function visit(node, parentPath, parentId, parentName) {
      if (!node) return;
      const name = node.name || 'GameObject';
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      index.set(node.instanceId, { path: currentPath, parentId, parentName, name });
      const children = node.children || [];
      children.forEach(child => visit(child, currentPath, node.instanceId, name));
    }

    if (Array.isArray(hierarchyList)) {
      hierarchyList.forEach(scene => {
        const roots = scene.rootObjects || [];
        roots.forEach(root => visit(root, '', null, null));
      });
    }

    return index;
  }

  function formatNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    return num.toFixed(2);
  }

  function formatVector(value) {
    if (!value || typeof value !== 'object') return null;
    const x = value.x ?? value.X;
    const y = value.y ?? value.Y;
    const z = value.z ?? value.Z;
    if (x === undefined || y === undefined || z === undefined) return null;
    return `(${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`;
  }

  function getTransformPosition(components) {
    if (!Array.isArray(components)) return null;
    const transform = components.find(component => component && component.type === 'Transform');
    if (!transform || !transform.properties) return null;
    const props = transform.properties;
    const position = props.position || props.localPosition || null;
    return formatVector(position);
  }

  function trimGameObjectForContext(gameObject) {
    if (!gameObject) return null;
    const children = Array.isArray(gameObject.children) ? gameObject.children : [];
    const directChildren = children.map(child => ({
      name: child.name,
      instanceId: child.instanceId,
      activeSelf: child.activeSelf,
      activeInHierarchy: child.activeInHierarchy
    }));
    return {
      name: gameObject.name,
      instanceId: gameObject.instanceId,
      activeSelf: gameObject.activeSelf,
      activeInHierarchy: gameObject.activeInHierarchy,
      tag: gameObject.tag,
      layer: gameObject.layer,
      layerName: gameObject.layerName,
      components: Array.isArray(gameObject.components) ? gameObject.components : [],
      children: directChildren
    };
  }

  function buildFocusSummary(details) {
    return details.map(detail => {
      const components = Array.isArray(detail.components) ? detail.components : [];
      const componentTypes = components.map(component => component.type).filter(Boolean);
      const nonTransform = componentTypes.filter(type => type !== 'Transform');
      const position = getTransformPosition(components);
      const indexEntry = state.hierarchyIndex && state.hierarchyIndex.get(detail.instanceId);
      const parentName = indexEntry ? indexEntry.parentName : null;
      const path = indexEntry ? indexEntry.path : null;
      const children = Array.isArray(detail.children) ? detail.children.map(child => ({
        name: child.name,
        instanceId: child.instanceId,
        activeSelf: child.activeSelf,
        activeInHierarchy: child.activeInHierarchy
      })) : [];
      return {
        id: detail.instanceId,
        name: detail.name,
        path,
        parentName,
        position,
        components,
        componentTypes,
        primaryComponents: nonTransform.slice(0, 3),
        children
      };
    });
  }

  function buildFocusSignature(summary) {
    const payload = summary.map(item => ({
      id: item.id,
      name: item.name,
      position: item.position,
      componentTypes: item.componentTypes,
      children: item.children.map(child => child.instanceId)
    }));
    return JSON.stringify(payload);
  }

  async function fetchFocusedDetails(ids) {
    if (!ids || ids.length === 0) return [];

    const results = await Promise.all(
      ids.map(id => safeCallTool('get_gameobject', { idOrName: String(id) }))
    );

    const details = [];
    results.forEach(result => {
      const data = extractToolData(result);
      if (data && data.gameObject) details.push(data.gameObject);
    });

    return details;
  }

  async function refreshFocusedContext(trigger) {
    if (state.focusRefreshInFlight) return;

    if (!state.focusedObjects || state.focusedObjects.size === 0) {
      state.focusedDetails.clear();
      state.lastFocusSignature = '';
      state.lastFocusIdsKey = '';
      return;
    }

    state.focusRefreshInFlight = true;
    try {
      const ids = Array.from(state.focusedObjects);
      const idsKey = ids.slice().sort().join('|');
      const detailsList = await fetchFocusedDetails(ids);
      if (!detailsList || detailsList.length === 0) return;

      state.focusedDetails.clear();
      detailsList.forEach(detail => {
        if (detail && detail.instanceId !== undefined) {
          state.focusedDetails.set(detail.instanceId, detail);
        }
      });

      const trimmed = detailsList.map(trimGameObjectForContext).filter(Boolean);
      const summary = buildFocusSummary(trimmed);
      const signature = buildFocusSignature(summary);
      const changed = idsKey !== state.lastFocusIdsKey || signature !== state.lastFocusSignature;

      if (changed) {
        const narrativeParts = summary.map(item => {
          const primary = item.primaryComponents && item.primaryComponents.length > 0
            ? item.primaryComponents.join(', ')
            : 'Transform only';
          const positionText = item.position ? ` at ${item.position}` : '';
          return `${item.name} (${primary}${positionText})`;
        });

        await updateAgentContext(
          `User is focusing on ${summary.length} objects: ${narrativeParts.join('; ')}`,
          {
            focus: {
              count: summary.length,
              objects: summary,
              timestamp: Date.now(),
              trigger
            },
            recentAction: 'focus-refresh'
          }
        );

        state.lastFocusIdsKey = idsKey;
        state.lastFocusSignature = signature;
      }

      renderInspector();
    } finally {
      state.focusRefreshInFlight = false;
    }
  }

  async function requestComponentAnalysis(gameObject, component) {
    if (!gameObject || !component) return;
    const analysisKey = `${gameObject.instanceId}:${component.type}`;
    const prompt = [
      'Analyze this component for misconfiguration or runtime issues.',
      `GameObject: ${gameObject.name} (ID: ${gameObject.instanceId})`,
      `Component: ${component.type}`,
      'Properties:',
      JSON.stringify(component.properties || {}, null, 2)
    ].join('\n');

    state.componentAnalyses.set(analysisKey, { prompt, timestamp: Date.now() });
    renderInspector();

    await updateAgentContext(
      `Analyze component "${component.type}" on GameObject "${gameObject.name}".`,
      {
        componentAnalysis: {
          gameObject: {
            id: gameObject.instanceId,
            name: gameObject.name,
            path: state.hierarchyIndex.get(gameObject.instanceId)?.path || null
          },
          component,
          prompt,
          timestamp: Date.now()
        },
        recentAction: 'component-analysis'
      }
    );
  }

  function formatPropertyValue(value) {
    if (value === null || value === undefined) return 'None';
    if (typeof value === 'number') return formatNumber(value);
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(item => formatPropertyValue(item)).join(', ');
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function renderInspector() {
    if (!inspector) return;
    inspector.innerHTML = '';

    if (!state.activeGameObject) {
      inspector.innerHTML = '<div class="inspector-empty">Select a GameObject to inspect.</div>';
      return;
    }

    if (!state.focusedObjects.has(state.activeGameObject.id)) {
      inspector.innerHTML = '<div class="inspector-empty">Select a focused GameObject to inspect.</div>';
      return;
    }

    const detail = state.focusedDetails.get(state.activeGameObject.id);
    if (!detail) {
      inspector.innerHTML = '<div class="inspector-empty">Focused GameObject details not yet loaded.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'inspector-header';
    header.textContent = `${detail.name} (ID: ${detail.instanceId})`;
    inspector.appendChild(header);

    const components = Array.isArray(detail.components) ? detail.components : [];
    if (components.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'inspector-empty';
      empty.textContent = 'No components found.';
      inspector.appendChild(empty);
      return;
    }

    components.forEach(component => {
      const componentName = component.type || 'Component';
      const collapseKey = getComponentCollapseKey(detail.instanceId, componentName);
      const collapsed = isComponentCollapsed(collapseKey);

      const wrapper = document.createElement('div');
      wrapper.className = 'unity-component';
      wrapper.classList.toggle('collapsed', collapsed);

      const headerRow = document.createElement('div');
      headerRow.className = 'unity-component-header';
      headerRow.setAttribute('role', 'button');
      headerRow.setAttribute('aria-expanded', String(!collapsed));
      headerRow.setAttribute('tabindex', '0');

      const triangleBtn = document.createElement('button');
      triangleBtn.className = 'component-triangle';
      triangleBtn.innerHTML = '<svg viewBox="0 0 10 10"><path d="M2 2 L8 5 L2 8 Z"/></svg>';
      if (collapsed) triangleBtn.classList.add('collapsed');
      triangleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const next = !wrapper.classList.contains('collapsed');
        wrapper.classList.toggle('collapsed', next);
        triangleBtn.classList.toggle('collapsed', next);
        headerRow.setAttribute('aria-expanded', String(!next));
        setComponentCollapsed(collapseKey, next);
      });

      headerRow.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          triangleBtn.click();
        }
      });

      const enabledToggle = document.createElement('input');
      enabledToggle.type = 'checkbox';
      enabledToggle.className = 'component-enabled';
      enabledToggle.checked = component.enabled !== false;
      enabledToggle.disabled = true;

      const icon = document.createElement('span');
      icon.className = 'component-icon';
      icon.innerHTML = getIconSvg('cube');

      const title = document.createElement('span');
      title.className = 'component-title';
      title.textContent = componentName;

      const spacer = document.createElement('span');
      spacer.className = 'header-spacer';

      const analyzeBtn = document.createElement('button');
      analyzeBtn.className = 'analyze-btn';
      analyzeBtn.textContent = 'Analyze';
      analyzeBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        await requestComponentAnalysis(detail, component);
      });

      const gearBtn = document.createElement('button');
      gearBtn.className = 'component-gear';
      gearBtn.title = 'Settings (read-only)';
      gearBtn.disabled = true;
      gearBtn.innerHTML = '<svg viewBox="0 0 16 16"><path d="M9.6 1l.4 1.6a5.6 5.6 0 0 1 1.3.8l1.5-.6 1 1.8-1.3 1a5.2 5.2 0 0 1 0 1.6l1.3 1-1 1.8-1.5-.6a5.6 5.6 0 0 1-1.3.8L9.6 15H7.4l-.4-1.6a5.6 5.6 0 0 1-1.3-.8l-1.5.6-1-1.8 1.3-1a5.2 5.2 0 0 1 0-1.6l-1.3-1 1-1.8 1.5.6a5.6 5.6 0 0 1 1.3-.8L7.4 1h2.2zM8.5 6.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/></svg>';

      headerRow.appendChild(triangleBtn);
      headerRow.appendChild(enabledToggle);
      headerRow.appendChild(icon);
      headerRow.appendChild(title);
      headerRow.appendChild(spacer);
      headerRow.appendChild(analyzeBtn);
      headerRow.appendChild(gearBtn);

      const content = document.createElement('div');
      content.className = 'unity-component-content';

      if (component.properties && Object.keys(component.properties).length > 0) {
        const grid = document.createElement('div');
        grid.className = 'component-grid';
        Object.entries(component.properties).forEach(([key, value]) => {
          const label = document.createElement('div');
          label.className = 'component-label';
          label.textContent = key;
          const valueEl = document.createElement('div');
          valueEl.className = 'component-value';
          valueEl.textContent = formatPropertyValue(value);
          grid.appendChild(label);
          grid.appendChild(valueEl);
        });
        content.appendChild(grid);
      } else {
        const empty = document.createElement('div');
        empty.className = 'inspector-empty';
        empty.textContent = 'No properties found.';
        content.appendChild(empty);
      }

      const analysisKey = `${detail.instanceId}:${component.type}`;
      const analysis = state.componentAnalyses.get(analysisKey);
      if (analysis) {
        const note = document.createElement('div');
        note.className = 'analysis-note';
        note.textContent = analysis.prompt;
        content.appendChild(note);
      }

      wrapper.appendChild(headerRow);
      wrapper.appendChild(content);
      inspector.appendChild(wrapper);
    });
  }

  function updateInspectorFocus(payload) {
    if (!payload || !payload.activeGameObject) {
      if (state.lastInspectorFocus !== null) {
        state.lastInspectorFocus = null;
        renderHierarchy(state.lastHierarchy || []);
      }
      return;
    }

    const focus = {
      id: payload.activeGameObject.instanceId,
      name: payload.activeGameObject.name,
      path: payload.activeGameObject.path,
      component: payload.focusedComponent || null
    };

    const previous = state.lastInspectorFocus;
    const isSame = previous && previous.id === focus.id && previous.component === focus.component;

    if (!isSame) {
      updateAgentContext(
        `User is inspecting ${focus.component || 'GameObject'} on ${focus.name}`,
        {
          inspectorFocus: {
            gameObject: { id: focus.id, name: focus.name, path: focus.path },
            component: focus.component,
            timestamp: Date.now()
          }
        }
      );
      state.lastInspectorFocus = focus;
      renderHierarchy(state.lastHierarchy || []);
    }
  }

  async function fetchInspectorState() {
    try {
      const payload = await readResourceJson('unity://inspector_state');
      updateInspectorFocus(payload);
    } catch (error) {
      // Ignore inspector polling errors so the rest of the dashboard still works.
    }
  }

  async function syncToAgent(source) {
    const sceneInfoPayload = state.lastSceneInfo || {};
    const activeScene = sceneInfoPayload.activeScene || {};
    const sceneName = activeScene.name || 'Unknown';
    const loadedScenes = state.lastSceneNames || [];
    const hierarchyList = state.lastHierarchy || [];
    const gameObjectCount = countGameObjects(hierarchyList);
    const errorCount = state.lastErrorCount || 0;
    const topErrors = state.recentErrors || [];
    const playModePayload = state.lastPlayMode || {};
    const isPlaying = Boolean(playModePayload.isPlaying);
    const isPaused = Boolean(playModePayload.isPaused);
    const inspectorFocus = state.lastInspectorFocus
      ? {
          gameObject: {
            id: state.lastInspectorFocus.id,
            name: state.lastInspectorFocus.name,
            path: state.lastInspectorFocus.path
          },
          component: state.lastInspectorFocus.component
        }
      : null;

    await updateAgentContext(
      `Unity Dashboard synchronized. Scene: ${sceneName}, ${gameObjectCount} objects, ${errorCount} errors.`,
      {
        sceneInfo: {
          name: sceneName,
          loadedScenes,
          rootObjectCount: Number(activeScene.rootCount ?? activeScene.rootObjectCount ?? activeScene.rootObjectsCount ?? 0)
        },
        activeGameObject: state.activeGameObject || null,
        playMode: { isPlaying, isPaused },
        topErrors,
        inspectorFocus,
        focusedObjects: Array.from(state.focusedObjects),
        syncTimestamp: Date.now(),
        syncSource: source
      }
    );
  }

  async function safeCallTool(name, args) {
    try {
      return await callTool(name, args);
    } catch (error) {
      return null;
    }
  }

  async function fetchAll() {
    // Important: fetch calls independently so one failure doesn't block all rendering.
    const sceneResult = await safeCallTool('get_scene_info', {});
    const hierarchyResult = await safeCallTool('get_scenes_hierarchy', {});
    const logsResult = await safeCallTool('get_console_logs', { limit: 50, includeStackTrace: false });
    const playModeResult = await safeCallTool('get_play_mode_status', {});

    const sceneData = extractToolData(sceneResult);
    const hierarchyData = extractToolData(hierarchyResult);
    const logsData = extractToolData(logsResult);
    const playModeData = extractToolData(playModeResult);

    if (sceneData) {
      updateScene(sceneData);
    } else {
      sceneInfo.textContent = 'Scene info unavailable';
    }

    if (hierarchyData && Array.isArray(hierarchyData.scenes)) {
      state.lastHierarchy = hierarchyData.scenes;
      renderHierarchy(hierarchyData.scenes);
    } else {
      hierarchy.textContent = 'Hierarchy unavailable';
    }

    if (logsData) {
      await updateLogs(logsData);
    }

    if (playModeData) {
      updatePlayMode(playModeData);
    }

    await fetchInspectorState();
  }

  function startAutoRefresh() {
    const intervalMs = Math.max(1, Number(interval.value || 3)) * 1000;
    return setInterval(() => {
      if (autoRefresh.checked) {
        fetchAll();
      }
    }, intervalMs);
  }

  autoRefresh.onchange = () => {
    if (autoRefresh.checked) {
      fetchAll();
    }
  };

  focusFilter.onchange = () => {
    state.focusFilterEnabled = focusFilter.checked;
    renderHierarchy(state.lastHierarchy || []);
  };

  initializeApp().then(async () => {
    await fetchAll();
    startAutoRefresh();
  });
</script>
```

##### Step 2 Verification Checklist
- [ ] Panel headers show Unity-style triangle indicators and collapse on triangle click.
- [ ] Hierarchy nodes show indentation, expand/collapse triangles, and icons.
- [ ] Inspector components render with Unity-style headers, checkbox, icon, and gear.
- [ ] Collapse states persist across refresh for panels and hierarchy nodes.
- [ ] Selected GameObject shows Unity blue highlight.
- [ ] Refresh the dashboard to confirm panel collapse state persistence.

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 3: Unity Visual Refinement & Polish
- [ ] Replace the entire `<style>` block in [Server~/src/ui/unity-dashboard.html](Server~/src/ui/unity-dashboard.html) with the code below:

```html
<style>
  :root{
    --unity-bg:#383838;
    --unity-card:#2a2a2a;
    --unity-card-alt:#222222;
    --unity-input:#191919;
    --unity-border:#1e1e1e;
    --unity-text:#d2d2d2;
    --unity-text-muted:#9b9b9b;
    --unity-hover:#2c2c2c;
    --unity-selected:#2c5d87;
    --unity-focus:#5A9FFF;
    --unity-accent:#6aa8ff;
    --transition-fast:150ms;
  }
  html,body{height:100%;margin:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:linear-gradient(180deg,#383838 0%,#323232 100%);color:var(--unity-text);padding:8px}
  .app{max-width:1100px;margin:0 auto}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  h1{font-size:13px;margin:0;color:var(--unity-text)}
  .controls{display:flex;gap:8px}
  button{background:var(--unity-card-alt);border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;transition:all var(--transition-fast) ease}
  button:active:not(:disabled){transform:scale(0.97);background:#1c1c1c}
  button:disabled{opacity:0.4;cursor:not-allowed;border-color:#0d0d0d}
  button svg{width:14px;height:14px;fill:currentColor}
  button.primary{background:var(--unity-selected);color:#e8f1ff;border-color:#1c4c73}
  button.primary:active:not(:disabled){background:#274f73}
  button:focus-visible{outline:2px solid var(--unity-focus);outline-offset:1px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .card{background:var(--unity-card);border:1px solid var(--unity-border);padding:8px;border-radius:6px}
  .panel-header{display:flex;align-items:center;gap:6px;height:24px}
  .panel-header[role="button"]{outline:none}
  .panel-title{font-size:13px;color:var(--unity-text);margin:0}
  .panel-meta{font-size:11px;color:var(--unity-text-muted)}
  .panel-spacer{flex:1}
  .collapse-toggle{background:transparent;border:none;color:var(--unity-text);width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;padding:0;border-radius:3px}
  .collapse-toggle svg{width:12px;height:12px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .collapse-toggle.collapsed svg{transform:rotate(-90deg)}
  .panel-collapsed .section-content{max-height:0;opacity:0;overflow:hidden;padding:0;margin:0}
  .section-content{max-height:600px;opacity:1;overflow:hidden;transition:max-height var(--transition-fast) ease,opacity var(--transition-fast) ease}
  .section-title{font-size:12px;color:var(--unity-text-muted);margin:0}
  .toolbar{display:flex;gap:6px;align-items:center}
  label{font-size:11px;color:var(--unity-text-muted)}
  input[type=range]{width:120px}
  input[type=checkbox]{accent-color:var(--unity-selected)}
  .meta{font-size:11px;color:var(--unity-text-muted)}

  #hierarchy{max-height:300px;overflow:auto;font-size:11px}
  .node{color:var(--unity-text)}
  .node-row{display:flex;align-items:center;gap:6px;height:22px;border-radius:3px;padding-right:6px}
  .node-row:hover{background:var(--unity-hover)}
  .node.selected .node-row{background:var(--unity-selected);color:#fff}
  .node.focused .node-row{outline:1px solid #ffd580;background:#2f2f2f}
  .node.scene{font-weight:600;color:#c9dcff}
  .hierarchy-toolbar{display:flex;align-items:center;justify-content:space-between;margin:4px 0 6px 0}
  .hierarchy-toggle{background:transparent;border:none;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:var(--unity-text);padding:0}
  .hierarchy-toggle svg{width:10px;height:10px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .hierarchy-toggle.collapsed svg{transform:rotate(-90deg)}
  .hierarchy-toggle.hidden{visibility:hidden}
  .gameobject-icon{width:12px;height:12px;display:inline-flex;align-items:center;justify-content:center;color:#bcbcbc}
  .gameobject-icon svg{width:12px;height:12px;fill:currentColor}
  .node-label{font-size:11px}
  .focus-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:#9b9b9b;padding:0 4px;border-radius:4px;font-size:10px;min-width:20px;height:20px;line-height:1}
  .focus-btn:hover{border-color:var(--unity-accent);color:#e6eef8}
  .focus-btn.focused{color:#ffd580;border-color:#5f4b1c;background:rgba(255,213,128,0.12)}

  #inspector{max-height:300px;overflow:auto;font-size:12px}
  .inspector-header{font-size:12px;color:var(--unity-text);margin-bottom:6px}
  .inspector-empty{color:var(--unity-text-muted);font-size:12px;padding:6px 0}
  .unity-component{border:1px solid var(--unity-border);background:var(--unity-card-alt);border-radius:4px;margin:6px 0;overflow:hidden}
  .unity-component-header{display:flex;align-items:center;gap:6px;height:24px;padding:0 6px;background:#2e2e2e}
  .unity-component-header:hover{background:var(--unity-hover)}
  .component-triangle{background:transparent;border:none;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;color:var(--unity-text);padding:0}
  .component-triangle svg{width:12px;height:12px;fill:currentColor;transition:transform var(--transition-fast) ease}
  .component-triangle.collapsed svg{transform:rotate(-90deg)}
  .component-enabled{width:14px;height:14px}
  .component-icon{width:14px;height:14px;color:#bcbcbc;display:inline-flex;align-items:center;justify-content:center}
  .component-icon svg{width:12px;height:12px;fill:currentColor}
  .component-title{font-size:12px;color:var(--unity-text)}
  .header-spacer{flex:1}
  .component-gear{background:transparent;border:none;color:var(--unity-text-muted);opacity:0;transition:opacity var(--transition-fast) ease;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
  .unity-component-header:hover .component-gear{opacity:1}
  .unity-component-content{padding:6px;background:var(--unity-card)}
  .unity-component.collapsed .unity-component-content{max-height:0;opacity:0;overflow:hidden;padding:0}
  .component-grid{display:grid;grid-template-columns:40% 60%;gap:4px 8px;font-size:11px}
  .component-label{text-align:right;color:var(--unity-text-muted)}
  .component-value{background:var(--unity-input);border:1px solid #0d0d0d;border-radius:2px;padding:2px 4px;color:var(--unity-text);font-family:Consolas,Menlo,monospace;font-size:11px;white-space:pre-wrap}
  .analysis-note{margin-top:6px;padding:6px;background:#222;border:1px dashed #3a3a3a;border-radius:4px;font-size:11px;color:#a7f3d0}
  .analyze-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;font-size:11px;height:22px}
  .analyze-btn:hover{border-color:var(--unity-accent)}

  .logs{max-height:260px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px}
  .log.info{color:#9fc5ff}
  .log.warn{color:#ffd580}
  .log.error{color:#ff9b9b}
  .log-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
  .log-actions{display:flex;align-items:center;gap:6px}
  .log-action-btn{background:#1f1f1f;border:1px solid #0d0d0d;color:var(--unity-text);padding:0 6px;border-radius:4px;font-size:10px;height:20px}
  .log-action-btn:hover{border-color:var(--unity-accent)}

  .status-row{display:flex;align-items:center;gap:6px;margin-top:6px}
  .status-badge{font-size:10px;padding:2px 6px;border-radius:999px;border:1px solid #2a2a2a;color:var(--unity-text-muted);text-transform:uppercase;letter-spacing:0.04em}
  .status-badge.playing{background:#1e3b2e;border-color:#1f8b6f;color:#a7f3d0}
  .status-badge.edit{background:#2a2a2a;border-color:#3a3a3a;color:#cbd5e1}
  .status-badge.compiling{background:#2a1f10;border-color:#a16207;color:#fde68a}
  .status-badge.failed{background:#3b1313;border-color:#b91c1c;color:#fecaca}
  .status-badge.success{background:#0f2b1c;border-color:#22c55e;color:#bbf7d0}
  .spinner{width:10px;height:10px;border:2px solid #a16207;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  .logs-panel{position:fixed;bottom:0;left:0;right:0;background:var(--unity-card);border-top:1px solid var(--unity-border);max-height:280px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px;z-index:9998;display:none}
  .logs-panel.visible{display:block}
  .logs-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--unity-card-alt);border-bottom:1px solid var(--unity-border)}
  .logs-title{color:var(--unity-text);font-weight:600;font-size:12px}
  .logs-content{padding:6px 10px}
  .debug-panel{position:fixed;bottom:0;left:0;right:0;background:var(--unity-card);border-top:1px solid var(--unity-border);max-height:240px;overflow:auto;font-family:Consolas,Menlo,monospace;font-size:11px;z-index:9999;display:none}
  .debug-panel.visible{display:block}
  .debug-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--unity-card-alt);border-bottom:1px solid var(--unity-border)}
  .debug-title{color:var(--unity-text);font-weight:600;font-size:12px}
  .debug-content{padding:6px 10px}
  .debug-log{padding:4px 0;color:#9fc5ff;border-bottom:1px solid #2a2a2a}
  .debug-log.error{color:#ff9b9b}
  .debug-log.success{color:#a7f3d0}
  .panel-toggle{position:fixed;bottom:10px;right:10px;background:var(--unity-card-alt);border:1px solid var(--unity-border);color:var(--unity-text);padding:6px;border-radius:6px;cursor:pointer;z-index:10000;font-size:11px;width:36px;height:36px;display:flex;align-items:center;justify-content:center}
  .panel-toggle svg{width:18px;height:18px;fill:currentColor}
  .panel-toggle.logs{right:54px}

  *{scrollbar-width:thin;scrollbar-color:#4a4a4a #2a2a2a}
  *::-webkit-scrollbar{width:8px;height:8px}
  *::-webkit-scrollbar-track{background:#2a2a2a}
  *::-webkit-scrollbar-thumb{background:#4a4a4a;border-radius:4px}
  *::-webkit-scrollbar-thumb:hover{background:#5a5a5a}
</style>
```

##### Step 3 Verification Checklist
- [ ] Typography matches Unity sizing: 11px hierarchy items, 12px inspector labels, 13px headers.
- [ ] Collapsible triangles rotate smoothly and remain 24x24 click targets.
- [ ] Focus outlines use Unity blue (#5A9FFF) on keyboard navigation.
- [ ] Scrollbars render as thin Unity-style dark scrollbars.
- [ ] All interactive elements maintain 24x24px minimum hit area.

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
