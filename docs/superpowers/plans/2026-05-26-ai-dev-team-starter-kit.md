# AI Dev Team Starter Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of AI Dev Team Starter Kit as a portable Markdown-based project template for one human directing multiple AI agents.

**Architecture:** This is a documentation and template repository. `AGENTS.md` acts as the main AI instruction surface, `README.md` explains human usage, and `docs/` holds focused workflow, role, template, and ritual files. The first version intentionally avoids custom automation, CLI code, dashboards, or runtime agent orchestration.

**Tech Stack:** Markdown, Git, plain text files, optional oh-my-Codex state files under `.omc/`.

---

## File Map

- Create `AGENTS.md`: project-level operating instructions for AI assistants.
- Create `README.md`: human-facing adoption and usage guide.
- Create `docs/workflows/00-intake.md`: intake stage.
- Create `docs/workflows/01-explore.md`: exploration stage.
- Create `docs/workflows/02-plan.md`: planning stage.
- Create `docs/workflows/03-build.md`: implementation stage.
- Create `docs/workflows/04-review.md`: review stage.
- Create `docs/workflows/05-verify.md`: verification stage.
- Create `docs/workflows/06-ship.md`: release decision stage.
- Create `docs/agents/product-strategist.md`: product role card.
- Create `docs/agents/architect.md`: architecture role card.
- Create `docs/agents/executor.md`: implementation role card.
- Create `docs/agents/reviewer.md`: review role card.
- Create `docs/agents/tester.md`: verification role card.
- Create `docs/agents/doc-writer.md`: documentation role card.
- Create `docs/templates/product-brief.md`: task brief template.
- Create `docs/templates/implementation-plan.md`: implementation plan template.
- Create `docs/templates/review-report.md`: review report template.
- Create `docs/templates/verification-report.md`: verification report template.
- Create `docs/templates/release-checklist.md`: release checklist template.
- Create `docs/rituals/architect-pass.md`: design checkpoint ritual.
- Create `docs/rituals/builder-sprint.md`: implementation ritual.
- Create `docs/rituals/review-court.md`: review ritual.
- Create `docs/rituals/red-team-run.md`: adversarial verification ritual.
- Create `docs/rituals/ship-bell.md`: final release ritual.
- Create `tasks/.gitkeep`: keeps the task artifact directory in Git.
- Create `.omc/notepad.md`: optional project notes for orchestration tools.
- Create `.omc/project-memory.json`: optional structured memory seed.

## Verification Strategy

This project has no application runtime, so verification is file-structure and content based.

- Use `git status --short` to confirm expected files are created.
- Use `Test-Path` for required files and directories.
- Use `Select-String` to scan for forbidden red-flag markers such as unfinished work notes.
- Use `Select-String` to scan for non-ASCII characters, keeping files portable across Windows shells and AI tooling.
- Use `git diff --check` to catch whitespace errors.

---

### Task 1: Create Root Instructions And Human Guide

**Files:**
- Create: `AGENTS.md`
- Create: `README.md`

- [ ] **Step 1: Create `AGENTS.md`**

Create `AGENTS.md` with this exact content:

```markdown
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
```

- [ ] **Step 2: Create `README.md`**

Create `README.md` with this exact content:

```markdown
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
```

- [ ] **Step 3: Verify root guide files**

Run:

```powershell
Test-Path -LiteralPath 'AGENTS.md'
Test-Path -LiteralPath 'README.md'
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
Select-String -Path 'AGENTS.md','README.md' -Pattern $markers -CaseSensitive:$false
Select-String -Path 'AGENTS.md','README.md' -Pattern '[^\x00-\x7F]'
```

Expected:

```text
True
True
```

The two `Select-String` commands should return no matches.

- [ ] **Step 4: Commit Task 1**

Run:

```powershell
git add -- AGENTS.md README.md
git commit -m 'Add starter kit root guides'
```

Expected: commit succeeds.

---

