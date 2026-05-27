# Implementation Plan

## Context

The approved task is a desktop-first todo reminder app with paired mobile Web access on the same Wi-Fi network. The source of truth for the detailed implementation plan is:

`docs/superpowers/plans/2026-05-27-desktop-todo-reminder.md`

## Proposed Approach

Use `Tauri v2` with `React` and `TypeScript` for the desktop shell and UI. Put task domain logic, SQLite persistence, mobile pairing, local API, reminders, notifications, and tray handling in focused Rust modules. Use `Vitest` and Rust unit tests for focused verification, then finish with manual desktop/mobile checks.

## Files to Change

- `package.json`: frontend, Tauri, and test scripts/dependencies.
- `src/`: desktop and mobile React UI.
- `src-tauri/`: Rust app shell, task store, pairing, API, reminders, notification, and tray integrations.
- `tests/`: frontend UI tests.
- `README.md`: setup and usage documentation.
- `tasks/2026-05-27-desktop-todo-reminder/`: execution, verification, and release artifacts.

## Data Flow

Desktop UI calls Tauri commands, which read/write SQLite through `TaskStore`. Mobile Web calls the local Axum API with a pairing token. The reminder engine scans active tasks and sends native notifications through the Tauri notification plugin.

## Risks

- Native notification behavior differs between development and installed builds. The plan includes `pnpm tauri build --debug` and manual notification verification.
- Local mobile access can fail because of Wi-Fi or firewall settings. The plan includes same-Wi-Fi manual checks and token rejection checks.
- Tauri/Rust integration can become tangled. The plan keeps domain, store, API, reminder, notification, and tray logic in separate files.

## Test Plan

- `pnpm vitest run`: frontend shell, task form, and mobile route tests pass.
- `cargo test --manifest-path src-tauri/Cargo.toml`: Rust domain, store, pairing, and reminder tests pass.
- `pnpm tauri info`: environment is detected.
- `pnpm tauri build --debug`: debug build succeeds.
- Manual check: desktop task creation persists, reminder notification appears, tray works, and mobile pairing can add a task.

## Rollback Plan

If implementation fails, revert the feature commits after `docs: add desktop todo reminder design` and keep the approved brief/spec for a smaller follow-up plan.

## Approval

User approved the desktop app plus mobile Web design on 2026-05-27 by replying `可以`.
