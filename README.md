# AI Dev Team Starter Kit

AI Dev Team Starter Kit is a portable project template for developers who want AI assistance to behave like a small development team instead of an ad hoc chat window.

The human sets direction and makes final decisions. AI agents take specialized passes for product shaping, architecture, implementation, review, verification, and documentation.

## Core Promise

```text
Brief before Plan.
Plan before Build.
Review before Trust.
Verify before Ship.
```

## What's Included

- `AGENTS.md`: the main instruction surface for AI assistants.
- `docs/workflows/`: step-by-step workflow stages from idea intake to release.
- `docs/agents/`: role cards for product, architecture, implementation, review, testing, and documentation.
- `docs/templates/`: reusable task artifact templates.
- `docs/rituals/`: memorable collaboration checkpoints.
- `tasks/`: per-task working artifacts.
- `.omc/`: optional state and memory files for orchestration tools.

## Quick Start

1. Copy this template into a new repository.
2. Read `AGENTS.md` and adjust project-specific preferences.
3. Create a task folder under `tasks/<yyyy-mm-dd>-<slug>/`.
4. Start with `docs/templates/product-brief.md`.
5. Ask the AI to follow standard mode unless the task clearly qualifies for fast lane.
6. Keep review and verification as separate passes.
7. Record exact verification evidence before shipping.

## Standard Mode

```text
Intake -> Explore -> Plan -> Build -> Review -> Verify -> Ship
```

Use standard mode for multi-file changes, architecture decisions, dependency changes, user data, permissions, security, release work, or anything with meaningful product risk.

## Fast Lane

```text
Intake -> Plan -> Build -> Verify
```

Use fast lane for typo fixes, small README edits, simple text changes, and narrow configuration updates. The assistant must explain why fast lane is safe.

## Human Role

You are the final decision-maker. The AI team can explore, propose, implement, review, verify, and document, but it should not silently change scope or approve its own work.

## First Task Pattern

Create a folder like this:

```text
tasks/2026-05-26-build-notes-app/
+-- brief.md
+-- plan.md
+-- execution-log.md
+-- review.md
+-- verification.md
+-- release.md
```

Use the templates in `docs/templates/` to keep each artifact focused.