### Task 2: Create Artifact Templates

**Files:**
- Create: `docs/templates/product-brief.md`
- Create: `docs/templates/implementation-plan.md`
- Create: `docs/templates/review-report.md`
- Create: `docs/templates/verification-report.md`
- Create: `docs/templates/release-checklist.md`

- [ ] **Step 1: Create `docs/templates/product-brief.md`**

Create `docs/templates/product-brief.md` with this exact content:

```markdown
# Product Brief

## Problem

Describe the problem in one or two concrete paragraphs.

## User

Name the user or user group this task serves.

## Goal

State the outcome this task should produce.

## Non-goals

- List scope that is intentionally excluded.
- List adjacent ideas that should not be implemented in this task.

## Success Criteria

- State observable conditions that mean the task worked.
- Include user-visible behavior when relevant.

## Constraints

- List technical, product, time, platform, or compatibility constraints.

## Open Questions

- List decisions that need human input before planning or implementation.
```

- [ ] **Step 2: Create `docs/templates/implementation-plan.md`**

Create `docs/templates/implementation-plan.md` with this exact content:

```markdown
# Implementation Plan

## Context

Summarize the approved brief and repository context.

## Proposed Approach

Explain the implementation approach in concrete steps.

## Files to Change

- `path/to/file`: explain why this file changes.

## Data Flow

Describe how data, control, or user actions move through the changed system.

## Risks

- Name the risk.
- Describe how the plan reduces or exposes the risk.

## Test Plan

- Command or manual check: expected result.

## Rollback Plan

Describe how to revert or disable the change if it fails.

## Approval

Record who approved the plan and when.
```

- [ ] **Step 3: Create `docs/templates/review-report.md`**

Create `docs/templates/review-report.md` with this exact content:

```markdown
# Review Report

## Findings

List findings first, ordered by severity. Use file references when possible.

## Severity

- P0: blocks release or causes data loss, security failure, or total breakage.
- P1: serious bug or regression that should be fixed before release.
- P2: maintainability, edge case, or test coverage issue.
- P3: small cleanup or polish.

## File References

- `path/to/file:line`: explain the issue.

## Missing Tests

List behavior that is not covered by automated or manual verification.

## Questions

List questions that affect correctness, scope, or release confidence.

## Verdict

Choose one: approved, approved with risks, changes requested, blocked.
```

- [ ] **Step 4: Create `docs/templates/verification-report.md`**

Create `docs/templates/verification-report.md` with this exact content:

```markdown
# Verification Report

## Commands Run

```text
command
```

## Results

Record exact outcomes, including pass or fail status.

## Manual Checks

- Check performed: observed result.

## Known Gaps

- Gap: why it remains and who accepted it.

## Final Status

Choose one: verified, verified with gaps, failed, blocked.
```

- [ ] **Step 5: Create `docs/templates/release-checklist.md`**

Create `docs/templates/release-checklist.md` with this exact content:

```markdown
# Release Checklist

## Scope Confirmed

- The shipped scope matches the approved brief.

## Tests Passing

- Verification evidence is recorded in `verification.md`.

## Docs Updated

- User-facing or contributor-facing documentation is current.

## Risks Known

- Remaining risks are documented and accepted.

## Rollback Notes

- Revert or disable path is documented.

## Ship Decision

Choose one: ship, defer, continue implementation, cancel.
```

- [ ] **Step 6: Verify artifact templates**

Run:

```powershell
$files = @(
  'docs/templates/product-brief.md',
  'docs/templates/implementation-plan.md',
  'docs/templates/review-report.md',
  'docs/templates/verification-report.md',
  'docs/templates/release-checklist.md'
)
$files | ForEach-Object { Test-Path -LiteralPath $_ }
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
Select-String -Path $files -Pattern $markers -CaseSensitive:$false
Select-String -Path $files -Pattern '[^\x00-\x7F]'
```

Expected: five `True` lines, then no `Select-String` matches.

