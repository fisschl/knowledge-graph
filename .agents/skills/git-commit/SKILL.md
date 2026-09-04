---
name: git-commit
description: Git commit workflow using a commit message file. Use when the user needs to create a git commit, especially when the commit message must include both a summary and detailed body following the Scoped Commits standard.
---

# Git Commit

Guide the agent through creating standardized git commits by writing to `.cache/commit-message.txt` and committing with that file.

## Commit Message Format

```
<scope>: <description>

1. 变更项一
2. 变更项二
3. 变更项三

[optional trailer(s)]
```

## Workflow

### 1. Check if changes can be split

Review the working directory for unrelated changes that should be committed separately. Use `git status` and `git diff` to identify distinct logical changes. If multiple unrelated changes exist, stage and commit them one at a time. Each commit must represent a single logical change (e.g., a bug fix, a feature, a refactor). Do not mix unrelated changes in one commit.

### 2. Review recent commits

Run `git log --oneline -5` to understand the project's commit style and ensure consistency with existing messages.

### 3. Stage changes

If needed, stage the changes: `git add <files>`

### 4. Draft message

`.cache/commit-message.txt` may already exist from a previous commit; overwrite it directly when writing.

Write the commit message to `.cache/commit-message.txt` using Chinese.

1. Write the summary line: `<scope>: <中文 description>`
2. Add a blank line
3. Write the body as an ordered list (1. 2. 3.) describing specific changes, no blank lines between items
4. Add a blank line
5. Append any trailers as needed

### 5. Commit using the file

Execute: `git commit -F .cache/commit-message.txt`

### 6. Verify

Verify the commit and branch status:

- Check recent commits: `git log --oneline -5`
- Check current branch and sync status: `git status`

Do not push to remote unless the user explicitly requests it.
