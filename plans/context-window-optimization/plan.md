# Context Window Optimization - Architectural Approach

**Branch:** `optimize/context-window-architecture`
**Description:** Implement architectural solutions to reduce token usage without breaking changes

## Goal
Reduce context window consumption from 93% (119K/128K) to 30-40% using advanced MCP patterns:
- Just-in-Time Data Loading (URI Resources)
- LLM Summarization at the server level
- Smart defaults with opt-in verbosity
- Enhanced pagination and filtering

**Key Constraint:** All implementations must use **custom wrapper tools** - no modification of upstream files per copilot-instructions.md.

## Implementation Steps

### Step 1: Create Compact Console Logs Tool (Custom Wrapper)
**Files (All New - Fork-Specific):**
- `Server~/src/tools/custom/getConsoleLogsCompactTool.ts` (new custom tool)
- `Server~/src/custom/summarizers/logSummarizer.ts` (new - summarization logic)
- `Server~/src/custom/cache/sessionCache.ts` (new - cache full logs for URI access)
- `Server~/src/resources/custom/cachedLogsResource.ts` (new - serve cached logs via URI)

**What:** Create a **new custom tool** `get_console_logs_compact` that:
1. Calls the original `get_console_logs` tool internally (composition pattern)
2. Automatically generates a compact summary for responses > 20 logs
3. Caches full logs in memory with session ID
4. Returns summary + URI to cached full logs
5. Registers custom resource to serve cached logs

