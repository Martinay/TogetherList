# Git Workflow

1. **Branch Naming**: Use `feature/<task-id>-<description>` or `fix/<task-id>-<description>`.
2. **Commit Messages**: Use conventional commits format: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore
3. **Atomic Commits**: Each commit should represent one logical change.
4. **Never Force Push**: Do not force push to shared branches.
5. **No Automatic Commits**: The agent must NOT commit code automatically. It should only suggest commits and provide commit messages for the user to execute.
