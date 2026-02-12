# Unity Dashboard Interactive Tool Integration

**Branch:** `feature/dashboard-tool-integration`
**Description:** Add interactive GameObject manipulation, Transform editing, and scene management tools to the Unity Dashboard MCP App

## Goal
Transform the Unity Dashboard from a read-only monitoring tool into an interactive scene editor by integrating high-value MCP tools. Enable users to perform common Unity operations (delete, duplicate, transform, save) directly in the dashboard without typing agent commands, improving workflow efficiency and reducing context switching.

## Implementation Steps

### Step 1: Context Menu Infrastructure & Delete GameObject
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Create reusable context menu component that appears on right-click in hierarchy. Implement `delete_gameobject` tool integration with confirmation modal to safely remove GameObjects from the scene. Add modal dialog component for confirmations.

**Details:**
- Add context menu CSS and JavaScript infrastructure
- Implement right-click event handler on hierarchy nodes
- Create modal dialog component (reusable for confirmations)
- Add "Delete GameObject" menu item that shows confirmation modal
- Modal includes checkbox for "Delete children (X)" option
- On confirmation, call `delete_gameobject` tool and refresh hierarchy
- Handle errors gracefully with user feedback

**Testing:** 
1. Right-click any GameObject in hierarchy
2. Select "Delete GameObject" from context menu
3. Confirm deletion in modal
4. Verify GameObject removed from hierarchy and Unity scene
5. Test with GameObject that has children

---

### Step 2: Duplicate GameObject
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add "Duplicate GameObject" to context menu with quick options for 1x, 5x, 10x, and custom count. Implement `duplicate_gameobject` tool integration for rapid prototyping workflows.

**Details:**
- Add "Duplicate GameObject" submenu to context menu with count presets
- Add custom count input modal for flexible duplication
- Call `duplicate_gameobject` tool with count parameter
- Handle automatic naming (Unity adds " (1)", " (2)", etc.)
- Refresh hierarchy after duplication
- Add keyboard shortcut handler for Ctrl+D (optional enhancement)

**Testing:**
1. Right-click GameObject → Duplicate → 5x
2. Verify 5 copies appear in hierarchy with numbered names
3. Test custom count with modal input
4. Verify all duplicates appear in Unity scene

---

### Step 3: Inspector GameObject Header Editor
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add editable GameObject properties (name, tag, layer, activeSelf) to Inspector header. Implement `update_gameobject` tool integration with dropdown fetching for tags/layers. Create reusable dropdown component.

**Details:**
- Fetch available tags from Unity (via resource or tool query)
- Fetch available layers from Unity (via resource or tool query)
- Create Inspector header section with editable fields:
  - Text input for name
  - Dropdown for tag (populated from Unity)
  - Dropdown for layer (populated from Unity)
  - Checkbox for activeSelf
  - Checkbox for isStatic
- Add "Apply Changes" button that calls `update_gameobject`
- Add visual feedback for unsaved changes (dirty state)
- Handle validation (empty name, invalid selections)

**Testing:**
1. Focus GameObject in hierarchy
2. Inspector shows current name, tag, layer, active state
3. Change name → click Apply → verify name updates in hierarchy
4. Change tag from dropdown → Apply → verify in Unity Inspector
5. Toggle active checkbox → Apply → verify GameObject activates/deactivates
6. Test validation with empty name

---

### Step 4: Save Scene & Dirty State Indicator
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add save button to toolbar that calls `save_scene` tool. Implement dirty state indicator (dot badge) that appears when scene has unsaved changes, polling from `get_scene_info` isDirty field.

**Details:**
- Add save icon button to main toolbar (floppy disk icon)
- Poll scene dirty state from `get_scene_info` response
- Display small dot indicator on save button when scene.isDirty is true
- On click, call `save_scene` tool
- Show success feedback (button animation or toast)
- Clear dirty indicator after successful save
- Handle save errors gracefully

**Testing:**
1. Make changes to scene (delete, duplicate, move objects)
2. Verify dirty indicator (dot) appears on save button
3. Click save button
4. Verify dirty indicator disappears
5. Verify changes persisted in Unity (close and reopen scene)

---

