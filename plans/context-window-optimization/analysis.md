# Context Window Optimization Analysis

**Date:** February 11, 2026  
**Issue:** MCP Unity server and MCP app are filling VS Code context window very rapidly (93% usage at 119.1K/128K tokens)

## Problem Breakdown

Based on the screenshot and code analysis, the token distribution is:
- **System Instructions:** 5.6% (~7K tokens)
- **Tool Definitions:** 12.1% (~15K tokens)
- **User Context:**
  - Messages: 16.8% (~20K tokens)
  - Files: 19.6% (~23K tokens)
  - **Tool Results: 43% (~51K tokens)** ⚠️ **PRIMARY ISSUE**

## Root Causes Identified

### 1. **Console Logs with Stack Traces** (CRITICAL - 80-90% token waste)

**Location:** `Editor/Resources/GetConsoleLogsResource.cs`, `Server~/src/tools/getConsoleLogsTool.ts`, `Server~/src/resources/getConsoleLogsResource.ts`

**Problem:**
- The `includeStackTrace` parameter defaults to `true` in most contexts
- Stack traces can increase token usage by **80-90%** according to the code's own warning
- The tool description explicitly warns: *"⚠️ ALWAYS SET TO FALSE to save 80-90% tokens"*
- Yet the default remains `true` for backward compatibility

**Evidence:**
```typescript
// From getConsoleLogsTool.ts line 35
includeStackTrace: z.boolean().optional()
  .describe("Whether to include stack trace in logs. ⚠️ ALWAYS SET TO FALSE to save 80-90% tokens, unless you specifically need stack traces for debugging. Default: true")

// From getConsoleLogsResource.ts line 84
let includeStackTrace = true; // Default to true for backward compatibility
```

**Impact:** A single console log fetch with 50 logs could be 10K-50K tokens vs 1K-5K tokens without stack traces.

---

### 2. **Unity Dashboard HTML is Massive** (MODERATE - ~50-120KB)

**Location:** `Server~/src/ui/unity-dashboard.html`

**Problem:**
- The HTML file is **1574 lines** long
- Estimated size: 50-120KB (~12-30K tokens)
- This entire file is loaded as a resource every time the dashboard is accessed
- Contains inlined CSS and JavaScript (no external assets)

**Impact:** Opening the dashboard consumes 10-15% of context window immediately.

---

### 3. **Scenes Hierarchy Returns Everything** (HIGH - scales with scene complexity)

**Location:** `Editor/Resources/GetScenesHierarchyResource.cs`, `Server~/src/resources/getScenesHierarchyResource.ts`

**Problem:**
- Returns the **entire scene hierarchy** with all GameObjects
- No pagination or filtering options
- Uses `GameObjectToJObject(rootObject, false)` which includes all children recursively
- In a complex Unity scene with 1000+ objects, this could be 30-100K tokens

**Code:**
```csharp
// From GetScenesHierarchyResource.cs
foreach (GameObject rootObject in rootObjects)
{
    rootObjectsInScene.Add(GetGameObjectResource.GameObjectToJObject(rootObject, false));
}
```

**Impact:** Viewing scene hierarchy in a moderately complex scene = 20-50K tokens.

---

### 4. **GameObject Details are Verbose** (MODERATE - per-object basis)

**Location:** `Editor/Resources/GetGameObjectResource.cs`

**Problem:**
- When `includeDetailedComponents = true`, serializes **all component properties** recursively
- Has safeguards (`MaxSerializationDepth = 5`, `MaxCollectionItems = 50`) but still very verbose
- Serializes all public fields, properties, and serialized private fields via reflection
- A single GameObject with several components can be 1-5K tokens

**Impact:** Per-object is manageable, but multiplied across hierarchy or repeated calls adds up.

---

### 5. **High Number of Tool Definitions** (LOW-MODERATE - 12.1% of context)

**Location:** `Server~/src/index.ts`

**Problem:**
- **30+ tools** registered (exact count: ~33 individual tools)
- **8 resources**
- **2 prompts**
- Each tool has a name, description, and zod schema definition
- All tools are loaded into context even if not used

**Impact:** ~15K tokens for tool definitions. Can't be avoided in current MCP architecture, but could be reduced with shorter descriptions.

---

## Optimization Recommendations

### Priority 1: Fix Console Logs Default (CRITICAL) ⚠️

**Change `includeStackTrace` default from `true` to `false`**

**Files to modify (custom fork, CAN modify):**
- ✅ `Server~/src/tools/getConsoleLogsTool.ts` - change default from `true` to `false` (line 84)
- ⚠️ `Server~/src/resources/getConsoleLogsResource.ts` - change default from `true` to `false` (line 84)

**Files that CANNOT be modified (upstream):**
- ⛔ `Editor/Resources/GetConsoleLogsResource.cs` - defaults to `true` (line varies)

**Solution:** Since we can't modify the C# resource, we must change the Node-side defaults so AI agents and users get `false` by default.

**Estimated Impact:** **60-80% reduction in console log token usage**

---

### Priority 2: Optimize Unity Dashboard Loading (MODERATE)

**Options:**
1. **Lazy-load dashboard** - Don't load dashboard HTML into context unless explicitly shown
2. **External CSS/JS** - Split HTML into smaller files (requires host to serve assets)
3. **Minify HTML** - Remove whitespace, comments (moderate gains, ~10-20%)
4. **Compress/encode** - Use base64 or compression (host may not support)

**Files to modify:**
- ✅ `Server~/src/ui/unity-dashboard.html` (can modify)
- ✅ `Server~/src/resources/unityDashboardAppResource.ts` (can modify)
- ✅ `Server~/src/tools/showUnityDashboardTool.ts` (can modify)

