# GitHub Copilot Instructions

## Branching and Merging Workflow

- Always create a new feature branch from the latest `Master` branch for new features or bug fixes.
- When your feature is complete, commit all changes to your feature branch.
- To merge your feature branch into `Master`:
  1. Switch to the `Master` branch:
     ```powershell
     git checkout Master
     ```
  2. Pull the latest changes from the remote:
     ```powershell
     git pull origin Master
     ```
  3. Merge your feature branch:
     ```powershell
     git merge <feature-branch-name>
     ```
  4. Push the updated `Master` branch to GitHub:
     ```powershell
     git push origin Master
     ```
- After merging, you can delete the feature branch locally and remotely if desired:
  ```powershell
  git branch -d <feature-branch-name>
  git push origin --delete <feature-branch-name>
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
   - Always run `git pull origin Master` before pushing to avoid conflicts.

3. **Keep branches focused**  
   - Each feature or fix should have its own branch. Avoid mixing unrelated changes.

4. **Rebase for a clean history (optional for advanced users)**  
   - Use `git rebase` to keep a linear history, but only rebase local branches.

5. **Review changes before committing**  
   - Use `git status` and `git diff` to review what you’re about to commit.

6. **Avoid committing sensitive data**  
   - Never commit API keys, passwords, or secrets.

7. **Use .gitignore**  
   - Ensure unnecessary files (build outputs, logs, etc.) are ignored.

8. **Push and merge frequently**  
   - Don’t let branches drift too far from Master; merge and push regularly.

9. **Get approval before merging to Master**  
   - Always get explicit OK from the project owner before merging any branch into Master.
