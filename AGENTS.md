# AGENTS.md

## Project Overview

teleskopio - is a kubernetes web dashboard.

## Stack

- Golang - Kubernetes golang client.
- React - responsive and modern frontend.
- [shadcn/ui](https://ui.shadcn.com/) + **Tailwind CSS** - clean and flexible UI components.
- [lucide.dev](https://lucide.dev/) - Beautiful & consistent icons.
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - powerful code editor with syntax highlighting.
- Dynamic resources - auto-loading resources for flexible navigation.
- Kubernetes watchers - instant updates from the cluster.

## Repository overview

- **Entry point**: `main.go` file in the project root.
- **Source code**: `pkg/` contains the main application code organized by features.
- **Frontend**: `frontend/` for UI components, pages.
- **Presentation**: `lib/presentation/` for UI components, pages, and state management.
- **Assets**: `assets/` for images, icons, fonts, and other static resources not related to project.

## Makefile commands

- `make help` - List all available targets
- `make build` - Build Go binaries with versioning
- `make test` - Run Go tests with race detection
- `make lint` - Lint Go code with golangci-lint
- `make lint-fronend` - Lint frontend code
- `make clean` - Remove build artifacts
- `make run-backend` - Run the backend server
- `make build-frontend` - Build frontend assets
- `make run-frontend` - Run frontend development server

These targets can be invoked via `make <target>` as needed during development and testing.

## Commit Messages

Follow Conventional Commits:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `coauth`: Co-authored changes (e.g., "Co-authored-by: LLM <basename of LLM>")
- Example: `fix(core): format New function to pass gofumpt (coauth: Qwen3)`

## Pull request guidelines

- PR titles must start with a category prefix describing the change: `bug:`, `feat:`, `docs:`, or `chore:`.
- Generated PR titles and bodies must summarize the _entire_ set of changes on the branch (for example, based on `git log --oneline <base>..HEAD` or the full diff), **not** just the latest commit. The Summary section should reflect all modifications that will be merged.

## Programmatic checks

Before presenting final changes or submitting a pull request, run each of the
following commands and ensure they succeed. Include the command outputs in your
final response to confirm they were executed:

```bash
make lint
make lint-frontend
```

All checks must pass before the generated code can be merge

## Bash Guidelines

### IMPORTANT: Avoid commands that cause output buffering issues

- DO NOT pipe output through head, tail, less, or more when monitoring or checking command output
- DO NOT use `head -n X` or `tail -n X` to truncate output - these cause buffering problems
- Instead, let commands complete fully, or use flags if the command supports them
- For log monitoring, prefer reading files directly rather than piping through filters

### When checking command output:

- Run commands directly without pipes when possible
- If you need to limit output, use command-specific flags (e.g., `git log -n 10` instead of `git log | head -10`)
- Avoid chained pipes that can cause output to buffer indefinitely

## Notes

- This file is for agentic coding agents to follow
- Update this file as development practices evolve
- Add additional commands and guidelines as needed