- [ ] **Step 7: Commit Task 2**

Run:

```powershell
git add -- docs/templates
git commit -m 'Add starter kit artifact templates'
```

Expected: commit succeeds.

---

### Task 3: Create Agent Role Cards

**Files:**
- Create: `docs/agents/product-strategist.md`
- Create: `docs/agents/architect.md`
- Create: `docs/agents/executor.md`
- Create: `docs/agents/reviewer.md`
- Create: `docs/agents/tester.md`
- Create: `docs/agents/doc-writer.md`

- [ ] **Step 1: Create `docs/agents/product-strategist.md`**

Create `docs/agents/product-strategist.md` with this exact content:

```markdown
# product-strategist

## Mission

Turn fuzzy intent into a clear task brief.

## Inputs

- User request
- Existing product context
- Previous task artifacts

## Outputs

- `brief.md`
- Open questions for the human

## Boundaries

- Do not choose implementation details.
- Do not write production code.
- Do not expand the problem beyond the user's goal.

## Common Mistakes

- Treating a vague idea as ready for implementation.
- Turning product clarification into technical design.
- Adding nice-to-have features that are not part of the goal.

## Completion Standard

The brief names the problem, user, goal, non-goals, success criteria, constraints, and open questions.
```

- [ ] **Step 2: Create `docs/agents/architect.md`**

Create `docs/agents/architect.md` with this exact content:

```markdown
# architect

## Mission

Turn an approved brief into a concrete implementation plan.

## Inputs

- Approved `brief.md`
- Repository structure
- Existing code and docs
- Project constraints

## Outputs

- `plan.md`
- Risk notes
- Test strategy

## Boundaries

- Do not perform the main implementation pass.
- Do not hide uncertainty.
- Do not plan unrelated refactors.

## Common Mistakes

- Designing more system than the task needs.
- Skipping local codebase conventions.
- Writing a plan that cannot be verified.

## Completion Standard

The plan identifies files, approach, data flow, risks, test plan, rollback path, and approval status.
```

- [ ] **Step 3: Create `docs/agents/executor.md`**

Create `docs/agents/executor.md` with this exact content:

```markdown
# executor

## Mission

Implement the approved plan in small, verifiable steps.

## Inputs

- Approved `plan.md`
- Repository code
- Task constraints

## Outputs

- Code or document changes
- `execution-log.md`

## Boundaries

- Do not approve your own work.
- Do not silently change scope.
- Do not mix unrelated cleanup into the task.

## Common Mistakes

- Implementing before reading local patterns.
- Making broad rewrites for a narrow task.
- Claiming completion before verification.

## Completion Standard

The requested change is implemented, deviations are recorded, and the work is ready for independent review.
```

- [ ] **Step 4: Create `docs/agents/reviewer.md`**

Create `docs/agents/reviewer.md` with this exact content:

```markdown
# reviewer

## Mission

Find real problems before the work is trusted.

## Inputs

- Brief
- Plan
- Diff
- Test or verification output

## Outputs

- `review.md`
- Findings with severity and file references

## Boundaries

- Do not write generic praise.
- Do not approve without reading the diff.
- Do not treat missing tests as invisible.

## Common Mistakes

- Summarizing the change instead of reviewing it.
- Ignoring requirement drift.
- Reporting style preferences as serious defects.

## Completion Standard

Findings are ordered by severity, grounded in evidence, and include open questions or residual risks.
```

- [ ] **Step 5: Create `docs/agents/tester.md`**

Create `docs/agents/tester.md` with this exact content:

```markdown
# tester

## Mission

Collect evidence that the work behaves as intended.

## Inputs

- Brief
- Plan
- Review notes
- Project test commands

## Outputs

- `verification.md`
- Exact command results
- Manual check results

## Boundaries

- Do not claim success without evidence.
- Do not ignore failed or skipped checks.
- Do not let confidence replace output.

## Common Mistakes

- Running only the easiest check.
- Reporting expected behavior instead of observed behavior.
- Omitting known gaps.

## Completion Standard

Verification records commands, results, manual checks, known gaps, and final status.
```

