# GitHub Copilot Instructions

# Copilot Instructions

## Project Context
- This is a Next.js 15 + .NET 9 application
- We use React hooks with TypeScript
- React JSX uses camelCase for HTML attributes (e.g., `fetchPriority` not `fetchpriority`)

## Code Review Guidelines
- Don't suggest lowercase HTML attributes in JSX - React uses camelCase
- useMemo for return objects is acceptable for referential stability
- We intentionally use plain img tags for some images to bypass Next.js processing


## Branching and Merging Workflow

This project uses a three-tier branching strategy:

```
Master (production) ← develop (integration) ← feature/* branches
```

### Branch Purposes

| Branch | Purpose | Merges To |
|--------|---------|-----------|
| `Master` | Production-ready code (auto-deploys to Railway) | — |
| `develop` | Integration/staging branch for testing | `Master` (via PR) |
| `feature/*` | New features and bug fixes | `develop` (via PR) |

### Creating a Feature Branch

Always create feature branches from the latest `develop` branch:

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature
```

### Completing a Feature

When your feature is complete:

1. Commit all changes to your feature branch
2. Push your feature branch:
   ```powershell
   git push -u origin feature/my-new-feature
   ```
3. Create a Pull Request on GitHub: Base: `develop` ← Compare: `feature/my-new-feature`
4. After review, **Squash and merge** to keep history clean
5. Delete the feature branch after merge

### Merging develop to Master (Production Release)

**⚠️ Always get approval from the project owner before merging to Master.**

When `develop` is stable and tested:

1. Create a Pull Request on GitHub: Base: `Master` ← Compare: `develop`
2. Title the PR as `Release: [description]`
3. Review all changes since last release
4. **Create a merge commit** (preserves release history)
5. Railway auto-deploys to production

### Hotfix Workflow

For urgent production bugs only:

```powershell
git checkout Master
git pull origin Master
git checkout -b hotfix/fix-critical-bug
# Fix the bug, then push and create PR to Master
```

After merging hotfix to Master, also merge to develop:
```powershell
git checkout develop
git merge origin/Master
git push origin develop
```

## Viewing Merge History

- To see a history of merges and commits:
  ```powershell
  git log --oneline --graph --decorate --all
  ```
- This will show a visual representation of your branch and merge history.

---

_Use this workflow to keep your repository organized and your history clear._


## Git Best Practices

**Always get approval from the project owner before merging any branch into Master.**

1. **Write clear, concise commit messages**  
   - Use the imperative mood (“Add feature” not “Added” or “Adding”).
   - Summarize changes in the first line, optionally add details below.

2. **Pull before you push**
   - Always run `git pull origin develop` before pushing to avoid conflicts.

3. **Keep branches focused**
   - Each feature or fix should have its own branch. Avoid mixing unrelated changes.

4. **Most commits go to develop**
   - Feature branches merge to `develop` for integration testing.
   - Only merge `develop` to `Master` when ready for production release.5. **Review changes before committing**  
   - Use `git status` and `git diff` to review what you’re about to commit.

6. **Avoid committing sensitive data**  
   - Never commit API keys, passwords, or secrets.

7. **Use .gitignore**  
   - Ensure unnecessary files (build outputs, logs, etc.) are ignored.

8. **Push and merge frequently**
   - Don't let branches drift too far from develop; merge and push regularly.

9. **Get approval before merging to Master**  
   - Always get explicit OK from the project owner before merging any branch into Master.
