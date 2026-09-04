---
name: svg-to-vue
description: SVG to Vue SFC. Use when the user needs to convert an SVG icon/file into an optimized Vue single-file component.
---

# SVG to Vue

Guide the agent through converting an SVG file into an optimized Vue single-file component (SFC).

## Workflow

### 1. Confirm or resolve the SVG file path

Ask the user for the SVG file path if not provided, or infer it from context. The file must be a `.svg` file.

### 2. Execute conversion

Run the conversion script from the project root:

```
pnpm exec jiti .agents/skills/svg-to-vue/scripts/svg-to-vue.ts <路径/至/图标.svg>
```

Example:

```
pnpm exec jiti .agents/skills/svg-to-vue/scripts/svg-to-vue.ts cache/icon.svg
```

### 3. Report result

- The script optimizes the SVG with SVGO and writes a `.vue` SFC with the same base name alongside the original SVG.
- Report the output path to the user.
- If the script exits with an error, report the error message.
