# AI Dev Team Starter Kit Design

## Overview

AI Dev Team Starter Kit is a reusable project template for developers who want to direct multiple AI agents as a lightweight software team. The human keeps ownership of goals, judgment, and final approval. AI agents take specialized passes for product shaping, architecture, implementation, review, verification, and documentation.

The first version is not an automation platform. It is a readable, portable project protocol that can be copied into repositories used with Codex, Claude Code, Cursor, Gemini CLI, or similar coding agents. Automation can be added later by connecting the same files and workflows to orchestration tools such as oh-my-Codex.

Core promise:

```text
Brief before Plan.
Plan before Build.
Review before Trust.
Verify before Ship.
```

## Target User

The target user is a solo developer, solo founder, technical lead, or advanced learner who wants AI assistance to behave less like ad hoc chat and more like a disciplined development team.

The template is especially useful when:

- A project involves more than one file or more than one decision.
- Requirements are still fuzzy and need product clarification.
- Code changes need review and verification instead of immediate trust.
- The user wants reusable prompts, task artifacts, and review habits across projects.

## Goals

- Provide a standard `AGENTS.md` entry point that explains project collaboration rules to AI tools.
- Define a small set of durable agent roles with clear responsibilities and boundaries.
- Define a staged workflow from idea intake to release.
- Provide templates for task briefs, implementation plans, reviews, verification reports, and release checklists.
- Keep the system lightweight enough to use on small projects without becoming process-heavy.

## Non-Goals

- Build a custom agent runtime in the first version.
- Require a specific vendor, model, IDE, or orchestration framework.
- Replace human judgment on product, architecture, or release decisions.
- Create a large process manual that agents and humans will not read.
- Automate deployment, CI, billing, auth, or project-specific infrastructure.

## Proposed Repository Structure

```text
.
+-- AGENTS.md
+-- README.md
+-- docs/
|   +-- workflows/
|   |   +-- 00-intake.md
|   |   +-- 01-explore.md
|   |   +-- 02-plan.md
|   |   +-- 03-build.md
|   |   +-- 04-review.md
|   |   +-- 05-verify.md
|   |   +-- 06-ship.md
|   +-- agents/
|   |   +-- product-strategist.md
|   |   +-- architect.md
|   |   +-- executor.md
|   |   +-- reviewer.md
|   |   +-- tester.md
|   |   +-- doc-writer.md
|   +-- templates/
|   |   +-- product-brief.md
|   |   +-- implementation-plan.md
|   |   +-- review-report.md
|   |   +-- verification-report.md
|   |   +-- release-checklist.md
|   +-- rituals/
|       +-- architect-pass.md
|       +-- builder-sprint.md
|       +-- review-court.md
|       +-- red-team-run.md
|       +-- ship-bell.md
+-- tasks/
|   +-- .gitkeep
+-- .omc/
    +-- notepad.md
    +-- project-memory.json
```

## File Responsibilities

`AGENTS.md` is the main instruction surface for AI tools. It defines the collaboration model, default language, role boundaries, workflow stages, verification rules, and forbidden shortcuts.

`README.md` explains how a human adopts the starter kit in a new repository and how to run a task through the workflow.

`docs/workflows/` contains the operational stages. Each file describes the stage purpose, required inputs, expected outputs, stopping condition, and escalation rules.

`docs/agents/` contains role cards. Each role card includes mission, inputs, outputs, boundaries, common mistakes, and completion standards.

`docs/templates/` contains reusable task artifact templates. These keep agent output structured and make review easier.

`docs/rituals/` gives memorable names to important collaboration moments without replacing the plain workflow files.

`tasks/` stores per-task artifacts. A typical task folder looks like:

```text
tasks/2026-05-26-build-notes-app/
+-- brief.md
+-- plan.md
+-- execution-log.md
+-- review.md
+-- verification.md
```

`.omc/` is an optional enhancement layer for orchestration state, memory, and planning metadata. The starter kit must remain useful even when `.omc/` is ignored by a tool.

## Agent Roles

The first version uses six core roles.

### product-strategist

Turns a fuzzy idea into a clear product brief. It defines target user, problem, goal, non-goals, constraints, success criteria, and open questions. It does not choose implementation details or write production code.

### architect

Turns an approved brief into a technical plan. It defines module boundaries, file scope, data flow, dependencies, risks, test strategy, and rollback approach. It does not perform the main implementation pass.

### executor

Implements the approved plan in small, verifiable steps. It keeps changes scoped, follows local project patterns, and records meaningful execution notes. It does not approve its own work or expand scope without human approval.

