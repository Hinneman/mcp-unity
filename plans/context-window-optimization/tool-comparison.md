# Console Logs Tool Size Comparison

## Overview
This document compares the output size between `get_console_logs` (original) and `get_console_logs_compact` (optimized) to demonstrate context window savings.

## Key Differences

### `get_console_logs` (Original)
- **Returns**: Full log array with all details
- **includeStackTrace default**: `true`
- **When to use**: Debugging specific issues, small datasets (< 20 logs)
- **Output format**: Complete JSON array of log objects

### `get_console_logs_compact` (Optimized)
- **Returns**: Summary when > 20 logs, otherwise full logs
- **includeStackTrace default**: `false`
- **When to use**: Large datasets, overview/triage, context optimization
- **Output format**: 
  - **Small dataset (≤ 20 logs)**: Full logs (same as original)
  - **Large dataset (> 20 logs)**: Summary + cached URI

---

## Example Scenario: 100 Console Logs

### Original Tool Output (`get_console_logs`)

```json
{
  "logs": [
    {
      "logType": "error",
      "message": "NullReferenceException: Object reference not set to an instance of an object",
      "stackTrace": "  at PlayerController.Update () [0x0001a] in Assets/Scripts/PlayerController.cs:45\n  at UnityEngine.MonoBehaviour.Internal_InvokeMoveNext (System.Object enumerator, System.IntPtr returnValueAddress) [0x00027] in <hash>:0\n  at UnityEngine.GUIUtility.ProcessEvent (System.Int32 instanceID, System.IntPtr nativeEventPtr, System.Boolean& result) [0x0002b] in <hash>:0",
      "timestamp": "2026-02-11T20:05:32.123Z",
      "frame": 1234,
      "condition": "NullReferenceException"
    },
    {
      "logType": "warning",
      "message": "Shader warning in 'Universal Render Pipeline/Lit': Maximum number of samplers exceeded",
      "stackTrace": "  at UnityEngine.Shader.Parse () [0x0001a] in <hash>:0\n  at UnityEngine.Material.SetTexture (System.String name, UnityEngine.Texture value) [0x00012] in <hash>:0",
      "timestamp": "2026-02-11T20:05:33.456Z",
      "frame": 1235,
      "condition": "Shader warning"
    },
    // ... 98 more log entries with full stack traces ...
  ],
  "offset": 0,
  "limit": 100,
  "logType": null,
  "includeStackTrace": true
}
```

**Estimated Size**: ~150-250 KB (depending on stack traces)  
**Estimated Tokens**: ~50,000-80,000 tokens

---

### Compact Tool Output (`get_console_logs_compact`)

```json
{
  "summary": {
    "total": 100,
    "byType": {
      "error": 15,
      "warning": 35,
      "info": 50
    },
    "sampleMessages": [
      {
        "type": "warning",
        "message": "Shader warning in 'Universal Render Pipeline/Lit': Maximum number of samplers exceeded",
        "count": 25
      },
      {
        "type": "error",
        "message": "NullReferenceException: Object reference not set to an instance of an object",
        "count": 10
      },
      {
        "type": "info",
        "message": "Player connected to server",
        "count": 8
      },
      {
        "type": "error",
        "message": "Failed to load asset: missing_texture.png",
        "count": 5
      },
      {
        "type": "warning",
        "message": "Animation clip 'Walk' is missing root motion",
        "count": 4
      }
    ],
    "hasStackTraces": false
  },
  "count": 100,
  "includeStackTrace": false,
  "detailsUri": "unity://logs/cached/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Full logs available via URI."
}
```

**Estimated Size**: ~1-2 KB  
**Estimated Tokens**: ~300-500 tokens

---

## Token Savings Analysis

| Metric | Original Tool | Compact Tool | Savings |
|--------|---------------|--------------|---------|
| **Size** | 150-250 KB | 1-2 KB | **99% reduction** |
| **Tokens** | 50,000-80,000 | 300-500 | **99% reduction** |
| **Context Usage** | High (fills context window) | Minimal (leaves room for other data) | **Massive improvement** |

## When Compact Tool Auto-Summarizes

The compact tool uses **smart auto-detection**:

```typescript
if (logList.length > 20 || includeStackTrace) {
  // Return summary + cached URI
} else {
  // Return full logs (same as original)
}
```

### Scenarios:
- **≤ 20 logs, no stack traces**: Returns full logs directly
- **> 20 logs**: Returns summary with cached full logs
- **Any count with `includeStackTrace=true`**: Returns summary (stack traces are huge)

## Accessing Cached Full Logs

When the compact tool returns a summary, full logs are cached for 30 minutes:

```
detailsUri: "unity://logs/cached/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

The AI agent can access the full logs via the **cached resource**:
- **Resource name**: `cached_console_logs`
- **URI pattern**: `unity://logs/cached/{sessionId}`

This allows the agent to:
1. Get a quick overview (summary)
2. Only fetch full details if needed for debugging
3. Avoid polluting the context window with massive log dumps

## Use Case Examples

### Scenario 1: Triage Mode (Agent checking for errors)
```typescript
// Agent calls
get_console_logs_compact({ logType: "error", limit: 100 })

// Gets summary: "15 errors, top issue: NullReferenceException (10x)"
// Decision: Fetch full logs for NullReferenceException only if needed
```

### Scenario 2: Debugging Specific Issue (Developer mode)
```typescript
// Agent calls
get_console_logs({ logType: "error", limit: 10, includeStackTrace: true })

// Gets full logs with stack traces for immediate analysis
```

### Scenario 3: Large Dataset Overview
```typescript
// Agent calls
get_scenes_hierarchy_compact()  // Step 2 (coming next)

// Gets: "500 GameObjects, max depth: 12, sample paths: ..."
// Full hierarchy available at URI if needed
```

## Testing Instructions

1. **Connect to Unity Editor** with the MCP server running
2. **Generate some console logs** in Unity (errors, warnings, info)
3. **Call both tools** and compare output sizes:

```bash
# Original tool (large output)
mcp call get_console_logs '{"limit": 100}'

# Compact tool (small summary)
mcp call get_console_logs_compact '{"limit": 100}'
```

4. **Verify cached resource** works:
```bash
# Use the sessionId from compact tool output
mcp resource read unity://logs/cached/{sessionId}
```

## Expected Results

✅ **Compact tool reduces context window usage by 99%**  
✅ **Summary provides actionable insights without full data**  
✅ **Cached resource allows on-demand full access**  
✅ **Agents can intelligently decide when to fetch full logs**

---

## Next Steps

After verifying Step 1 works:
- **Step 2**: Implement `get_scenes_hierarchy_compact` (same pattern)
- **Step 3**: Implement `get_gameobject_compact` (same pattern)
- **Step 4**: Register all tools and create `unity_compact_tools` prompt

This architecture enables **context-aware data fetching** where agents only load full data when needed for their task.