- [ ] **Step 6: Create `docs/agents/doc-writer.md`**

Create `docs/agents/doc-writer.md` with this exact content:

```markdown
# doc-writer

## Mission

Make the project and task outcome understandable to humans.

## Inputs

- Brief
- Plan
- Implementation notes
- Review and verification results

## Outputs

- README updates
- Usage notes
- Changelog entries
- Task summaries

## Boundaries

- Do not replace review or verification.
- Do not write marketing copy when usage guidance is needed.
- Do not hide limitations.

## Common Mistakes

- Explaining features without explaining how to use them.
- Forgetting setup or verification details.
- Turning known gaps into vague optimism.

## Completion Standard

Documentation explains what changed, how to use it, and what limitations remain.
```

- [ ] **Step 7: Verify agent role cards**

Run:

```powershell
$files = @(
  'docs/agents/product-strategist.md',
  'docs/agents/architect.md',
  'docs/agents/executor.md',
  'docs/agents/reviewer.md',
  'docs/agents/tester.md',
  'docs/agents/doc-writer.md'
)
$files | ForEach-Object { Test-Path -LiteralPath $_ }
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
Select-String -Path $files -Pattern $markers -CaseSensitive:$false
Select-String -Path $files -Pattern '[^\x00-\x7F]'
```

Expected: six `True` lines, then no `Select-String` matches.

- [ ] **Step 8: Commit Task 3**

Run:

```powershell
git add -- docs/agents
git commit -m 'Add starter kit agent role cards'
```

Expected: commit succeeds.

---

### Task 4: Create Workflow Stage Guides

**Files:**
- Create: `docs/workflows/00-intake.md`
- Create: `docs/workflows/01-explore.md`
- Create: `docs/workflows/02-plan.md`
- Create: `docs/workflows/03-build.md`
- Create: `docs/workflows/04-review.md`
- Create: `docs/workflows/05-verify.md`
- Create: `docs/workflows/06-ship.md`

- [ ] **Step 1: Create `docs/workflows/00-intake.md`**

Create `docs/workflows/00-intake.md` with this exact content:

```markdown
# 00 Intake

## Purpose

Capture the request and make the task concrete enough to explore or plan.

## Inputs

- User request
- Existing project goals

## Actions

1. Restate the request in plain language.
2. Identify the likely user and goal.
3. Name non-goals when scope could expand.
4. Create a task folder under `tasks/<yyyy-mm-dd>-<slug>/`.
5. Start `brief.md` from `docs/templates/product-brief.md`.

## Outputs

- Task folder
- Draft `brief.md`
- Open questions for the human

## Stop When

The task is clear enough to explore or plan.
```

- [ ] **Step 2: Create `docs/workflows/01-explore.md`**

Create `docs/workflows/01-explore.md` with this exact content:

```markdown
# 01 Explore

## Purpose

Understand the repository, constraints, and risks before planning changes.

## Inputs

- Draft or approved `brief.md`
- Repository files
- Existing documentation
- Recent commits when available

## Actions

1. Inspect relevant files and project structure.
2. Identify existing patterns to follow.
3. Note likely files to change.
4. Note risks, unknowns, and decisions needing human input.
5. Avoid implementation changes during exploration.

## Outputs

- Exploration notes in the task folder
- Questions that block planning

## Stop When

The agent understands enough local context to create a concrete plan.
```

- [ ] **Step 3: Create `docs/workflows/02-plan.md`**

Create `docs/workflows/02-plan.md` with this exact content:

```markdown
# 02 Plan

## Purpose

Turn an approved brief and repository context into an implementation plan.

## Inputs

- Approved `brief.md`
- Exploration notes
- Relevant repository files

## Actions

1. Choose the smallest approach that satisfies the brief.
2. List files to create or modify.
3. Describe data flow or control flow.
4. Identify risks and rollback path.
5. Define verification commands and manual checks.
6. Ask for human approval when the task is non-trivial.

## Outputs

- `plan.md`

## Stop When

The plan is approved or the task is explicitly marked as fast lane.
```

