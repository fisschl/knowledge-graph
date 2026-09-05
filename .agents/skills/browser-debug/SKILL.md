---
name: browser-debug
description: Debug a web page/UI with the globally installed agent-browser CLI, in an isolated git worktree forked to the system temp directory so the main project is never touched. Use when the user asks to debug, inspect, screenshot, or test the app (or any web page) in a real browser.
---

# Browser Debug (isolated git worktree)

调试/检查任何页面（通常是本项目 `pnpm dev` 跑起来的应用）都走这个流程：**先把项目分叉到系统临时目录的 git worktree，在 worktree 里起服务、用浏览器调试，绝不碰主项目目录**。结束时清理 worktree 与浏览器会话。

## 0. 前置条件

1. **agent-browser 必须可用**（用全局安装的版本，不在项目里装）：
   - 检查：`agent-browser --help`（或 `Get-Command agent-browser`）。
   - 未安装：`npm install -g agent-browser`，然后 `agent-browser install`（首次会下载它自带的 Chromium 到 `~/.agent-browser`，约 200MB）。
2. **主项目处于干净状态**：`git status --short` 应为空。若 worktree 需要未提交的改动，先把它们 commit（或 stash）到 `main`，否则 worktree 里看不到。
3. `git` 与 `pnpm` 可用。

## 1. 分叉 worktree 到系统临时目录

worktree 必须建在**系统临时目录**（Windows `$env:TEMP` / POSIX `$TMPDIR`），不能建在项目内部或用户主目录长期残留。

```powershell
# Windows（推荐，自动建分支+worktree）
$branch = "debug/browser-$(Get-Date -Format yyyyMMdd-HHmmss)"
$wt = Join-Path $env:TEMP "kg-browser-debug-$(Get-Date -Format yyyyMMdd-HHmmss)"
git -C C:\Users\15839\knowledge-graph worktree add -b $branch $wt HEAD
Set-Location $wt
pnpm install          # 共享 store，较快；必要时 pnpm install --offline
```

```bash
# POSIX
BRANCH="debug/browser-$(date +%Y%m%d-%H%M%S)"
WT="$(mktemp -d /tmp/kg-browser-debug-XXXXXX)"
git -C /path/to/knowledge-graph worktree add -b "$BRANCH" "$WT" HEAD
cd "$WT" && pnpm install
```

注意：`typed-router.d.ts` 已入库随 worktree 带出；`auto-imports.d.ts`/`components.d.ts` 被 gitignore，`pnpm dev` 启动时会自动重新生成，无需手动处理。

## 2. 在 worktree 里起 dev server（独立端口，后台任务）

```powershell
# 在 worktree 目录下，用独立端口避免与主项目任何服务冲突
pnpm dev --port 5199 --strictPort
```

用后台任务运行并记录 job id；确认监听成功后（等待 `Local: http://localhost:5199/`），再打开浏览器。

## 3. 用 agent-browser 调试

使用**独立命名会话**，避免抢走共享会话或其它 agent 的页面：

```powershell
$env:AGENT_BROWSER_SESSION = "debug-$(Get-Date -Format HHmmss)"
agent-browser open "http://localhost:5199/路径"
agent-browser snapshot -i        # 交互元素 + @ref
agent-browser eval "document.querySelectorAll('canvas').length"   # 任意 JS 检查
agent-browser screenshot "C:\Users\15839\AppData\Local\Temp\dbg.png"
agent-browser get text body      # 提取文本 / html / attr / count 等
agent-browser wait --load networkidle
```

常用调试手段：
- `eval` 返回表达式结果，可用来取 console 错误、元素计数、性能数字等。
- 渲染/布局问题用 `screenshot` 人工看图。
- 需要真实用户交互用 `snapshot -i` + `click`/`fill`/`press`。

## 4. 清理（必须做，不留残余）

```powershell
agent-browser close --all                      # 关浏览器会话（守护进程随后自退）
# 停掉 5199 端口的 dev server（kill 后台 job）
git -C C:\Users\15839\knowledge-graph worktree remove --force $wt
git -C C:\Users\15839\knowledge-graph branch -D $branch      # 删临时分支（仅当不打算合并）
```

## Guardrails（硬性约束）

- **主项目目录内禁止**任何文件写入、dev server、或浏览器相关缓存；所有改动只发生在 worktree。
- worktree 的路径、dev server 端口、agent-browser 会话都要**唯一**，不与主项目/其它 agent 冲突。
- 结束时确认主项目仍干净：`git -C <主项目> status --short` 为空。
- 若 worktree 里的改动确实有用：先 `git -C <主项目> merge $branch`（或 cherry-pick）回到主项目，再执行清理。