**How it works (Composition Pattern):**
```typescript
export async function registerGetConsoleLogsCompactTool(server, mcpUnity, logger) {
  server.tool("get_console_logs_compact", "Compact console logs (auto-summarized)", schema,
    async (params) => {
      // Call original tool's handler via mcpUnity
      const response = await mcpUnity.sendRequest({
        method: "get_console_logs",
        params: { ...params, includeStackTrace: params.includeStackTrace ?? false }
      });
      
      const logs = response.data ?? response.logs;
      
      // If verbose, summarize and cache
      if (logs.length > 20 || params.includeStackTrace) {
        const sessionId = generateSessionId();
        sessionCache.set(sessionId, logs);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              summary: summarizeLogs(logs),
              detailsUri: `unity://logs/cached/${sessionId}`,
              message: "Full logs available via URI"
            })
          }]
        };
      }
      
      // Small response, return as-is
      return { content: [{ type: "text", text: JSON.stringify(logs) }] };
    });
}
```

**Benefits:**
- ✅ No modification to upstream files
- ✅ Original tool remains unchanged
- ✅ Users can use either tool (old or compact)
- AI sees compact summary instead of 10-50K tokens
- Full logs available via URI when needed
- Can be deprecated if upstream adopts this pattern

**Testing:** 
1. Generate 50+ logs with stack traces in Unity
2. Call tool without parameters
3. Verify summary is returned (~1-2K tokens)
4. Verify URI is accessible for full details

---

### Step 2: Create Compact Hierarchy Tool (Custom Wrapper)
**Files (All New - Fork-Specific):**
- `Server~/src/tools/custom/getScenesHierarchyCompactTool.ts` (new custom tool)
- `Server~/src/custom/cache/hierarchyCache.ts` (new - cache full hierarchy)
- `Server~/src/resources/custom/cachedHierarchyResource.ts` (new - serve via URI)
- `Server~/src/custom/summarizers/hierarchySummarizer.ts` (new - summary logic)

**What:** Create a **new custom tool** `get_scenes_hierarchy_compact` that:
1. Calls original `get_scenes_hierarchy` internally via mcpUnity
2. Detects if hierarchy is large (>100 objects)
3. If large: returns summary + URI to cached full hierarchy
4. If small: returns full hierarchy as-is
5. Registers custom resource to serve cached hierarchies

**How it works (Composition Pattern):**
```typescript
export async function registerGetScenesHierarchyCompactTool(server, mcpUnity, logger) {
  server.tool("get_scenes_hierarchy_compact", "Compact hierarchy (auto-summarized)", schema,
    async (params) => {
      // Call original hierarchy resource
      const response = await mcpUnity.sendRequest({
        method: "get_scenes_hierarchy",
        params: {}
      });
      
      const hierarchy = response.hierarchy;
      const totalObjects = countObjects(hierarchy);
      
      // Large hierarchy? Summarize and cache
      if (totalObjects > 100) {
        const hierarchyId = generateHierarchyId();
        hierarchyCache.set(hierarchyId, hierarchy);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              summary: summarizeHierarchy(hierarchy),
              totalObjects,
              detailsUri: `unity://hierarchy/cached/${hierarchyId}`,
              message: "Large hierarchy cached. Access via URI to view details."
            })
          }]
        };
      }
      
      // Small hierarchy, return as-is
      return { content: [{ type: "text", text: JSON.stringify(hierarchy) }] };
    });
}
```

**Benefits:**
- ✅ No modification to upstream files
- ✅ Original tool remains unchanged
- Massive hierarchy doesn't bloat context
- AI can "open" the URI only when needed
- Automatic threshold detection

**Testing:**
1. Load scenCreate Compact GameObject Tool (Custom Wrapper)
**Files (All New - Fork-Specific):**
- `Server~/src/tools/custom/getGameObjectCompactTool.ts` (new custom tool)
- `Server~/src/custom/cache/gameObjectCache.ts` (new - cache full details)
- `Server~/src/resources/custom/cachedGameObjectResource.ts` (new - serve via URI
Create a **new custom tool** `get_gameobject_compact` that:
1. Calls original `get_gameobject` tool internally
2. Accepts `compactMode` parameter (default: `auto`)
3. Auto-detects if response is large (>50 child objects or >5 components)
4. Returns minimal data + URI to cached full details
5. Optional `compactMode=false` to force full output

**How it works (Composition Pattern):**
```typescript
export async function registerGetGameObjectCompactTool(server, mcpUnity, logger) {
  server.tool("get_gameobject_compact", "Get GameObject (compact mode)", schema,
    async (params) => {
      // Call original tool
      const response = await mcpUnity.sendRequest({
        method: "get_gameobject",
        params: { idOrName: params.idOrName }
      });
      
      const gameObject = response.gameObject;
      const compactMode = params.compactMode ?? 'auto';
      
      // Determine if compact needed
      const shouldCompact = compactMode === true || 
        (compactMode === 'auto' && isLarge(gameObject));
      
      if (shouldCompact) {
        const cacheId = cacheGameObject(gameObject);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: gameObject.name,
              instanceId: gameObject.instanceId,
              activeSelf: gameObject.activeSelf,
              components: gameObject.components.map(c => c.type),
              childCount: gameObject.children?.length ?? 0,
              detailsUri: `unity://gameobject/cached/${cacheId}`
            })
          }]
        };
      }
      
      // Return full details
      return { content: [{ type: "text", text: JSON.stringify(gameObject) }] };
    });
}
```

**Benefits:**
- ✅ No modification to upstream files
- ✅ Original tool remains unchanged
- 60-80% reduction per object
- Smart auto-detection reduces cognitive load
- Explicit control with `compactMode` parameter1-3K | 85-95% |
| 2 | Hierarchy (large) | 50-100K | 2-5K | 95-98% |
| 3 | GameObject Details | 2-5K | 0.5-1K | 75-80% |
| 4 | Dashboard HTML | 12-30K | 6-15K | 50% |
| 5 | Filtered Collections | 10-20K | 2-5K | 75-80% |

**Overall Context Window Impact:**
- **Current:** 93% usage (119K/128K tokens) with frequent overflow
- **After Step 1:** ~55-65% usage (major improvement)
- **After All Steps:** ~25-35% usage (sustainable long-term)

**Additional Benefits:**
- Faster AI response times (less data to process)
- Reduced network bandwidth
- Better user experience (summaries more readable)
- No breaking changes (backward compatible)

## Comparison to Simple Default Change

| Approach | Token Reduction | Breaking Changes | Upstream Contribution |
|----------|----------------|------------------|----------------------|
| **Change includeStackTrace default** | 60-80% (logs only) | ✗ YES | ⚠️ Controversial |
| **Architectural approach** | 85-95% (all tools) | ✓ NO | ✓ Easy to upstream |

**Why architectural approach is superior:**
1. **No breaking changes** - all existing code continues to work
2. **Broader impact** - optimizes all tools, not just logs
3. **Better UX** - AI gets summaries automatically
4. **Upstream friendly** - pure improvements, no controversial changes
5. **Future-proof** - scales with MCP best practices
- Original behavior for small scenes

**Testing:**
1. Load scene with 500+ objects
2. Call get_scenes_hierarchy
3. Verify summary only (1-2K tokens)
4. Access URI resource and verify full hierarchy returned

---

### Step 3: Add Compact Mode with Smart Defaults
**Files:**
- `Server~/src/tools/getGameObjectTool.ts` (add compactMode param)
- `Server~/src/tools/getScenesHierarchyTool.ts` (add compactMode param)

**What:** Add optional `compactMode` parameter (default: auto-detect):
- `auto`: Use compact if object count > 50
- `true`: Always return compact (name, id, component types only)
- `false`: Full details (current behavior)

**Compact output structure:**
```json
{
  "name": "Player",
  "instanceId": 12345,
  "activeSelf": true,
  "components": ["Transform", "Rigidbody", "PlayerController"],
  "childCount": 3,
  "detailsUri": "unity://gameobject/12345"
}
```

**Benefits:**
- No breaking changes (compactMode=false restores full output)
- 60-80% reductiTool Registration & Documentation
**Files (All New/Modified - Fork-Specific):**
- `Server~/src/index.ts` (register custom tools in dedicated section)
- `Server~/src/prompts/custom/compactToolsPrompt.ts` (new - guide AI to use compact tools)
- `AGENTS.md` (update with new tools documentation)

**What:** 
1. Register all custom compact tools in `index.ts` with clear fork-specific section
2. Create a prompt that guides AI agents when to use compact vs original tools
3. Update documentation with usage examples

**Registration pattern (in index.ts):**
```typescript
// ========== CUSTOM TOOLS (Fork-specific - Context Optimization) ==========
import { registerGetConsoleLogsCompactTool } from './tools/custom/getConsoleLogsCompactTool.js';
import { registerGetScenesHierarchyCompactTool } from './tools/custom/getScenesHierarchyCompactTool.js';
import { registerGetGameObjectCompactTool } from './tools/custom/getGameObjectCompactTool.js';