- [ ] **Step 4: Create `docs/workflows/03-build.md`**

Create `docs/workflows/03-build.md` with this exact content:

```markdown
# 03 Build

## Purpose

Implement the approved plan in small, reviewable steps.

## Inputs

- Approved `plan.md`
- Relevant source files
- Project conventions

## Actions

1. Make the smallest useful change.
2. Follow existing project patterns.
3. Record meaningful deviations from the plan.
4. Run focused checks while building when available.
5. Keep unrelated cleanup out of the task.

## Outputs

- Code or document changes
- `execution-log.md`

## Stop When

The change is implemented and ready for independent review.
```

- [ ] **Step 5: Create `docs/workflows/04-review.md`**

Create `docs/workflows/04-review.md` with this exact content:

```markdown
# 04 Review

## Purpose

Find correctness, regression, maintainability, and scope issues before trusting the work.

## Inputs

- Brief
- Plan
- Diff
- Execution notes
- Available verification output

## Actions

1. Read the diff.
2. Compare the work against the brief and plan.
3. List findings first, ordered by severity.
4. Include file references where possible.
5. Record missing tests and open questions.

## Outputs

- `review.md`

## Stop When

Severe issues are fixed or remaining risks are explicitly accepted.
```

- [ ] **Step 6: Create `docs/workflows/05-verify.md`**

Create `docs/workflows/05-verify.md` with this exact content:

```markdown
# 05 Verify

## Purpose

Collect evidence that the work behaves as intended.

## Inputs

- Brief
- Plan
- Review notes
- Project commands

## Actions

1. Run the commands named in the plan.
2. Run additional focused checks if review identified gaps.
3. Perform manual checks when behavior cannot be covered by commands.
4. Record exact results.
5. Record known gaps honestly.

## Outputs

- `verification.md`

## Stop When

Verification evidence supports shipping or the remaining gaps are documented and accepted.
```

- [ ] **Step 7: Create `docs/workflows/06-ship.md`**

Create `docs/workflows/06-ship.md` with this exact content:

```markdown
# 06 Ship

## Purpose

Make a release decision with scope, evidence, docs, risks, and rollback path visible.

## Inputs

- Brief
- Plan
- Review report
- Verification report
- Documentation changes

## Actions

1. Confirm the shipped scope matches the brief.
2. Confirm verification evidence is recorded.
3. Confirm docs are updated when user behavior changed.
4. Confirm risks and rollback notes are visible.
5. Ask the human for the final ship decision.

## Outputs

- `release.md` or `release-checklist.md`

## Stop When

The human chooses to ship, defer, continue implementation, or cancel.
```

- [ ] **Step 8: Verify workflow stage guides**

Run:

```powershell
$files = @(
  'docs/workflows/00-intake.md',
  'docs/workflows/01-explore.md',
  'docs/workflows/02-plan.md',
  'docs/workflows/03-build.md',
  'docs/workflows/04-review.md',
  'docs/workflows/05-verify.md',
  'docs/workflows/06-ship.md'
)
$files | ForEach-Object { Test-Path -LiteralPath $_ }
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
Select-String -Path $files -Pattern $markers -CaseSensitive:$false
Select-String -Path $files -Pattern '[^\x00-\x7F]'
```

Expected: seven `True` lines, then no `Select-String` matches.

- [ ] **Step 9: Commit Task 4**

Run:

```powershell
git add -- docs/workflows
git commit -m 'Add starter kit workflow guides'
```

Expected: commit succeeds.

---

### Task 5: Create Rituals And Optional State Skeleton

