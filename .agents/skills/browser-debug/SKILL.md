---
name: browser-debug
description: Debug a web page/UI with the globally installed agent-browser CLI, directly in the current project. Debug-code changes stay in the project; only standalone verification scripts and browser screenshots go to the system temp directory. Use when the user asks to debug, inspect, screenshot, or test the app (or any web page) in a real browser.
---

# Browser Debug (直接在当前项目调试)

调试/检查页面（通常是本项目 `pnpm dev` 跑起来的应用）直接在当前项目进行：**调试代码的改动可以直接改当前项目文件**（正常走 git 管理）；只有**独立的验证脚本**和**浏览器截图**等一次性产物放到系统临时目录，不污染项目。

## 0. 前置条件

1. **agent-browser 必须可用**（用全局安装的版本，不在项目里装）：
   - 检查：`agent-browser --help`（或 `Get-Command agent-browser`）。
   - 未安装：`npm install -g agent-browser`，然后 `agent-browser install`（首次会下载它自带的 Chromium 到 `~/.agent-browser`，约 200MB）。
2. `pnpm` 可用。

## 1. 先检查用户是否已启动 dev server

**先探测，不要盲目起服务**，避免和用户自己起的端口打架：

```powershell
# 常见 vite 端口探测（默认 5173；被占用会 +1，可顺带测 5174/4173）
Test-NetConnection localhost -Port 5173 -InformationLevel Quiet
# 或直接请求页面确认可访问（base 路径 /knowledge-graph/）
try { (Invoke-WebRequest "http://localhost:5173/knowledge-graph/" -UseBasicParsing -TimeoutSec 3).StatusCode } catch { "not running" }
```

- 若 5173/5174 等端口已在监听 → **直接使用用户的 dev server**，不要重复起，也**不要 kill**（结束调试时它属于用户，保留）。
- 若探测不到、用户也没给 URL → 由 agent 在当前项目**额外启动**：

```powershell
pnpm dev   # vite 默认端口 5173（被占用自动 +1），base 路径 /knowledge-graph/
```

用后台任务运行并记录 job id；等待出现 `Local: http://localhost:5173/knowledge-graph/`（或实际端口）后再打开浏览器。**自己起的服务，结束调试时要 kill 掉**。

## 2. 用 agent-browser 调试

使用**独立命名会话**，避免抢走共享会话或其它 agent 的页面：

```powershell
$env:AGENT_BROWSER_SESSION = "debug-$(Get-Date -Format HHmmss)"
agent-browser open "http://localhost:5173/knowledge-graph/"
agent-browser snapshot -i        # 交互元素 + @ref
agent-browser eval "document.querySelectorAll('canvas').length"   # 任意 JS 检查
agent-browser get text body      # 提取文本 / html / attr / count 等
agent-browser wait --load networkidle
```

常用调试手段：
- `eval` 返回表达式结果，可用来取 console 错误、元素计数、性能数字等。
- 渲染/布局问题用 `screenshot` 人工看图（**截图必须存到系统临时目录**）。
- 需要真实用户交互用 `snapshot -i` + `click`/`fill`/`press`。

## 3. 产物放哪

- **独立验证脚本**（一次性 `.js/.mjs/.html` 等，验证某个假设/测量性能）→ 放**系统临时目录**：
  ```powershell
  $tmp = Join-Path $env:TEMP "kg-debug-$(Get-Date -Format yyyyMMdd-HHmmss)"
  New-Item -ItemType Directory -Path $tmp   # 用完删除
  ```
- **浏览器截图** → 同样放系统临时目录，例如 `Join-Path $env:TEMP "dbg.png"`。
- **调试代码本身的改动**（改 `src/...`、改逻辑）→ 直接在当前项目改，这是正常开发流程，不要搬到临时目录。

## 4. 清理（不留残余）

```powershell
agent-browser close --all                      # 关浏览器会话（守护进程随后自退）
# 只 kill 你自己启动的 dev server job；用户自己起的服务一律不动
Remove-Item -Recurse -Force $tmp               # 删除临时脚本/截图目录
```

## Guardrails（硬性约束）

- 一次性产物（验证脚本、截图、临时 html）只放**系统临时目录**，验证后删除；**不要**把这类文件写进项目目录。
- 用户已启动的 dev server：直接用，不重复起、不 kill；agent 自己起的才由 agent 收尾 kill。
- 项目内只留调试代码本身的修改（走正常 git 流程），结束时 `git status --short` 应只反映这些代码改动，没有零散临时文件。