// Register compact wrapper tools (preferred for AI agents - token efficient)
registerGetConsoleLogsCompactTool(server, mcpUnity, toolLogger);
registerGetScenesHierarchyCompactTool(server, mcpUnity, toolLogger);
registerGetGameObjectCompactTool(server, mcpUnity, toolLogger);

// Register custom caching resources
registerCachedLogsResource(server, resourceLogger);
registerCachedHierarchyResource(server, resourceLogger);
registerCachedGameObjectResource(server, resourceLogger);
// =======================================================================
```

**Prompt content (compactToolsPrompt.ts):**
```typescript
export function registerCompactToolsPrompt(server: McpServer) {
  server.prompt(
    "unity_compact_tools",
    "Guidance for using Unity MCP compact tools efficiently",
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `# Unity MCP Compact Tools

**Phase 1 (CRITICAL - 4-6 hours):** Steps 1 & 2
- Create compact logs tool with summarization
- Create compact hierarchy tool with caching
- Implement cache infrastructure
- Create custom resources for URI access
- **Impact:** 85-95% reduction in worst offenders
- **Complexity:** Medium (new infrastructure needed)

**Phase 2 (HIGH - 2-3 hours):** Step 3
- Create compact GameObject tool
- Reuse cache infrastructure from Phase 1
- **Impact:** 60-80% reduction for GameObject queries
- **Complexity:** Low (infrastructure already exists)

**Phase 3 (MODERATE - 1-2 hours):** Step 4
- Minify dashboard HTML
- Add build script for automation
- **Impact:** 50% reduction when dashboard accessed
- **Complexity:** Low (standard minification)

**Phase 4 (LOW - 1-2 hours):** Step 5
- Register all custom tools
- Create guidance prompt
- Update documentation
- **Impact:** Ensures AI agents use compact tools by default
- **Complexity:** Low (registration and docs)
- Debugging specific issues requiring full stack traces
- Small datasets (<20 items)
- When explicitly requested by user

## Usage Examples

// Get recent errors (compact summary)
get_console_logs_compact({ logType: "error", limit: 50 })

// Get hierarchy (auto-summarized if large)
get_scenes_hierarchy_compact()

// Get GameObject (compact by default)
get_gameobject_compact({ idOrName: "Player" })

// Force full details when needed
get_gameobject_compact({ idOrName: "Player", compactMode: false })
`
        }
      }]
    })
  );
}
```

**Benefits:**
- Clear separation of fork-specific tools
- AI agents guided to use efficient tools
- Documentation keeps upstream compatibility visible
- Easy to maintain and upstream later

**Testing:**
1. Verify all tools register successfully
2. Test prompt in MCP client
3. Verify AGENTS.md is updated with new tools
# Verify minified HTML in build/ui/
# Compare file sizes (expect ~60KB -> ~30KB)
```