**Files:**
- Create: `docs/rituals/architect-pass.md`
- Create: `docs/rituals/builder-sprint.md`
- Create: `docs/rituals/review-court.md`
- Create: `docs/rituals/red-team-run.md`
- Create: `docs/rituals/ship-bell.md`
- Create: `tasks/.gitkeep`
- Create: `.omc/notepad.md`
- Create: `.omc/project-memory.json`

- [ ] **Step 1: Create ritual files**

Create `docs/rituals/architect-pass.md` with this exact content:

```markdown
# Architect Pass

Use this checkpoint before non-trivial implementation.

## Questions

- What is the smallest design that satisfies the brief?
- Which files will change?
- What risks need review?
- How will the work be verified?

## Exit Criteria

The implementation plan is specific enough for a separate executor to follow.
```

Create `docs/rituals/builder-sprint.md` with this exact content:

```markdown
# Builder Sprint

Use this checkpoint during focused implementation.

## Rules

- Follow the approved plan.
- Keep changes small.
- Record deviations.
- Run focused checks when available.
- Stop when the work is ready for review.

## Exit Criteria

The implementation is complete enough for an independent reviewer.
```

Create `docs/rituals/review-court.md` with this exact content:

```markdown
# Review Court

Use this checkpoint to challenge the work before trusting it.

## Questions

- Does the change match the brief?
- Does the change match the plan?
- What can break?
- What tests or checks are missing?
- What risks remain?

## Exit Criteria

Findings are resolved, accepted, or documented.
```

Create `docs/rituals/red-team-run.md` with this exact content:

```markdown
# Red Team Run

Use this checkpoint to search for failure paths.

## Questions

- What happens with empty, invalid, slow, or repeated inputs?
- What happens when dependencies fail?
- What happens on a fresh checkout?
- What user action could reveal a hidden bug?

## Exit Criteria

Important failure paths are tested, mitigated, or documented.
```

Create `docs/rituals/ship-bell.md` with this exact content:

```markdown
# Ship Bell

Use this checkpoint before release or handoff.

## Questions

- Is the approved scope complete?
- Is verification evidence recorded?
- Are docs updated?
- Are risks and rollback notes visible?
- Has the human made the final decision?

## Exit Criteria

The project has a clear ship, defer, continue, or cancel decision.
```

- [ ] **Step 2: Create task and OMC skeleton files**

Create `tasks/.gitkeep` as an empty file.

Create `.omc/notepad.md` with this exact content:

```markdown
# OMC Notepad

Use this file for optional orchestration notes that should stay local to project coordination.
```

Create `.omc/project-memory.json` with this exact content:

```json
{
  "project": "AI Dev Team Starter Kit",
  "purpose": "Portable project template for one human directing multiple AI agents",
  "version": 1,
  "notes": []
}
```

- [ ] **Step 3: Verify rituals and skeleton files**

Run:

```powershell
$files = @(
  'docs/rituals/architect-pass.md',
  'docs/rituals/builder-sprint.md',
  'docs/rituals/review-court.md',
  'docs/rituals/red-team-run.md',
  'docs/rituals/ship-bell.md',
  'tasks/.gitkeep',
  '.omc/notepad.md',
  '.omc/project-memory.json'
)
$files | ForEach-Object { Test-Path -LiteralPath $_ }
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
Select-String -Path $files -Pattern $markers -CaseSensitive:$false
Select-String -Path $files -Pattern '[^\x00-\x7F]'
Get-Content -LiteralPath '.omc/project-memory.json' | ConvertFrom-Json | Out-Null
```

Expected: eight `True` lines, no `Select-String` matches, and JSON parsing succeeds.

- [ ] **Step 4: Commit Task 5**

Run:

```powershell
git add -- docs/rituals tasks .omc
git commit -m 'Add starter kit rituals and state skeleton'
```

Expected: commit succeeds.

---

### Task 6: Final Integration Verification

**Files:**
- Verify all starter kit files.

- [ ] **Step 1: Verify required file set**

Run:

```powershell
$required = @(
  'AGENTS.md',
  'README.md',
  'docs/workflows/00-intake.md',
  'docs/workflows/01-explore.md',
  'docs/workflows/02-plan.md',
  'docs/workflows/03-build.md',
  'docs/workflows/04-review.md',
  'docs/workflows/05-verify.md',
  'docs/workflows/06-ship.md',
  'docs/agents/product-strategist.md',
  'docs/agents/architect.md',
  'docs/agents/executor.md',
  'docs/agents/reviewer.md',
  'docs/agents/tester.md',
  'docs/agents/doc-writer.md',
  'docs/templates/product-brief.md',
  'docs/templates/implementation-plan.md',
  'docs/templates/review-report.md',
  'docs/templates/verification-report.md',
  'docs/templates/release-checklist.md',
  'docs/rituals/architect-pass.md',
  'docs/rituals/builder-sprint.md',
  'docs/rituals/review-court.md',
  'docs/rituals/red-team-run.md',
  'docs/rituals/ship-bell.md',
  'tasks/.gitkeep',
  '.omc/notepad.md',
  '.omc/project-memory.json'
)
$missing = $required | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missing.Count -gt 0) {
  $missing
  exit 1
}
'all required files exist'
```

Expected:

```text
all required files exist
```

- [ ] **Step 2: Verify no unfinished-work markers or non-ASCII characters**

Run:

```powershell
$contentFiles = @(
  'AGENTS.md',
  'README.md',
  'docs/workflows/00-intake.md',
  'docs/workflows/01-explore.md',
  'docs/workflows/02-plan.md',
  'docs/workflows/03-build.md',
  'docs/workflows/04-review.md',
  'docs/workflows/05-verify.md',
  'docs/workflows/06-ship.md',
  'docs/agents/product-strategist.md',
  'docs/agents/architect.md',
  'docs/agents/executor.md',
  'docs/agents/reviewer.md',
  'docs/agents/tester.md',
  'docs/agents/doc-writer.md',
  'docs/templates/product-brief.md',
  'docs/templates/implementation-plan.md',
  'docs/templates/review-report.md',
  'docs/templates/verification-report.md',
  'docs/templates/release-checklist.md',
  'docs/rituals/architect-pass.md',
  'docs/rituals/builder-sprint.md',
  'docs/rituals/review-court.md',
  'docs/rituals/red-team-run.md',
  'docs/rituals/ship-bell.md',
  '.omc/notepad.md',
  '.omc/project-memory.json'
)
$markers = @('TO'+'DO', 'T'+'BD', 'FIX'+'ME', 'place'+'holder')
$redFlagMatches = Select-String -Path $contentFiles -Pattern $markers -CaseSensitive:$false
$unicodeMatches = Select-String -Path $contentFiles -Pattern '[^\x00-\x7F]'
if ($redFlagMatches -or $unicodeMatches) {
  $redFlagMatches
  $unicodeMatches
  exit 1
}
'content scan clean'
```

Expected:

```text
content scan clean
```

- [ ] **Step 3: Verify Git whitespace and status**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` exits 0. `git status --short` is empty after Task 5 commit.

- [ ] **Step 4: Record final result**

If all checks pass, report:

```text
AI Dev Team Starter Kit first version is implemented and verified.
```

If any check fails, fix the issue and rerun the failing check before reporting completion.

## Plan Self-Review

- Spec coverage: the plan creates the root guide, workflow files, agent role cards, artifact templates, rituals, task skeleton, and optional `.omc/` state files required by the approved spec.
- Scope boundary: the plan does not add automation, CLI code, dashboards, runtime orchestration, deployment, CI, billing, auth, or project-specific infrastructure.
- Verification coverage: each task includes file existence checks, unfinished-work marker scans, non-ASCII scans, and commits; final integration includes full required file verification and `git diff --check`.
- Red-flag marker scan: scan commands build marker strings through concatenation so the plan itself stays clean.