**Recommendation:** 
- **Short-term:** Minify the HTML (automated build step)
- **Long-term:** Make dashboard loading opt-in or lazy-loaded

**Estimated Impact:** **10-15K token reduction** when dashboard is accessed

---

### Priority 3: Add Pagination/Filtering to Scenes Hierarchy (HIGH)

**Problem:** Cannot modify upstream files, but can create custom wrapper/alternative.

**Options:**
1. **Create custom tool** - `get_scenes_hierarchy_filtered` with parameters for:
   - `maxDepth` - limit recursion depth
   - `objectFilter` - filter by name/tag
   - `includeComponents` - whether to include component info
   - `limit` - max number of objects

2. **Deprecate direct hierarchy access** - Guide agents to use targeted queries instead

**Files to create (custom additions allowed):**
- ✅ `Editor/Tools/GetScenesHierarchyFilteredTool.cs` (new file)
- ✅ `Server~/src/tools/getScenesHierarchyFilteredTool.ts` (new file)

**Upstream impact:** Keep original tool for compatibility, but recommend filtered version in prompts/docs.

**Estimated Impact:** **50-80% reduction in hierarchy token usage** with default limits

---

### Priority 4: Add "Compact" Mode for GameObject Details (MODERATE)

**Options:**
1. **Create new parameter `compactMode`** - returns only essential fields:
   - name, instanceId, activeSelf, component types (not full properties)
   
2. **Default to compact for hierarchy queries**

**Files to create:**
- ✅ Custom wrapper tool (doesn't modify upstream)

**Estimated Impact:** **60-70% reduction in per-object token usage**

---

### Priority 5: Optimize Tool Descriptions (LOW)

**Current:** Tool descriptions are comprehensive but verbose  
**Solution:** Shorten descriptions, use abbreviations, remove redundant text

**Example:**
```typescript
// Before (verbose)
description: "Retrieves logs from the Unity console with pagination support to avoid token limits"

// After (compact)
description: "Get Unity console logs (paginated). Use includeStackTrace=false to save 80% tokens."
```

**Files:** All tool registration files in `Server~/src/tools/*.ts`

**Estimated Impact:** **2-5K token reduction in tool definitions**

---

## Proposed Implementation Plan

### Phase 1: Critical Fix (IMMEDIATE - <1 hour)
- Change `includeStackTrace` default to `false` in Node tools/resources
- Update documentation to reflect new default
- **Impact:** 60-80% reduction in console log tokens

### Phase 2: Dashboard Optimization (SHORT-TERM - 2-4 hours)
- Minify `unity-dashboard.html` in build process
- Make dashboard loading more explicit (avoid auto-loading into context)
- **Impact:** 10-15K token reduction

### Phase 3: Smart Hierarchy Filtering (MEDIUM-TERM - 4-8 hours)
- Create custom filtered hierarchy tools
- Add pagination, depth limits, compact mode
- Update prompts to recommend filtered queries
- **Impact:** 50-80% reduction in hierarchy queries

### Phase 4: Compact Mode (MEDIUM-TERM - 2-4 hours)
- Add `compactMode` parameter to relevant tools
- Return minimal info by default, full details on request
- **Impact:** Additional 30-50% reduction when querying many objects

### Phase 5: Polish (LONG-TERM - 2-4 hours)
- Shorten all tool descriptions
- Review and optimize all resource outputs
- **Impact:** 2-5K token reduction across all tools

---

## Upstream Contribution Considerations

**Can be contributed upstream:**
- ✅ Console log stack trace default change (`includeStackTrace=false`)
- ✅ Hierarchy pagination/filtering
- ✅ Compact mode options
- ✅ Dashboard minification

**Fork-specific:**
- Custom wrapper tools
- Fork-specific prompts/documentation

**Recommendation:** Implement fixes in fork first, then propose to upstream as PRs with clear performance data.

---

## Breaking Changes Assessment

### Changing `includeStackTrace` default to `false`

**Pros:**
- Massive token savings (80-90%)
- Aligns with tool's own recommendation
- Better default behavior for AI agents

**Cons:**
- **Breaking change** - existing workflows expecting stack traces will break
- Need to update documentation
- Users debugging errors will need to explicitly set `includeStackTrace=true`

**Mitigation:**
- Add to CHANGELOG as breaking change
- Update all examples/docs
- Add warning in upgrade notes
- Make parameter explicit in prompts/guidance

**Verdict:** **Benefits far outweigh costs** - proceed with change

---

## Estimated Total Impact

**Before optimization:**
- Console logs: 10-50K tokens (with stack traces)
- Dashboard: 12-30K tokens
- Hierarchy: 20-100K tokens (complex scenes)
- **Total: 42-180K tokens** (frequently exceeds 128K limit)

**After all optimizations:**
- Console logs: 1-5K tokens (no stack traces by default)
- Dashboard: 5-10K tokens (minified + lazy-load)
- Hierarchy: 5-20K tokens (filtered/paginated)
- **Total: 11-35K tokens** (70-80% reduction)

**Conclusion:** These optimizations can reduce context window usage from 93% to approximately **30-40%**, providing much more headroom for actual conversation and code context.

---

## Next Steps

1. **Immediate:** Change `includeStackTrace` defaults (Priority 1)
2. **Create detailed implementation plan** for Phase 1
3. **Get user approval** on breaking changes
4. **Implement and test** Phase 1
5. **Measure impact** before proceeding to Phase 2

---

## Questions for User

1. **Breaking change approval:** Are you comfortable changing `includeStackTrace` default to `false`?
2. **Upstream contribution:** Should we prepare these fixes for upstream PR after testing in fork?
3. **Priority order:** Is the proposed priority order correct, or would you prefer different phasing?
4. **Scope:** Should we implement all phases, or just critical fixes for now?
