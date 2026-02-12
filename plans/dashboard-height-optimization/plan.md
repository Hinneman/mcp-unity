# Dashboard Height Optimization

**Branch:** `dashboard-height-optimization`
**Description:** Optimize Unity Dashboard for constrained MCP app height with compact layout and collapsible sections

## Goal
Improve the Unity Dashboard usability in MCP app embedded views where height is strictly constrained. The current dashboard uses excessive vertical space with fixed max-heights (hierarchy: 800px, inspector: 600px) and generous padding, making it difficult to use in typical MCP app contexts. This plan implements both immediate space savings (Option A: Compact Everything) and flexible user control (Option B: Collapsible Sections) while adopting Unity's native Inspector and Hierarchy visual design for a consistent, professional look.

## Problem Statement
The Unity Dashboard currently has several height-related issues:
- **Excessive max-heights**: Hierarchy (800px) and Inspector (600px) exceed typical MCP app viewport
- **Wasteful layout**: Scene info occupies a separate card above hierarchy
- **Generous spacing**: Body padding (16px), card padding (12px), and margins add unnecessary vertical space
- **No flexibility**: Users cannot adjust panel sizes or visibility to focus on their current task
- **Inconsistent styling**: Dashboard doesn't match Unity Editor's visual language, making it feel disconnected from the Unity experience

## Implementation Steps

### Step 1: Compact Layout (Option A)
**Files:** `Server~/src/ui/unity-dashboard.html`
**What:** Reduce all vertical spacing and consolidate layout for immediate space savings:
- Reduce body padding from 16px → 8px
- Reduce card padding from 12px → 8px
- Reduce header margin-bottom from 12px → 8px
- Reduce hierarchy max-height from 800px → 300px
- Reduce inspector max-height from 600px → 300px
- Merge Scene card into Hierarchy section header as inline metadata
- Tighten button spacing and control toolbar gaps
- Reduce section-title margin-bottom from 8px → 4px
**Testing:** 
1. Open dashboard with `show_unity_dashboard` tool
2. Verify all content is visible without scrolling page body
3. Verify hierarchy and inspector have proper internal scrolling
4. Confirm scene info displays inline in hierarchy header
5. Check that controls remain fully functional and clickable

### Step 2: Unity-Style Collapsible Sections (Option B)
**Files:** `Server~/src/ui/unity-dashboard.html`
**What:** Redesign sections to match Unity's Inspector and Hierarchy styling with native collapsible behavior:
- **Color scheme**: Replace current blue theme with Unity's dark grey palette (#383838 background, #2a2a2a cards, #1e1e1e inputs)
- **Section headers**: Style like Unity component headers with:
  - Triangle collapse indicator (▶ collapsed, ▼ expanded) matching Unity's style
  - Optional checkbox for enable/disable state (Inspector components)
  - Section icon on the left (optional)
  - Settings/options icon on the right (gear icon, shown on hover)