--Fork-First Approach:**
1. Implement all custom wrapper tools in fork
2. Gather real-world performance metrics over 2-4 weeks
3. Document token reduction with actual data
4. Test with multiple AI agents/clients

**Upstream Proposal Strategy:**
After validation in fork, propose to upstream as:

**Option A: Merge Custom Tools**
- PR with all custom wrapper tools
- Show performance data
- Emphasize: no modification to existing tools
- Clean addition that can be ignored if not wanted

**Option B: Integrate Patterns into Original Tools**
- Propose adding `compactMode` parameter to original tools
- Show our working implementation as reference
- Requires modifying upstream files (more controversial)
- Better long-term solution (no duplicate tools)

**Recommendation:** Start with Option A (less controversial), gather adoption data, then propose Option B once benefits are proven.

**Key Metrics to Collect:**
- Token usage before/after for each tool
- API call frequency (which tools benefit most)
- User feedback on summary quality
- Performance overhead of summarization (<100ms acceptable)
{
  recentOnly: true,    // Default: last 50 logs
  priorityFilter: "errors-warnings"  // Skip info logs by default
}
```

**Benefits:**
- Dramatically reduces default return size
- Most useful data returned first
- Override with explicit params when needed
- No breaking changes (full data accessible)

**Testing:**
1. Verify each filtered tool returns subset
2. Verify override parameters work
3. Check token usage reductionhat:** Run npm build and verify no compilation errors

**Testing:** 
```powershell
cd Server~
npm run build
```

## Breaking Change Justification

**Why this is acceptable:**
1. Tool documentation already warns "ALWAYS SET TO FALSE"
2. 80-90% token reduction is critical for usability
3. Implementation Priority

**Phase 1 (CRITICAL - 2-4 hours):** Steps 1 & 2
- LLM Summarization for logs
- URI Resources for hierarchy
- **Impact:** 85-95% reduction in worst offenders

**Phase 2 (HIGH - 2-3 hours):** Steps 3 & 5
- Compact mode for GameObjects
- Smart filtering defaults
- **Impact:** Additional 50-70% reduction across remaining tools

**Phase 3 (MODERATE - 1-2 hours):** Step 4
- Minify dashboard HTML
- **Impact:** Steady 50% reduction when dashboard accessed

## Testing Strategy

**For each step:**
1. **Unit tests:** Verify summary generation logic
2. **Integration tests:** Test URI resource resolution
3. **Token measurements:** Before/after comparison with real data
4. **Backward compatibility:** Verify explicit params restore full output
5. **Performance:** Ensure summarization is fast (<100ms)

**Acceptance criteria:**
- [ ] All existing tests pass
- [ ] New tests for summary/compact modes pass
- [ ] Token usage measured and documented
- [ ] Documentation updated with new patterns
- [ ] No regressions in functionality

## Upstream Contribution Plan

**These improvements are upstream-friendly:**
1. No breaking changes
2. Pure performance enhancements
3. Follow MCP best practices
4. Well-tested and documented

**Contribution sequence:**
1. Implement in fork first
2. Gather performance metrics (before/after)
3. Create detailed PR with:
   - Token reduction data
   - Usage examples
   - Performance benchmarks
4. Propose to upstream with evidence

## Future Enhancements (Beyond This Plan)

**Memory MCP Tool** (from information.md):
- Add `store_context` / `retrieve_context` tools
- Persist architectural decisions across sessions
- Further reduce repeated context loading

**Subagent Optimization:**
- Add prompts that guide AI to use subagents for heavy analysis
- Subagents operate in isolated context windows
- Return only summaries to main chat

**Streaming Responses:**
- For very large datasets, stream summaries progressively
- Allow AI to request "next chunk" aso calls
---

## Compliance with copilot-instructions.md

This plan is **fully compliant** with fork modification policy:

### ✅ No Upstream Files Modified
All changes use the **composition/wrapper pattern**:
- Original tools remain untouched
- New tools call original tools via `mcpUnity.sendRequest()`
- Results are post-processed in custom code only

### ✅ All New Files in Custom Locations
```
Server~/src/
├── tools/custom/              # ✅ New directory for custom tools
│   ├── getConsoleLogsCompactTool.ts
│   ├── getScenesHierarchyCompactTool.ts
│   └── getGameObjectCompactTool.ts
├── custom/                    # ✅ New directory for custom infrastructure
│   ├── cache/
│   │   ├── sessionCache.ts
│   │   ├── hierarchyCache.ts
│   │   └── gameObjectCache.ts
│   └── summarizers/
│       ├── logSummarizer.ts
│       └── hierarchySummarizer.ts
├── resources/custom/          # ✅ New directory for custom resources
│   ├── cachedLogsResource.ts
│   ├── cachedHierarchyResource.ts
│   └── cachedGameObjectResource.ts
└── prompts/custom/            # ✅ New directory for custom prompts
    └── compactToolsPrompt.ts
