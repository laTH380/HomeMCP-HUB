# Contributing

Thank you for considering a contribution to HomeMCP-HUB.

## Development Setup

```bash
npm install
npm run build
npm test
```

## Pull Request Guidelines

- Keep changes focused.
- Add or update tests for behavior changes.
- Update documentation when public behavior, configuration, or plugin APIs change.
- Keep plugin capabilities namespaced through the hub instead of hard-coding published names in plugins.
- Do not commit generated `dist/`, `node_modules/`, logs, or local environment files.

## Code Style

- TypeScript should compile with `strict` enabled.
- Prefer explicit errors for unknown tools, resources, and prompts.
- Keep plugin-specific logic inside the plugin.
- Keep shared behavior in `src/core` only when more than one plugin needs it.

## Reporting Issues

When reporting an issue, include:

- Node.js version
- operating system
- HomeMCP-HUB version or commit
- configuration snippet, with secrets removed
- exact command and error output