### Step 5: Select GameObject (Unity Editor Sync)
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Enhance existing hierarchy click handler to also call `select_gameobject` tool, syncing Unity Editor selection with dashboard. Add context menu item "Select in Unity Editor" for explicit selection.

**Details:**
- Modify handleSelection() function to call `select_gameobject` tool
- Pass either instanceId or objectPath parameter
- Add "Select in Unity Editor" as first item in context menu
- Highlight selected object in hierarchy with border/background
- Provide visual feedback when selection succeeds
- Handle cases where GameObject no longer exists

**Testing:**
1. Click GameObject in dashboard hierarchy
2. Verify Unity Editor's hierarchy highlights the same object
3. Right-click → "Select in Unity Editor"
4. Verify Unity Editor Selection.activeGameObject updates
5. Test with nested GameObjects using path

---

### Step 6: Transform Editor (Position/Rotation/Scale)
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Create Transform component section in Inspector with editable Vector3 inputs for position, rotation, and scale. Implement `move_gameobject`, `rotate_gameobject`, `scale_gameobject` tool integrations with space (world/local) and mode (absolute/relative) controls.

**Details:**
- Create reusable Vector3 input component (3 number fields X/Y/Z)
- Add transform section to Inspector with three Vector3 editors:
  - Position with space selector (World/Local) and mode (Absolute/Relative)
  - Rotation with space selector (World/Local) and mode (Absolute/Relative)
  - Scale with mode (Absolute/Relative, always local space)
- Add "Set" button for each transform row
- Fetch current transform values from focused GameObject details
- Call appropriate tool (move/rotate/scale) with parameters
- Refresh Inspector after transform change
- Add input validation (numbers only, reasonable ranges)

**Testing:**
1. Focus GameObject with Transform component
2. Inspector shows current Position/Rotation/Scale values
3. Change Position X to 10 → mode: Absolute, space: World → click Set
4. Verify GameObject moves to X=10 in Unity scene
5. Change Rotation Y by 45 → mode: Relative, space: World → click Set
6. Verify GameObject rotates 45° around Y axis
7. Test Scale with Absolute mode
8. Test validation with non-numeric input

---

### Step 7: Reparent GameObject (Move To Parent)
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add "Move To Parent..." context menu item that opens modal with hierarchy tree picker. Implement `reparent_gameobject` tool integration with worldPositionStays option.

**Details:**
- Create hierarchy tree picker modal component
- Populate modal with current scene hierarchy (filterable/searchable)
- Add "None (Root Level)" option to move to scene root
- Add "Preserve World Position" checkbox (worldPositionStays parameter)
- Highlight current parent in tree
- On confirm, call `reparent_gameobject` with newParent path/ID
- Refresh hierarchy to show new parent-child relationship
- Handle edge cases (can't parent to self, can't parent to own child)

