# AGENTS.md

## Project Overview

teleskopio - is a kubernetes web dashboard.

### Stack

- Golang - Kubernetes golang client.
- React - responsive and modern frontend.
- [shadcn/ui](https://ui.shadcn.com/) + **Tailwind CSS** - clean and flexible UI components.
- [lucide.dev](https://lucide.dev/) - Beautiful & consistent icons.
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - powerful code editor with syntax highlighting.
- Dynamic resources - auto-loading resources for flexible navigation.
- Kubernetes watchers - instant updates from the cluster.

## Repository overview

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

## Notes

- This file is for agentic coding agents to follow
- Update this file as development practices evolve
- Add additional commands and guidelines as needed
