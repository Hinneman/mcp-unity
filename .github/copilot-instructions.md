# Copilot Instructions for MCP Unity Fork

## Repository Context
This is a fork of [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity). We maintain compatibility with the upstream repository while adding custom features.

## Compact Tools Enforcement
This fork includes "compact" wrapper tools and cached resources to reduce MCP context usage when returning large datasets (console logs, scene hierarchies, GameObject details).

Guidelines (enforced):
- **Default to compact tools**: Agents and contributors MUST prefer the compact variants (e.g., `get_console_logs_compact`, `get_scenes_hierarchy_compact`, `get_gameobject_compact`) instead of the full-output originals when fetching data that can be large.
- **When to use full tools**: Use the original full-output tools only when a developer explicitly requests full output (e.g., `includeStackTrace=true`) or when the dataset is small (<= 20 items) and inline details are required.
- **Register compact prompt**: Ensure `unity_compact_tools` prompt is registered in `Server~/src/index.ts` for agents to consult; include guidance from `Server~/src/prompts/custom/compactToolsPrompt.ts`.
- **Cache & fetch pattern**: Compact tools should return a small summary and a `detailsUri` pointing at cached resources (`unity://logs/cached/{id}`, `unity://hierarchy/cached/{id}`, `unity://gameobject/cached/{id}`) for on-demand retrieval.
- **Testing requirement**: New PRs that add data-returning tools must include a smoke test demonstrating compact behavior for large returns (summary + detailsUri) and full behavior for small returns.

Rationale: compact tools preserve the MCP context window for meaningful reasoning while allowing on-demand access to full data via cached resources.

## Code Modification Policy

### ⛔ DO NOT MODIFY - Original Tool Files
The following tool files are from the upstream repository and **must not be modified**:

#### Unity Editor Tools (C#)
- `Editor/Tools/McpToolBase.cs`
- `Editor/Tools/MenuItemTool.cs`
- `Editor/Tools/SelectGameObjectTool.cs`
- `Editor/Tools/UpdateGameObjectTool.cs`
- `Editor/Tools/UpdateComponentTool.cs`
- `Editor/Tools/AddPackageTool.cs`
- `Editor/Tools/RunTestsTool.cs`
- `Editor/Tools/SendConsoleLogTool.cs`
- `Editor/Tools/AddAssetToSceneTool.cs`
- `Editor/Tools/CreatePrefabTool.cs`
- `Editor/Tools/CreateSceneTool.cs`
- `Editor/Tools/DeleteSceneTool.cs`
- `Editor/Tools/LoadSceneTool.cs`
- `Editor/Tools/SaveSceneTool.cs`
- `Editor/Tools/GetSceneInfoTool.cs`
- `Editor/Tools/UnloadSceneTool.cs`
- `Editor/Tools/GetGameObjectTool.cs`
- `Editor/Tools/GetConsoleLogsTool.cs`
- `Editor/Tools/RecompileScriptsTool.cs`
- `Editor/Tools/GameObjectTools.cs` (duplicate, delete, reparent)
- `Editor/Tools/TransformTools.cs` (move, rotate, scale, set_transform)
- `Editor/Tools/MaterialTools.cs` (create_material, assign_material, modify_material, get_material_info)
- `Editor/Tools/BatchExecuteTool.cs`

#### Node Server Tools (TypeScript)
- `Server~/src/tools/menuItemTool.ts`
- `Server~/src/tools/selectGameObjectTool.ts`
- `Server~/src/tools/updateGameObjectTool.ts`
- `Server~/src/tools/updateComponentTool.ts`
- `Server~/src/tools/addPackageTool.ts`
- `Server~/src/tools/runTestsTool.ts`
- `Server~/src/tools/sendConsoleLogTool.ts`
- `Server~/src/tools/addAssetToSceneTool.ts`
- `Server~/src/tools/createPrefabTool.ts`
- `Server~/src/tools/createSceneTool.ts`
- `Server~/src/tools/deleteSceneTool.ts`
- `Server~/src/tools/loadSceneTool.ts`
- `Server~/src/tools/saveSceneTool.ts`
- `Server~/src/tools/getSceneInfoTool.ts`
- `Server~/src/tools/unloadSceneTool.ts`
- `Server~/src/tools/getScenesHierarchyTool.ts`
- `Server~/src/tools/getGameObjectTool.ts`
- `Server~/src/tools/getConsoleLogsTool.ts`
- `Server~/src/tools/recompileScriptsTool.ts`
- `Server~/src/tools/gameObjectTools.ts`
- `Server~/src/tools/transformTools.ts`
- `Server~/src/tools/materialTools.ts`
- `Server~/src/tools/batchExecuteTool.ts`