```

### ✅ Clean Separation
- Custom tools registered in dedicated fork-specific section of `index.ts`
- Original tools remain default/unchanged
- Users can choose between original and compact versions
- Downstream merge conflicts minimized

### ✅ Upstream Contribution Ready
- Can be proposed as pure addition (no file modifications)
- If accepted: deprecate our custom tools in favor of upstream
- If rejected: maintain as fork feature indefinitely
- Clean rollback path (just remove registration)

### 🎯 Result
- **Zero upstream file modifications**
- **100% compliant with copilot-instructions.md**
- **Full functionality preserved**
- **85-95% token reduction achieved**- AI agents: Prompts will guide when to use stack traces
- Documentation: Update to show explicit parameter usage for debugging

## Expected Impact

**Before:** Console log queries consuming 10-50K tokens
**After:** Console log queries consuming 1-5K tokens
**Reduction:** 80-90% for typical queries
**Context Window Impact:** From 93% usage to ~40-50% usage

## Rollback Plan

If this change causes issues:
1. Revert commits
2. Add environment variable `MCP_UNITY_VERBOSE_LOGS=true` to restore old behavior
3. Keep fork-specific while proposing upstream with data

## Follow-up Tasks

After Phase 1 completion:
- Monitor usage and gather feedback
- Prepare upstream PR with performance data
- Consider Phase 2 (dashboard optimization) if more reduction needed
