# Contributing

Thanks for contributing to WIMUT.

## Ground Rules

- Be respectful and constructive.
- Keep pull requests focused and small.
- Prefer clarity and demo reliability over broad refactors.
- Align changes with the hackathon rubric in `AGENTS.md`.

## Local Setup

```bash
npm install
npm run dev
```

Optional:

```bash
npm run helper
node relay.mjs --repo /abs/path/to/repo --prompt "Run tests and fix the first failure"
```

## Development Expectations

- Preserve existing behavior unless the change is intentional and documented.
- Keep simulator and replay paths working.
- Avoid introducing noisy UI behavior that hurts judge readability.
- Update docs when runtime behavior changes.

## Pull Request Checklist

1. Describe what changed and why.
2. Include testing notes (manual steps are fine for this project).
3. Call out any UX changes in simulator/live behavior.
4. Update docs (`README.md`, `docs/`, `AGENTS.md`) if needed.
5. Ensure license headers/notices remain intact.

## Reporting Issues

Please include:

- environment (OS, browser, Node version)
- exact command run
- expected behavior vs actual behavior
- logs or screenshots when possible