- **Hierarchy panel**: Match Unity's Hierarchy window:
  - Tree-style indentation for nested GameObjects
  - GameObject icons (cube, camera, light icons) before names
  - Triangle indicators for expandable nodes
  - Subtle hover background (#2c2c2c)
  - Selected state with Unity's blue highlight (#2c5d87)
- **Inspector panel**: Match Unity's Inspector layout:
  - Component sections with collapsible headers
  - Compact property grid layout
  - Input fields with Unity-style background (#191919)
  - Labels aligned left, values aligned right in grid
- **Collapse functionality**:
  - Triangle click toggles collapse (not entire header)
  - Smooth transitions matching Unity's animation speed (~150ms)
  - localStorage persistence for collapse states
  - Default: all panels expanded
**Testing:**
1. Compare side-by-side with Unity Editor Inspector/Hierarchy for visual consistency
2. Click triangle indicators to collapse/expand sections
3. Verify hover states match Unity's subtle feedback
4. Test with multiple components in Inspector
5. Verify hierarchy tree indentation and icons display correctly
6. Refresh dashboard and confirm collapse states persist
7. Check that selected GameObject highlight matches Unity's blue
Unity Visual Refinement & Polish
**Files:** `Server~/src/ui/unity-dashboard.html`
**What:** Final polish to match Unity Editor's visual fidelity:
- **Typography**: Use Unity's font stack (prefer system fonts: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- **Font sizes**: Match Unity's hierarchy (11px for tree items, 12px for inspector labels, 13px for headers)
- **Spacing**: Unity-consistent padding (4px for compact, 8px for standard, 2px for tight grid layouts)
- **Borders**: Match Unity's subtle separators (#1e1e1e, 1px solid)
- **Icons**: Replace custom icons with Unity-style monochrome icons:
  - GameObject icons: cube, camera, light (use CSS masks or inline SVG)
  - UI icons: gear for settings, triangle for collapse, eye for visibility
- **Focus states**: Unity-style blue outline (#5A9FFF) on keyboard focus
- **Component headers**: Match Inspector component styling exactly:
  - 24px height headers
  - Icon + checkbox + label + gear icon layout
  - Collapsible triangle (12x12px) with rotation animation
- **Property grid**: Inspector-style two-column layout:
  - Label column: 40% width, right-aligned text
  - Value column: 60% width, left-aligned inputs
- **Scrollbars**: Styled to match Unity's thin dark scrollbars
**Testing:**
1. Compare pixel-perfect alignment with Unity Inspector component headers
2. Verify font rendering matches Unity's text clarity
3. Test hierarchy tree icons align properly with text
4. Check all borders, shadows, and separators match Unity theme
5. Verify keyboard focus states are visible and match Unity's style
6. Test on different zoom levels for scaling consistency
7. Validate that all interactive elements maintain 24x24px minimum hit areats

### Step 4: Visual Refinement
**Files:** `Server~/src/ui/unity-dashboard.html`
**What:** Polish the compact and collapsible UI for optimal UX:
- Adjust component spacing within inspector to match compact theme
- Ensure focus indicators and hover states work with reduced padding
- Update collapse icons to use consistent SVG styling
- Add subtle visual feedback for collapsible section headers (hover state)
- Verify color contrast remains accessible with tighteUnity-themed styling:
- **Current colors** (to be replaced):
  - `--bg: #0b1220`, `--card: #07101a`, `--muted: #9fb1c9`, `--accent: #4fd1c5`
- **Unity-inspired colors** (new palette):
  - `--unity-bg: #383838` (main background)
  - `--unity-card: #2a2a2a` (panel/card background)
  - `--unity-input: #191919` (input field background)
  - `--unity-border: #1e1e1e` (subtle borders)
  - `--unity-text: #d2d2d2` (standard text)
  - `--unity-text-muted: #9b9b9b` (secondary text)
  - `--unity-hover: #2c2c2c` (hover state)
  - `--unity-selected: #2c5d87` (selected item)
  - `--unity-focus: #5A9FFF` (keyboard focus outline)
- Inline styles throughout (all CSS in `<style>` tag)
- No CSS preprocessor or external stylesheets

### Unity-Style Collapse Implementation Pattern
For collapsible sections matching Unity's Inspector, use this pattern:
```html
<div class="unity-component" data-section="transform">
  <div class="unity-component-header" role="button" aria-expanded="true">
    <svg class="collapse-triangle">
      <path d="M0 0 L6 4 L0 8 Z"/><!-- triangle pointing right when collapsed -->
    </svg>
    <input type="checkbox" class="component-toggle" checked />
    <svg class="component-icon"><!-- component-specific icon --></svg>
    <span class="component-title">Transform</span>
    <svg class="component-gear"><!-- gear icon, visible on hover --></svg>
  </div>
  <div class="unity-component-content">
    <!-- component properties in grid layout -->
  </div>
</div>
```
- `unity-dashboard-component-${name}-collapsed` (boolean per component)
- `unity-dashboard-hierarchy-expanded-nodes` (JSON array of expanded GameObject paths)

### Unity Color Reference
Based on Unity Editor 2022+ dark theme:
- **Panel backgrounds**: #383838 (main), #2a2a2a (secondary), #222222 (tertiary)
- **Input fields**: #191919 (background), #0D0D0D (border)
- **Text**: #d2d2d2 (primary), #9b9b9b (secondary/labels)
- **SeVisual design matches Unity Editor's Inspector and Hierarchy styling
- [ ] Color palette matches Unity 2022+ dark theme (#383838, #2a2a2a, etc.)
- [ ] Collapsible sections use Unity-style triangle indicators with rotation animation
- [ ] Hierarchy tree displays with proper indentation and GameObject icons
- [ ] Inspector components use Unity-style header layout (checkbox + icon + label + gear)
- [ ] Collapse state persists across dashboard reloads
- [ ] Selected GameObjects show Unity's blue highlight (#2c5d87)
- [ ] Hover states match Unity's subtle feedback (#2c2c2c)
- [ ] Typography matches Unity's font sizes and weights
- [ ] All interactive elements maintain 24x24px minimum hit area
- [ ] Keyboard focus shows Unity-style blue outline (#5A9FFF)
- [ ] Side-by-side comparison with Unity Editor shows visual consistency
- Collapsible headers should have `role="button"` and `aria-expanded` attribute
- Triangle indicators must be at least 12x12px with 24x24px click target
- Color contrast: Unity's #d2d2d2 text on #2a2a2a background = 10.5:1 (AAA compliant)
- Keyboard navigation: Tab through sections, Enter/Space to toggle collapse
- Screen readers: Announce "collapsed" or "expanded" state changes
    <svg class="expand-triangle"><!-- triangle if has children --></svg>
    <svg class="gameobject-icon"><!-- cube, camera, light icon --></svg>
    <span class="gameobject-name">Main Camera</span>
  </div>
</div>
<div class="hierarchy-node" data-depth="1"><!-- child, indented -->
### Collapse Implementation Pattern
For collapsible sections, use this pattern:
```html
<div class="card collapsible" data-section="hierarchy">
  <div class="section-header" onclick="toggleSection('hierarchy')">
    <span class="section-title">Hierarchy</span>
    <svg class="collapse-icon"><!-- chevron --></svg>
  </div>
  <div class="section-content">
    <!-- panel content -->
  </div>
</div>
```

### localStorage Keys
- `unity-dashboard-hierarchy-collapsed` (boolean)
- `unity-dashboard-inspector-collapsed` (boolean)

### Accessibility Considerations
- Collapsible headers should have `role="button"` and `aria-expanded` attribute
- Click targets must remain minimum 24x24px
- Color contrast must meet WCAG AA standards (current theme compliant)

## Success Criteria
- [ ] Dashboard fits in typical MCP app viewport without body scrolling
- [ ] Hierarchy and Inspector panels are collapsible with smooth transitions
- [ ] Collapse state persists across dashboard reloads
- [ ] All controls remain fully functional with reduced spacing
- [ ] Scene info is visible inline without dedicated card
- [ ] Focus/hover states work correctly with compact layout
- [ ] Minimum usable height maintained even when panels are collapsed

## Future Enhancements (Out of Scope)
- **Resizable panels**: Drag handles between hierarchy/inspector
- **Tab-based layout**: Alternative to side-by-side grid
- **Picture-in-picture mode**: Dedicated compact view
- **Keyboard shortcuts**: Collapse/expand with hotkeys