#### Core Infrastructure Files
- `Editor/UnityBridge/McpUnityServer.cs` (except for registering custom tools)
- `Editor/UnityBridge/McpUnitySocketHandler.cs`
- `Editor/UnityBridge/McpUnityEditorWindow.cs` (original portions)
- `Editor/UnityBridge/McpUnitySettings.cs` (core settings)
- `Editor/Resources/McpResourceBase.cs`
- `Editor/Resources/GetMenuItemsResource.cs`
- `Editor/Resources/GetPackagesResource.cs`
- `Editor/Resources/GetAssetsResource.cs`
- `Editor/Resources/GetTestsResource.cs`
- `Editor/Resources/GetScenesHierarchyResource.cs`
- `Editor/Resources/GetGameObjectResource.cs`
- `Editor/Resources/GetConsoleLogsResource.cs`
- `Editor/Services/TestRunnerService.cs`
- `Editor/Services/ConsoleLogsService.cs`
- `Editor/Services/ITestRunnerService.cs`
- `Editor/Services/IConsoleLogsService.cs`
- `Editor/Utils/*.cs` (all utility files)
- `Server~/src/unity/mcpUnity.ts`
- `Server~/src/utils/*.ts` (all utility files)
- `Server~/src/resources/*.ts` (all resource files)

### ✅ CUSTOM ADDITIONS - Can be Modified
These files are custom to this fork and can be modified freely:

#### Unity Dashboard MCP App
- `Server~/src/tools/showUnityDashboardTool.ts`
- `Server~/src/ui/unity-dashboard.html`
- Any new tools or features related to the dashboard
- Any files in `plans/` directory


#### Play Mode Status Tools
- `Editor/Tools/GetPlayModeStatusTool.cs`
- `Editor/Tools/SetPlayModeStatusTool.cs`
- `Server~/src/tools/getPlayModeStatusTool.ts`
- `Server~/src/tools/setPlayModeStatusTool.ts`

#### Other Custom Additions
### Guidelines for Modifications

1. **Bug Fixes in Original Tools**: If you find a bug in an original tool file, document it and consider:
   - Contributing the fix upstream to CoderGamester/mcp-unity
   - Creating a wrapper or extension instead of modifying the original file

2. **Adding New Features**: 
   - Create new tool files with unique names (e.g., `CustomFeatureTool.cs` / `customFeatureTool.ts`)
   - Register custom tools separately in a dedicated section
   - Document custom tools in a separate markdown file

3. **Extending Original Tools**:
   - Use inheritance or composition patterns
   - Create wrapper classes that call original tools
   - Add custom behavior in separate files

4. **Merging Upstream Changes**:
   - Original tool files should be cleanly updatable from upstream
   - Keep conflicts minimal by not modifying original files
   - Document any intentional deviations in this file

### Example: Adding a Custom Tool

```csharp
// ✅ GOOD: New file Editor/Tools/CustomFeatureTool.cs
public class CustomFeatureTool : McpToolBase
{
    public CustomFeatureTool()
    {
        Name = "custom_feature";
        Description = "Custom feature for this fork";
    }
    
    public override JObject Execute(JObject parameters)
    {
        // Custom implementation
    }
}
```

```csharp
// ⛔ BAD: Modifying Editor/Tools/MenuItemTool.cs
public class MenuItemTool : McpToolBase
{
    public MenuItemTool()
    {
        Name = "execute_menu_item";
        Description = "Executes Unity menu items";
        // ❌ Don't add custom behavior here
    }
}
```

### Registration of Custom Tools

When registering custom tools, add them in a clearly marked section:

```csharp
// In McpUnityServer.cs RegisterTools() method
// ... (original tool registrations)

// ========== CUSTOM TOOLS (Fork-specific) ==========
// Register ShowUnityDashboardTool
ShowUnityDashboardTool showUnityDashboardTool = new ShowUnityDashboardTool();
_tools.Add(showUnityDashboardTool.Name, showUnityDashboardTool);

// Add other custom tools here
// =================================================
```

## Questions or Clarifications

If you need to modify an original tool file for a legitimate reason, please:
1. Explain why modification is necessary
2. Consider alternative approaches
3. Document the change clearly
4. Plan for upstream contribution or future merge conflicts

## See Also
- [AGENTS.md](../AGENTS.md) - Agent development guidelines
- [README.md](../README.md) - Project documentation
