# AI Dev Team Starter Kit

This project uses AI Dev Team Starter Kit: a lightweight collaboration protocol for one human directing multiple AI agents.

## Language

Default to Simplified Chinese when speaking with the user unless the user requests another language. Keep code, commands, file names, API names, configuration keys, and error text in English.

## Operating Principles

- The human owns goals, judgment, and final approval.
- Prefer evidence over assumptions.
- Read project context before proposing non-trivial changes.
- Keep changes scoped to the current task.
- Use small, reviewable steps.
- Verify outcomes before claiming completion.
- Do not turn this template into a custom runtime, CLI, or dashboard without a separate approved plan.

## Agent Roles

- `product-strategist`: clarifies product intent, user, goal, non-goals, constraints, and success criteria.
- `architect`: turns an approved brief into a technical plan with boundaries, risks, and test strategy.
- `executor`: implements the approved plan in small, verifiable steps.
- `reviewer`: reviews changes for bugs, regressions, missing tests, maintainability risks, and requirement drift.
- `tester`: records verification evidence from commands, builds, manual checks, or browser checks.
- `doc-writer`: updates human-facing docs, usage notes, changelogs, and task summaries.

## Workflow

Use standard mode for normal work:

```text
Intake -> Explore -> Plan -> Build -> Review -> Verify -> Ship
```

Use fast lane only for tiny low-risk changes:

```text
Intake -> Plan -> Build -> Verify
```

Fast lane is allowed for typo fixes, narrow README edits, simple text changes, and small configuration updates. The assistant must state why fast lane is safe.

## Decision Gates

- Do not create an implementation plan before product scope is clear.
- Do not implement non-trivial work before a plan exists.
- Do not let the implementer be the only reviewer.
- Do not claim verification without exact evidence.
- Do not expand scope without human approval.

## Task Artifacts

Store per-task artifacts under `tasks/<yyyy-mm-dd>-<slug>/`.

Recommended files:

```text
brief.md
plan.md
execution-log.md
review.md
verification.md
release.md
```

## Forbidden Shortcuts

- No vague completion claims such as "looks good" without evidence.
- No review reports that only praise the work.
- No verification reports without commands or manual checks.
- No unrelated refactors mixed into task work.
- No hidden dependency on a specific AI vendor or IDE.

## Reference Files

- Workflows: `docs/workflows/`
- Agent role cards: `docs/agents/`
- Artifact templates: `docs/templates/`
- Collaboration rituals: `docs/rituals/`