**Testing:**
1. Right-click GameObject → "Move To Parent..."
2. Modal shows hierarchy tree picker
3. Select new parent → check "Preserve World Position" → Confirm
4. Verify GameObject moves to new parent in hierarchy
5. Verify world position preserved in Unity scene
6. Test with "None" to move to root level
7. Test validation (can't select self as parent)

---

### Step 8: Scene Management (Load & Create Scene)
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add scene dropdown button to toolbar for loading scenes with additive mode support. Add "Create Scene" button that opens modal for new scene creation. Implement `load_scene` and `create_scene` tool integrations.

**Details:**
- Fetch available scenes from Unity (scan Assets folder or Build Settings)
- Create scene dropdown button in toolbar (📁 icon)
- Dropdown shows list of available scenes with current scene checked
- Add "Load Additive" checkbox in dropdown
- On scene selection, call `load_scene` with sceneName and additive parameters
- Add "+" button next to scene dropdown for creating new scenes
- Create scene modal with fields:
  - Scene name (required)
  - Folder path dropdown (Assets/Scenes, custom path)
  - "Add to Build Settings" checkbox
  - "Make Active" checkbox
- On confirm, call `create_scene` tool
- Refresh scene info and hierarchy after load/create

**Testing:**
1. Click scene dropdown → verify list of available scenes
2. Select different scene → verify scene loads in Unity
3. Check "Load Additive" → select scene → verify both scenes loaded
4. Click "+" button → modal appears
5. Enter scene name "TestScene" → select folder → check options → Create
6. Verify new scene created and appears in project
7. Test validation (duplicate name, invalid characters)

---

### Step 9: Component Editor (Inline Property Editing)
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add "Edit" button to each component in Inspector that expands inline editor for component properties. Implement `update_component` tool integration with JSON editing or form-based inputs for common component types.

**Details:**
- Add "Edit" button next to existing "Analyze" button in component headers
- On click, expand inline editor below component JSON display
- For simple types (bool, int, float, string), show form fields
- For complex types, show JSON editor with syntax highlighting
- Add "Apply" and "Cancel" buttons in edit mode
- Validate input before calling `update_component`
- Handle special cases:
  - Transform (already handled separately in Step 6)
  - Rigidbody: mass, drag, useGravity, isKinematic
  - Collider: size, center, isTrigger
- Refresh component display after successful update
- Show error messages for invalid values

**Testing:**
1. Focus GameObject with Rigidbody component
2. Click "Edit" button on Rigidbody
3. Inline editor appears with editable fields
4. Change mass to 5.0 → click Apply
5. Verify Rigidbody mass updates in Unity Inspector
6. Test during Play Mode for real-time physics tweaking
7. Test validation with invalid values (negative mass)
8. Test "Cancel" button abandons changes

---

### Step 10: Enhanced Context Menu & Polish
**Files:** 
- `Server~/src/ui/unity-dashboard.html`

**What:** Add remaining context menu items (keyboard shortcuts), improve visual feedback, add loading states, enhance error handling, and implement undo/redo notifications for complex operations.

**Details:**
- Add keyboard shortcut handlers:
  - Delete key → delete selected GameObject
  - Ctrl+D → duplicate selected GameObject
  - Ctrl+S → save scene
- Add loading spinners for tool calls in progress
- Add toast notifications for success/error feedback
- Improve context menu positioning (stay on screen)
- Add icons to context menu items
- Enhance visual feedback for tool operations:
  - Success: green flash/checkmark
  - Error: red flash with error message
  - In-progress: spinner/disabled state
- Add context menu separator lines for logical grouping
- Implement proper focus management (keyboard navigation)

**Testing:**
1. Select GameObject → press Delete key → confirm → verify deletion
2. Select GameObject → press Ctrl+D → verify duplication
3. Make changes → press Ctrl+S → verify scene saves
4. Test all context menu items have proper icons
5. Verify loading spinners appear during tool operations
6. Test error handling with invalid operations
7. Verify toast notifications appear and auto-dismiss

---

## Success Criteria

- ✅ Users can delete, duplicate, and reparent GameObjects via context menu
- ✅ Users can edit GameObject properties (name, tag, layer, active) in Inspector
- ✅ Users can precisely adjust Transform values with numerical inputs
- ✅ Users can save scenes and see dirty state indicator
- ✅ Users can load and create scenes without leaving dashboard
- ✅ Users can edit component properties inline with validation
- ✅ All operations sync with Unity Editor in real-time
- ✅ Keyboard shortcuts work for common operations
- ✅ Error handling provides clear user feedback
- ✅ Performance remains smooth during operations (< 1s response time)

## Future Enhancements (Not in This Plan)

- Multi-select in hierarchy (Shift+Click, Ctrl+Click)
- Drag-and-drop reparenting in hierarchy
- Asset browser panel for `add_asset_to_scene`
- Material editor for `assign_material` and `modify_material`
- Unload scene UI for multi-scene workflows
- Undo/Redo stack with Unity integration
- Component templates/presets
- Custom component property layouts
- Search/filter in hierarchy
- Bookmarks for frequently accessed GameObjects

## Notes

- All tool integrations should maintain compatibility with existing context push to agent
- Focus system (star button) should work alongside new selection system
- Existing auto-refresh polling should continue for read-only data
- Tool operations should trigger immediate refresh of affected data
- Consider debouncing rapid tool calls (e.g., transform slider)
- All destructive operations require confirmation modal
- Maintain backward compatibility with existing dashboard features