### reviewer

Reviews completed changes with a bias toward finding real problems. It prioritizes bugs, regressions, missing tests, unclear boundaries, maintainability risks, and requirement drift. It does not write generic praise or treat review as approval theater.

### tester

Collects verification evidence. It runs appropriate commands, records exact results, identifies gaps, and confirms manual checks when needed. It does not claim success without evidence.

### doc-writer

Maintains human-facing project understanding. It updates README content, usage notes, changelog entries, and task summaries. It does not replace review or verification.

## Collaboration Rules

- The human is the final decision-maker.
- Product scope must be clarified before technical planning.
- Technical planning must happen before non-trivial implementation.
- The implementer must not be the only reviewer.
- Verification must include actual evidence, not confidence language.
- Documentation should explain the result and usage, not market the project.
- Related improvements are allowed when they serve the current task; unrelated refactors are not.

## Workflow

### 0. Intake

Capture the request and create the initial task folder. The output is a brief draft that names the problem, user, goal, non-goals, success criteria, constraints, and open questions.

Stopping condition: the task is concrete enough to explore or plan.

### 1. Explore

Read the existing repository, docs, recent commits, and relevant constraints before proposing implementation. The output is exploration notes that identify likely files, patterns, risks, and questions needing human judgment.

Stopping condition: the agent understands the local context well enough to plan.

### 2. Plan

Create an implementation plan with proposed approach, files to change, data flow, risks, test plan, and rollback plan.

Stopping condition: the human approves the plan, or the task is small enough for an explicitly documented fast lane.

### 3. Build

Implement the approved plan in small steps. Record important choices, deviations from the plan, and commands run during development.

Stopping condition: the implementation appears complete and is ready for independent review.

### 4. Review

Review changes independently. Findings should lead, ordered by severity, and each finding should include concrete file references where possible.

Stopping condition: severe issues are fixed, and remaining risks are accepted or documented.

### 5. Verify

Run tests, builds, linting, browser checks, or manual checks appropriate to the change. Record the exact commands and outcomes.

Stopping condition: verification evidence supports shipping, or the gaps are clearly documented and accepted.

### 6. Ship

Prepare the release decision. Confirm documentation, known risks, rollback notes, and next steps.

Stopping condition: the human has enough information to ship, defer, or continue.

## Modes

### Standard Mode

Use this for normal work:

```text
Intake -> Explore -> Plan -> Build -> Review -> Verify -> Ship
```

Standard mode is required for multi-file changes, architecture decisions, dependency changes, user data, permissions, security, release work, or anything with meaningful product risk.

### Fast Lane

Use this for tiny low-risk changes:

```text
Intake -> Plan -> Build -> Verify
```

Fast lane is appropriate for typo fixes, small README edits, simple text changes, and narrow configuration updates. The agent must state why fast lane is appropriate.

## Template Contents

### product-brief.md

```markdown
# Product Brief

## Problem
## User
## Goal
## Non-goals
## Success Criteria
## Constraints
## Open Questions
```

### implementation-plan.md

```markdown
# Implementation Plan

## Context
## Proposed Approach
## Files to Change
## Data Flow
## Risks
## Test Plan
## Rollback Plan
## Approval
```

### review-report.md

```markdown
# Review Report

## Findings
## Severity
## File References
## Missing Tests
## Questions
## Verdict
```

### verification-report.md

```markdown
# Verification Report

## Commands Run
## Results
## Manual Checks
## Known Gaps
## Final Status
```

### release-checklist.md

```markdown
# Release Checklist

## Scope Confirmed
## Tests Passing
## Docs Updated
## Risks Known
## Rollback Notes
## Ship Decision
```

## Rituals

Ritual names make the workflow easier to remember. They should supplement the plain workflow, not obscure it.

- Architect Pass: the design checkpoint before implementation.
- Builder Sprint: the focused implementation pass.
- Review Court: the independent review checkpoint.
- Red Team Run: an adversarial verification pass for failure paths.
- Ship Bell: the final release confirmation.

## Success Criteria

The first version is successful when a user can copy the starter kit into a new repository and complete a task with:

- A clear brief before implementation.
- A clear plan before coding.
- A separate review artifact.
- A verification artifact with actual command results or manual check evidence.
- A README that explains how to use the template.
- Minimal friction for small tasks through fast lane.

## Implementation Boundary

The next implementation phase should create the starter kit files and skeleton content only. It should not build custom automation, CLIs, web dashboards, or agent runtimes. Those can become follow-up projects after the template proves useful in real repositories.
