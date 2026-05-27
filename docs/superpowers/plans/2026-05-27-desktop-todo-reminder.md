# Desktop Todo Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable desktop-first todo reminder app with reliable desktop notifications, tray controls, local SQLite persistence, and a paired mobile Web UI on the same Wi-Fi network.

**Architecture:** Use a Tauri v2 desktop shell with a React + TypeScript UI. Keep task domain logic, SQLite persistence, pairing, local HTTP API, reminder scheduling, tray setup, and notification delivery in focused Rust modules under `src-tauri/src`. Serve both the desktop UI and mobile route from the React app while mobile requests go through a token-protected local API.

**Tech Stack:** `Tauri v2`, `Rust`, `React`, `TypeScript`, `Vite`, `SQLite`, `rusqlite`, `axum`, `Vitest`, `React Testing Library`

---

## Context

Approved artifacts:

- `tasks/2026-05-27-desktop-todo-reminder/brief.md`
- `docs/superpowers/specs/2026-05-27-desktop-todo-reminder-design.md`

Current repository state:

- The repo is currently an AI Dev Team Starter Kit documentation repository.
- There is no application code yet.
- Local tools available during planning: `node v24.14.0`, `pnpm 10.33.0`, `rustc 1.95.0`, `cargo 1.95.0`.

Official docs consulted while planning:

- Tauri create project: https://v2.tauri.app/start/create-project/
- Tauri system tray: https://v2.tauri.app/learn/system-tray/
- Tauri notifications: https://v2.tauri.app/plugin/notification/
- Tauri autostart API: https://v2.tauri.app/reference/javascript/autostart/

## File Structure

- `package.json`: frontend scripts and Tauri/Vitest dependencies.
- `index.html`: Vite app entry.
- `vite.config.ts`: Vite + React + Vitest configuration.
- `tsconfig.json`: TypeScript configuration.
- `src/main.tsx`: React bootstrap.
- `src/styles.css`: app-wide utility CSS.
- `src/app/App.tsx`: desktop app route shell.
- `src/app/MobileApp.tsx`: mobile route shell.
- `src/app/api.ts`: frontend API adapter for Tauri commands and mobile HTTP calls.
- `src/app/types.ts`: shared frontend task and settings types.
- `src/features/tasks/TaskForm.tsx`: task creation/edit form.
- `src/features/tasks/TaskList.tsx`: task list and actions.
- `src/features/tasks/taskFilters.ts`: today/upcoming/completed filter logic.
- `src/features/pairing/PairingPanel.tsx`: desktop pairing link and token UI.
- `src-tauri/Cargo.toml`: Rust dependencies and Tauri features.
- `src-tauri/tauri.conf.json`: desktop app metadata, dev URL, build output.
- `src-tauri/src/main.rs`: Tauri entrypoint.
- `src-tauri/src/lib.rs`: builder setup and module wiring.
- `src-tauri/src/domain.rs`: task, priority, status, settings, and state transition logic.
- `src-tauri/src/store.rs`: SQLite schema and task/settings persistence.
- `src-tauri/src/pairing.rs`: short-lived pairing token generation and validation.
- `src-tauri/src/commands.rs`: Tauri command handlers used by desktop UI.
- `src-tauri/src/api.rs`: Axum local HTTP API used by mobile Web.
- `src-tauri/src/reminders.rs`: due-task scheduler and duplicate prevention.
- `src-tauri/src/notifications.rs`: notification abstraction and Tauri notification sender.
- `src-tauri/src/tray.rs`: tray menu and tray click handling.
- `src-tauri/src/settings.rs`: app setting helpers.
- `tests/app-shell.test.tsx`: frontend shell smoke tests.
- `tests/task-ui.test.tsx`: desktop task UI tests.
- `tests/mobile-ui.test.tsx`: mobile route tests.
- `tasks/2026-05-27-desktop-todo-reminder/execution-log.md`: build notes and deviations.
- `tasks/2026-05-27-desktop-todo-reminder/verification.md`: exact verification evidence.
- `README.md`: setup, dev, test, and manual mobile pairing instructions.

## Task 1: Bootstrap Tauri React App And Test Harness

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/app/App.tsx`
- Create: `src/app/types.ts`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Test: `tests/app-shell.test.tsx`

- [ ] **Step 1: Generate the Tauri React scaffold in a scratch folder**

Run:

```powershell
pnpm create tauri-app todo-reminder-scaffold --template react-ts
Copy-Item -Recurse todo-reminder-scaffold\src .\src
Copy-Item todo-reminder-scaffold\index.html .\index.html
Copy-Item todo-reminder-scaffold\package.json .\package.json
Copy-Item todo-reminder-scaffold\tsconfig.json .\tsconfig.json
Copy-Item todo-reminder-scaffold\vite.config.ts .\vite.config.ts
Copy-Item -Recurse todo-reminder-scaffold\src-tauri .\src-tauri
Remove-Item -Recurse -Force todo-reminder-scaffold
pnpm install
pnpm add clsx lucide-react @tauri-apps/plugin-notification @tauri-apps/plugin-autostart
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

Expected: `src`, `src-tauri`, `package.json`, and `pnpm-lock.yaml` exist. The generated app can be replaced by the minimal code below.

- [ ] **Step 2: Write the failing app shell test**

Create `tests/app-shell.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import App from "../src/app/App"

describe("App", () => {
  it("renders the desktop todo reminder shell", () => {
    render(<App />)

    expect(screen.getByRole("heading", { name: "今日待办" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "新增待办" })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test and verify it fails**

Run:

```powershell
pnpm vitest run tests/app-shell.test.tsx
```

Expected: FAIL with an import error for `../src/app/App` or missing heading text.

- [ ] **Step 4: Replace the generated shell with the minimal app**

Create `src/app/types.ts`:

```ts
export type Priority = "low" | "normal" | "high"
export type TaskStatus = "active" | "completed" | "deleted"

export interface Task {
  id: string
  title: string
  notes: string
  dueAt: string | null
  remindAt: string | null
  priority: Priority
  status: TaskStatus
  snoozedUntil: string | null
  lastNotifiedAt: string | null
  createdAt: string
  updatedAt: string
}
```

Create `src/app/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Desktop Todo Reminder</p>
          <h1>今日待办</h1>
        </div>
        <button type="button" className="primary-button">
          新增待办
        </button>
      </section>
      <section className="empty-state">
        <h2>还没有待办</h2>
        <p>创建一个带提醒时间的任务，桌面端会负责到点通知。</p>
      </section>
    </main>
  )
}
```

Create `src/main.tsx`:

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./styles.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Create `src/styles.css`:

```css
:root {
  color: #172026;
  background: #f5f7f8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.toolbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  color: #63717a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 4px;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

.primary-button {
  background: #216869;
  border: 0;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  min-height: 40px;
  padding: 0 14px;
}

.empty-state {
  border: 1px solid #d8e0e3;
  border-radius: 8px;
  margin-top: 24px;
  padding: 24px;
}
```

Update `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
})
```

- [ ] **Step 5: Run focused checks**

Run:

```powershell
pnpm vitest run tests/app-shell.test.tsx
pnpm tauri info
```

Expected: Vitest PASS. `pnpm tauri info` prints Tauri environment details.

- [ ] **Step 6: Commit the scaffold**

Run:

```powershell
git add package.json pnpm-lock.yaml index.html vite.config.ts tsconfig.json src src-tauri tests/app-shell.test.tsx
git commit -m "feat: bootstrap desktop todo reminder app"
```

## Task 2: Add Rust Task Domain Model

**Files:**

- Create: `src-tauri/src/domain.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/src/domain.rs`

- [ ] **Step 1: Write failing Rust domain tests**

Create `src-tauri/src/domain.rs` with only the tests first:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    #[test]
    fn complete_moves_active_task_to_completed() {
        let now = Utc::now();
        let mut task = Task::new("Pay invoice".to_string(), None, Some(now)).unwrap();

        task.complete(now);

        assert_eq!(task.status, TaskStatus::Completed);
        assert_eq!(task.updated_at, now);
    }

    #[test]
    fn due_reminder_requires_active_task_with_due_remind_at() {
        let now = Utc::now();
        let task = Task::new("Stand up".to_string(), None, Some(now - Duration::minutes(1))).unwrap();

        assert!(task.is_due_for_reminder(now));
    }

    #[test]
    fn task_title_cannot_be_blank() {
        let result = Task::new("   ".to_string(), None, None);

        assert_eq!(result.unwrap_err(), "title_required");
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml domain
```

Expected: FAIL because `Task`, `TaskStatus`, and methods are not defined.

- [ ] **Step 3: Implement the task domain model**

Replace `src-tauri/src/domain.rs` with:

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Priority {
    Low,
    Normal,
    High,
}

#[derive(Debug, Clone, Copy, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TaskStatus {
    Active,
    Completed,
    Deleted,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub notes: String,
    pub due_at: Option<DateTime<Utc>>,
    pub remind_at: Option<DateTime<Utc>>,
    pub priority: Priority,
    pub status: TaskStatus,
    pub snoozed_until: Option<DateTime<Utc>>,
    pub last_notified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Task {
    pub fn new(
        title: String,
        due_at: Option<DateTime<Utc>>,
        remind_at: Option<DateTime<Utc>>,
    ) -> Result<Self, String> {
        let title = title.trim().to_string();
        if title.is_empty() {
            return Err("title_required".to_string());
        }

        let now = Utc::now();
        Ok(Self {
            id: Uuid::new_v4().to_string(),
            title,
            notes: String::new(),
            due_at,
            remind_at,
            priority: Priority::Normal,
            status: TaskStatus::Active,
            snoozed_until: None,
            last_notified_at: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn complete(&mut self, now: DateTime<Utc>) {
        self.status = TaskStatus::Completed;
        self.updated_at = now;
    }

    pub fn snooze_until(&mut self, until: DateTime<Utc>, now: DateTime<Utc>) {
        self.snoozed_until = Some(until);
        self.updated_at = now;
    }

    pub fn mark_notified(&mut self, now: DateTime<Utc>) {
        self.last_notified_at = Some(now);
        self.updated_at = now;
    }

    pub fn is_due_for_reminder(&self, now: DateTime<Utc>) -> bool {
        if self.status != TaskStatus::Active {
            return false;
        }

        if self.snoozed_until.is_some_and(|snoozed_until| snoozed_until > now) {
            return false;
        }

        let Some(remind_at) = self.remind_at else {
            return false;
        };

        if remind_at > now {
            return false;
        }

        !self
            .last_notified_at
            .is_some_and(|last_notified_at| last_notified_at >= remind_at)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn complete_moves_active_task_to_completed() {
        let now = Utc::now();
        let mut task = Task::new("Pay invoice".to_string(), None, Some(now)).unwrap();

        task.complete(now);

        assert_eq!(task.status, TaskStatus::Completed);
        assert_eq!(task.updated_at, now);
    }

    #[test]
    fn due_reminder_requires_active_task_with_due_remind_at() {
        let now = Utc::now();
        let task = Task::new("Stand up".to_string(), None, Some(now - Duration::minutes(1))).unwrap();

        assert!(task.is_due_for_reminder(now));
    }

    #[test]
    fn task_title_cannot_be_blank() {
        let result = Task::new("   ".to_string(), None, None);

        assert_eq!(result.unwrap_err(), "title_required");
    }
}
```

Update `src-tauri/src/lib.rs`:

```rust
pub mod domain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Update `src-tauri/Cargo.toml` dependencies:

```toml
[dependencies]
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = ["tray-icon"] }
tauri-build = { version = "2", features = [] }
uuid = { version = "1", features = ["v4", "serde"] }
```

- [ ] **Step 4: Run focused checks**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml domain
```

Expected: PASS for the three domain tests.

- [ ] **Step 5: Commit domain model**

Run:

```powershell
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/src/domain.rs
git commit -m "feat: add task domain model"
```

## Task 3: Add SQLite Task Store

**Files:**

- Create: `src-tauri/src/store.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Test: `src-tauri/src/store.rs`

- [ ] **Step 1: Write failing store tests**

Create `src-tauri/src/store.rs` with tests first:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    #[test]
    fn creates_lists_and_completes_tasks() {
        let store = TaskStore::in_memory().unwrap();
        let remind_at = Utc::now() + Duration::minutes(5);

        let created = store.create_task("Call Sam", "", None, Some(remind_at), Priority::High).unwrap();
        let listed = store.list_tasks(TaskListFilter::All).unwrap();

        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, created.id);

        store.complete_task(&created.id).unwrap();
        let completed = store.get_task(&created.id).unwrap().unwrap();

        assert_eq!(completed.status, TaskStatus::Completed);
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml store
```

Expected: FAIL because `TaskStore` is not implemented.

- [ ] **Step 3: Implement SQLite persistence**

Replace `src-tauri/src/store.rs` with:

```rust
use std::path::Path;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension};

use crate::domain::{Priority, Task, TaskStatus};

#[derive(Clone)]
pub struct TaskStore {
    conn: Arc<Mutex<Connection>>,
}

#[derive(Debug, Clone, Copy)]
pub enum TaskListFilter {
    Active,
    Completed,
    All,
}

impl TaskStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|error| error.to_string())?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.migrate()?;
        Ok(store)
    }

    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|error| error.to_string())?;
        let store = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        store.migrate()?;
        Ok(store)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "store_lock_failed".to_string())?;
        conn.execute_batch(
            "
            create table if not exists tasks (
              id text primary key,
              title text not null,
              notes text not null,
              due_at text,
              remind_at text,
              priority text not null,
              status text not null,
              snoozed_until text,
              last_notified_at text,
              created_at text not null,
              updated_at text not null
            );
            create table if not exists settings (
              key text primary key,
              value text not null
            );
            create table if not exists pairing_tokens (
              token_hash text primary key,
              expires_at text not null,
              created_at text not null,
              revoked_at text
            );
            ",
        )
        .map_err(|error| error.to_string())
    }

    pub fn create_task(
        &self,
        title: &str,
        notes: &str,
        due_at: Option<DateTime<Utc>>,
        remind_at: Option<DateTime<Utc>>,
        priority: Priority,
    ) -> Result<Task, String> {
        let mut task = Task::new(title.to_string(), due_at, remind_at)?;
        task.notes = notes.to_string();
        task.priority = priority;
        self.save_task(&task)?;
        Ok(task)
    }

    pub fn save_task(&self, task: &Task) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "store_lock_failed".to_string())?;
        conn.execute(
            "
            insert into tasks (
              id, title, notes, due_at, remind_at, priority, status,
              snoozed_until, last_notified_at, created_at, updated_at
            )
            values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            on conflict(id) do update set
              title = excluded.title,
              notes = excluded.notes,
              due_at = excluded.due_at,
              remind_at = excluded.remind_at,
              priority = excluded.priority,
              status = excluded.status,
              snoozed_until = excluded.snoozed_until,
              last_notified_at = excluded.last_notified_at,
              updated_at = excluded.updated_at
            ",
            params![
                task.id,
                task.title,
                task.notes,
                encode_dt(task.due_at),
                encode_dt(task.remind_at),
                encode_priority(task.priority),
                encode_status(task.status),
                encode_dt(task.snoozed_until),
                encode_dt(task.last_notified_at),
                task.created_at.to_rfc3339(),
                task.updated_at.to_rfc3339(),
            ],
        )
        .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn list_tasks(&self, filter: TaskListFilter) -> Result<Vec<Task>, String> {
        let status_filter = match filter {
            TaskListFilter::Active => "where status = 'active'",
            TaskListFilter::Completed => "where status = 'completed'",
            TaskListFilter::All => "where status != 'deleted'",
        };
        let sql = format!(
            "select id, title, notes, due_at, remind_at, priority, status, snoozed_until, last_notified_at, created_at, updated_at from tasks {status_filter} order by coalesce(remind_at, created_at) asc"
        );
        let conn = self.conn.lock().map_err(|_| "store_lock_failed".to_string())?;
        let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
        let rows = stmt
            .query_map([], map_task_row)
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_task(&self, id: &str) -> Result<Option<Task>, String> {
        let conn = self.conn.lock().map_err(|_| "store_lock_failed".to_string())?;
        conn.query_row(
            "select id, title, notes, due_at, remind_at, priority, status, snoozed_until, last_notified_at, created_at, updated_at from tasks where id = ?1",
            [id],
            map_task_row,
        )
        .optional()
        .map_err(|error| error.to_string())
    }

    pub fn complete_task(&self, id: &str) -> Result<(), String> {
        let mut task = self.get_task(id)?.ok_or_else(|| "task_not_found".to_string())?;
        task.complete(Utc::now());
        self.save_task(&task)
    }
}

fn encode_dt(value: Option<DateTime<Utc>>) -> Option<String> {
    value.map(|date| date.to_rfc3339())
}

fn decode_dt(value: Option<String>) -> Result<Option<DateTime<Utc>>, rusqlite::Error> {
    value
        .map(|raw| {
            DateTime::parse_from_rfc3339(&raw)
                .map(|date| date.with_timezone(&Utc))
                .map_err(|error| rusqlite::Error::ToSqlConversionFailure(Box::new(error)))
        })
        .transpose()
}

fn encode_priority(priority: Priority) -> &'static str {
    match priority {
        Priority::Low => "low",
        Priority::Normal => "normal",
        Priority::High => "high",
    }
}

fn decode_priority(raw: String) -> Priority {
    match raw.as_str() {
        "low" => Priority::Low,
        "high" => Priority::High,
        _ => Priority::Normal,
    }
}

fn encode_status(status: TaskStatus) -> &'static str {
    match status {
        TaskStatus::Active => "active",
        TaskStatus::Completed => "completed",
        TaskStatus::Deleted => "deleted",
    }
}

fn decode_status(raw: String) -> TaskStatus {
    match raw.as_str() {
        "completed" => TaskStatus::Completed,
        "deleted" => TaskStatus::Deleted,
        _ => TaskStatus::Active,
    }
}

fn map_task_row(row: &rusqlite::Row<'_>) -> Result<Task, rusqlite::Error> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        notes: row.get(2)?,
        due_at: decode_dt(row.get(3)?)?,
        remind_at: decode_dt(row.get(4)?)?,
        priority: decode_priority(row.get(5)?),
        status: decode_status(row.get(6)?),
        snoozed_until: decode_dt(row.get(7)?)?,
        last_notified_at: decode_dt(row.get(8)?)?,
        created_at: decode_dt(Some(row.get(9)?))?.expect("created_at is required"),
        updated_at: decode_dt(Some(row.get(10)?))?.expect("updated_at is required"),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn creates_lists_and_completes_tasks() {
        let store = TaskStore::in_memory().unwrap();
        let remind_at = Utc::now() + Duration::minutes(5);

        let created = store.create_task("Call Sam", "", None, Some(remind_at), Priority::High).unwrap();
        let listed = store.list_tasks(TaskListFilter::All).unwrap();

        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].id, created.id);

        store.complete_task(&created.id).unwrap();
        let completed = store.get_task(&created.id).unwrap().unwrap();

        assert_eq!(completed.status, TaskStatus::Completed);
    }
}
```

Update `src-tauri/src/lib.rs`:

```rust
pub mod domain;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add to `src-tauri/Cargo.toml`:

```toml
rusqlite = { version = "0.32", features = ["bundled", "chrono"] }
```

- [ ] **Step 4: Run focused checks**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml store
```

Expected: PASS for store tests.

- [ ] **Step 5: Commit SQLite store**

Run:

```powershell
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/src/store.rs
git commit -m "feat: add sqlite task store"
```

## Task 4: Add Pairing Service And Local Mobile API

**Files:**

- Create: `src-tauri/src/pairing.rs`
- Create: `src-tauri/src/api.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Test: `src-tauri/src/pairing.rs`

- [ ] **Step 1: Write failing pairing tests**

Create `src-tauri/src/pairing.rs` with tests first:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    #[test]
    fn generated_token_validates_until_expiry() {
        let service = PairingService::default();
        let now = Utc::now();
        let token = service.create_token(now, Duration::minutes(10));

        assert!(service.validate(&token, now + Duration::minutes(1)));
        assert!(!service.validate(&token, now + Duration::minutes(11)));
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml pairing
```

Expected: FAIL because `PairingService` is not implemented.

- [ ] **Step 3: Implement pairing service**

Replace `src-tauri/src/pairing.rs` with:

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};
use rand::{distributions::Alphanumeric, Rng};
use sha2::{Digest, Sha256};

#[derive(Clone, Default)]
pub struct PairingService {
    tokens: Arc<Mutex<HashMap<String, DateTime<Utc>>>>,
}

impl PairingService {
    pub fn create_token(&self, now: DateTime<Utc>, ttl: Duration) -> String {
        let token: String = rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();
        let hash = hash_token(&token);
        let mut tokens = self.tokens.lock().expect("pairing token lock poisoned");
        tokens.insert(hash, now + ttl);
        token
    }

    pub fn validate(&self, token: &str, now: DateTime<Utc>) -> bool {
        let hash = hash_token(token);
        let tokens = self.tokens.lock().expect("pairing token lock poisoned");
        tokens.get(&hash).is_some_and(|expires_at| *expires_at > now)
    }

    pub fn revoke_all(&self) {
        let mut tokens = self.tokens.lock().expect("pairing token lock poisoned");
        tokens.clear();
    }
}

fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generated_token_validates_until_expiry() {
        let service = PairingService::default();
        let now = Utc::now();
        let token = service.create_token(now, Duration::minutes(10));

        assert!(service.validate(&token, now + Duration::minutes(1)));
        assert!(!service.validate(&token, now + Duration::minutes(11)));
    }
}
```

- [ ] **Step 4: Implement local API server**

Create `src-tauri/src/api.rs`:

```rust
use std::net::SocketAddr;

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    routing::{get, patch, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use tokio::net::TcpListener;

use crate::{
    domain::Priority,
    pairing::PairingService,
    store::{TaskListFilter, TaskStore},
};

#[derive(Clone)]
pub struct ApiState {
    pub store: TaskStore,
    pub pairing: PairingService,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub title: String,
    pub notes: Option<String>,
    pub due_at: Option<DateTime<Utc>>,
    pub remind_at: Option<DateTime<Utc>>,
    pub priority: Option<Priority>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub remind_at: Option<DateTime<Utc>>,
}

pub fn router(state: ApiState) -> Router {
    Router::new()
        .route("/api/tasks", get(list_tasks).post(create_task))
        .route("/api/tasks/:id", patch(update_task))
        .route("/api/tasks/:id/complete", post(complete_task))
        .with_state(state)
}

pub async fn serve(state: ApiState, addr: SocketAddr) -> Result<(), String> {
    let listener = TcpListener::bind(addr).await.map_err(|error| error.to_string())?;
    axum::serve(listener, router(state))
        .await
        .map_err(|error| error.to_string())
}

async fn list_tasks(
    State(state): State<ApiState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_token(&state, &headers)?;
    let tasks = state.store.list_tasks(TaskListFilter::All).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(serde_json::json!({ "tasks": tasks })))
}

async fn create_task(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Json(input): Json<CreateTaskRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_token(&state, &headers)?;
    let task = state
        .store
        .create_task(
            &input.title,
            input.notes.as_deref().unwrap_or(""),
            input.due_at,
            input.remind_at,
            input.priority.unwrap_or(Priority::Normal),
        )
        .map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn update_task(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(input): Json<UpdateTaskRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_token(&state, &headers)?;
    let mut task = state
        .store
        .get_task(&id)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;
    if let Some(title) = input.title {
        task.title = title.trim().to_string();
    }
    if let Some(notes) = input.notes {
        task.notes = notes;
    }
    if input.remind_at.is_some() {
        task.remind_at = input.remind_at;
    }
    task.updated_at = Utc::now();
    state.store.save_task(&task).map_err(|_| StatusCode::BAD_REQUEST)?;
    Ok(Json(serde_json::json!({ "task": task })))
}

async fn complete_task(
    State(state): State<ApiState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    require_token(&state, &headers)?;
    state.store.complete_task(&id).map_err(|_| StatusCode::NOT_FOUND)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

fn require_token(state: &ApiState, headers: &HeaderMap) -> Result<(), StatusCode> {
    let token = headers
        .get("x-pairing-token")
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;
    if state.pairing.validate(token, Utc::now()) {
        Ok(())
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
```

Update `src-tauri/src/lib.rs`:

```rust
pub mod api;
pub mod domain;
pub mod pairing;
pub mod store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add to `src-tauri/Cargo.toml`:

```toml
axum = "0.7"
rand = "0.8"
sha2 = "0.10"
tokio = { version = "1", features = ["macros", "rt-multi-thread", "net"] }
```

- [ ] **Step 5: Run focused checks**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml pairing
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: PASS for pairing, domain, and store tests.

- [ ] **Step 6: Commit pairing and API**

Run:

```powershell
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/src/pairing.rs src-tauri/src/api.rs
git commit -m "feat: add paired local mobile api"
```

## Task 5: Add Tauri Commands And Desktop Task UI

**Files:**

- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src/app/api.ts`
- Create: `src/features/tasks/taskFilters.ts`
- Create: `src/features/tasks/TaskForm.tsx`
- Create: `src/features/tasks/TaskList.tsx`
- Modify: `src/app/App.tsx`
- Test: `tests/task-ui.test.tsx`

- [ ] **Step 1: Write failing desktop UI test**

Create `tests/task-ui.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TaskForm } from "../src/features/tasks/TaskForm"

describe("TaskForm", () => {
  it("submits a titled task with a reminder time", () => {
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText("标题"), { target: { value: "喝水" } })
    fireEvent.change(screen.getByLabelText("提醒时间"), { target: { value: "2026-05-27T22:30" } })
    fireEvent.click(screen.getByRole("button", { name: "保存待办" }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: "喝水",
      notes: "",
      remindAt: "2026-05-27T22:30",
      priority: "normal",
    })
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm vitest run tests/task-ui.test.tsx
```

Expected: FAIL because `TaskForm` does not exist.

- [ ] **Step 3: Implement Tauri commands**

Create `src-tauri/src/commands.rs`:

```rust
use chrono::{DateTime, Duration, Utc};
use serde::Deserialize;
use tauri::State;

use crate::{
    domain::{Priority, Task},
    pairing::PairingService,
    store::{TaskListFilter, TaskStore},
};

#[derive(Clone)]
pub struct AppState {
    pub store: TaskStore,
    pub pairing: PairingService,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskInput {
    pub title: String,
    pub notes: Option<String>,
    pub due_at: Option<DateTime<Utc>>,
    pub remind_at: Option<DateTime<Utc>>,
    pub priority: Option<Priority>,
}

#[tauri::command]
pub fn list_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    state.store.list_tasks(TaskListFilter::All)
}

#[tauri::command]
pub fn create_task(input: CreateTaskInput, state: State<'_, AppState>) -> Result<Task, String> {
    state.store.create_task(
        &input.title,
        input.notes.as_deref().unwrap_or(""),
        input.due_at,
        input.remind_at,
        input.priority.unwrap_or(Priority::Normal),
    )
}

#[tauri::command]
pub fn complete_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.store.complete_task(&id)
}

#[tauri::command]
pub fn create_pairing_url(state: State<'_, AppState>) -> Result<String, String> {
    let token = state.pairing.create_token(Utc::now(), Duration::minutes(15));
    Ok(format!("http://127.0.0.1:35817/mobile?token={token}"))
}
```

Update `src-tauri/src/lib.rs` wiring after Task 7 adds app data path:

```rust
pub mod api;
pub mod commands;
pub mod domain;
pub mod pairing;
pub mod store;

use commands::{complete_task, create_pairing_url, create_task, list_tasks, AppState};
use pairing::PairingService;
use store::TaskStore;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let store = TaskStore::open("todo-reminder.sqlite").expect("failed to open task database");
    let state = AppState {
        store,
        pairing: PairingService::default(),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            list_tasks,
            create_task,
            complete_task,
            create_pairing_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Implement frontend API and components**

Create `src/app/api.ts`:

```ts
import { invoke } from "@tauri-apps/api/core"
import type { Priority, Task } from "./types"

export interface CreateTaskInput {
  title: string
  notes: string
  remindAt: string | null
  priority: Priority
}

export async function listTasks(): Promise<Task[]> {
  return invoke<Task[]>("list_tasks")
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return invoke<Task>("create_task", {
    input: {
      title: input.title,
      notes: input.notes,
      remindAt: input.remindAt,
      priority: input.priority,
    },
  })
}

export async function completeTask(id: string): Promise<void> {
  await invoke("complete_task", { id })
}

export async function createPairingUrl(): Promise<string> {
  return invoke<string>("create_pairing_url")
}
```

Create `src/features/tasks/TaskForm.tsx`:

```tsx
import { FormEvent, useState } from "react"
import type { Priority } from "../../app/types"

interface TaskFormValues {
  title: string
  notes: string
  remindAt: string | null
  priority: Priority
}

interface TaskFormProps {
  onSubmit: (values: TaskFormValues) => void
}

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [remindAt, setRemindAt] = useState("")
  const [priority, setPriority] = useState<Priority>("normal")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onSubmit({
      title: trimmed,
      notes,
      remindAt: remindAt || null,
      priority,
    })
    setTitle("")
    setNotes("")
    setRemindAt("")
    setPriority("normal")
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        标题
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        备注
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label>
        提醒时间
        <input
          type="datetime-local"
          value={remindAt}
          onChange={(event) => setRemindAt(event.target.value)}
        />
      </label>
      <label>
        优先级
        <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
          <option value="low">低</option>
          <option value="normal">普通</option>
          <option value="high">高</option>
        </select>
      </label>
      <button type="submit">保存待办</button>
    </form>
  )
}
```

Create `src/features/tasks/TaskList.tsx`:

```tsx
import type { Task } from "../../app/types"

interface TaskListProps {
  tasks: Task[]
  onComplete: (id: string) => void
}

export function TaskList({ tasks, onComplete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="empty-state">
        <h2>还没有待办</h2>
        <p>创建一个带提醒时间的任务，桌面端会负责到点通知。</p>
      </section>
    )
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-row">
          <div>
            <strong>{task.title}</strong>
            {task.remindAt ? <p>{new Date(task.remindAt).toLocaleString()}</p> : null}
          </div>
          {task.status === "active" ? (
            <button type="button" onClick={() => onComplete(task.id)}>
              完成
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
```

Update `src/app/App.tsx` to load tasks and render `TaskForm`/`TaskList`.

- [ ] **Step 5: Run focused checks**

Run:

```powershell
pnpm vitest run tests/task-ui.test.tsx
pnpm vitest run tests/app-shell.test.tsx
cargo test --manifest-path src-tauri/Cargo.toml
```

Expected: PASS for frontend and Rust tests.

- [ ] **Step 6: Commit desktop UI and commands**

Run:

```powershell
git add src src-tauri tests/task-ui.test.tsx
git commit -m "feat: add desktop task management ui"
```

## Task 6: Add Mobile Web Route

**Files:**

- Create: `src/app/MobileApp.tsx`
- Modify: `src/main.tsx`
- Modify: `src/app/api.ts`
- Test: `tests/mobile-ui.test.tsx`

- [ ] **Step 1: Write failing mobile UI test**

Create `tests/mobile-ui.test.tsx`:

```tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import MobileApp from "../src/app/MobileApp"

describe("MobileApp", () => {
  it("renders the paired mobile task entry", () => {
    render(<MobileApp token="abc123" />)

    expect(screen.getByRole("heading", { name: "手机待办" })).toBeInTheDocument()
    expect(screen.getByText("已连接到电脑端提醒服务")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
pnpm vitest run tests/mobile-ui.test.tsx
```

Expected: FAIL because `MobileApp` does not exist.

- [ ] **Step 3: Implement mobile API helpers**

Append to `src/app/api.ts`:

```ts
export async function listMobileTasks(token: string): Promise<Task[]> {
  const response = await fetch("/api/tasks", {
    headers: { "x-pairing-token": token },
  })
  if (!response.ok) throw new Error("mobile_list_failed")
  const data = (await response.json()) as { tasks: Task[] }
  return data.tasks
}

export async function createMobileTask(token: string, input: CreateTaskInput): Promise<Task> {
  const response = await fetch("/api/tasks", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
      "x-pairing-token": token,
    },
    method: "POST",
  })
  if (!response.ok) throw new Error("mobile_create_failed")
  const data = (await response.json()) as { task: Task }
  return data.task
}
```

- [ ] **Step 4: Implement mobile app route**

Create `src/app/MobileApp.tsx`:

```tsx
import { useEffect, useState } from "react"
import type { Task } from "./types"
import { createMobileTask, listMobileTasks } from "./api"
import { TaskForm } from "../features/tasks/TaskForm"
import { TaskList } from "../features/tasks/TaskList"

interface MobileAppProps {
  token: string | null
}

export default function MobileApp({ token }: MobileAppProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("需要重新配对")
      return
    }
    listMobileTasks(token)
      .then(setTasks)
      .catch(() => setError("无法连接到电脑端提醒服务"))
  }, [token])

  if (error) {
    return (
      <main className="app-shell mobile-shell">
        <h1>手机待办</h1>
        <p>{error}</p>
      </main>
    )
  }

  return (
    <main className="app-shell mobile-shell">
      <p className="eyebrow">已连接到电脑端提醒服务</p>
      <h1>手机待办</h1>
      <TaskForm
        onSubmit={(values) => {
          if (!token) return
          createMobileTask(token, values).then((task) => setTasks((current) => [task, ...current]))
        }}
      />
      <TaskList tasks={tasks} onComplete={() => undefined} />
    </main>
  )
}
```

Update `src/main.tsx`:

```tsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import MobileApp from "./app/MobileApp"
import "./styles.css"

const url = new URL(window.location.href)
const isMobileRoute = url.pathname.startsWith("/mobile")
const token = url.searchParams.get("token")

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isMobileRoute ? <MobileApp token={token} /> : <App />}</React.StrictMode>,
)
```

- [ ] **Step 5: Run focused checks**

Run:

```powershell
pnpm vitest run tests/mobile-ui.test.tsx
pnpm vitest run tests/task-ui.test.tsx
```

Expected: PASS for mobile and desktop UI tests.

- [ ] **Step 6: Commit mobile route**

Run:

```powershell
git add src tests/mobile-ui.test.tsx
git commit -m "feat: add paired mobile web ui"
```

## Task 7: Add Reminder Engine, Notifications, Tray, And Autostart

**Files:**

- Create: `src-tauri/src/reminders.rs`
- Create: `src-tauri/src/notifications.rs`
- Create: `src-tauri/src/tray.rs`
- Create: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Test: `src-tauri/src/reminders.rs`

- [ ] **Step 1: Write failing reminder selection test**

Create `src-tauri/src/reminders.rs` with tests first:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use chrono::{Duration, Utc};

    #[test]
    fn due_tasks_exclude_already_notified_tasks() {
        let now = Utc::now();
        let mut task = Task::new("Stretch".to_string(), None, Some(now - Duration::minutes(1))).unwrap();
        task.mark_notified(now);

        assert!(due_tasks(vec![task], now).is_empty());
    }
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml reminders
```

Expected: FAIL because `due_tasks` does not exist.

- [ ] **Step 3: Implement reminders and notification abstraction**

Create `src-tauri/src/reminders.rs`:

```rust
use std::time::Duration as StdDuration;

use chrono::Utc;
use tokio::time::sleep;

use crate::{domain::Task, notifications::Notifier, store::{TaskListFilter, TaskStore}};

pub fn due_tasks(tasks: Vec<Task>, now: chrono::DateTime<Utc>) -> Vec<Task> {
    tasks
        .into_iter()
        .filter(|task| task.is_due_for_reminder(now))
        .collect()
}

pub async fn run_reminder_loop(store: TaskStore, notifier: impl Notifier + Clone + Send + Sync + 'static) {
    loop {
        if let Ok(tasks) = store.list_tasks(TaskListFilter::Active) {
            for mut task in due_tasks(tasks, Utc::now()) {
                if notifier.notify(&task.title, task.notes.as_str()).is_ok() {
                    task.mark_notified(Utc::now());
                    let _ = store.save_task(&task);
                }
            }
        }
        sleep(StdDuration::from_secs(15)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn due_tasks_exclude_already_notified_tasks() {
        let now = Utc::now();
        let mut task = Task::new("Stretch".to_string(), None, Some(now - Duration::minutes(1))).unwrap();
        task.mark_notified(now);

        assert!(due_tasks(vec![task], now).is_empty());
    }
}
```

Create `src-tauri/src/notifications.rs`:

```rust
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

pub trait Notifier {
    fn notify(&self, title: &str, body: &str) -> Result<(), String>;
}

#[derive(Clone)]
pub struct TauriNotifier {
    app: AppHandle,
}

impl TauriNotifier {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl Notifier for TauriNotifier {
    fn notify(&self, title: &str, body: &str) -> Result<(), String> {
        self.app
            .notification()
            .builder()
            .title(title)
            .body(body)
            .show()
            .map_err(|error| error.to_string())
    }
}
```

- [ ] **Step 4: Implement tray setup**

Create `src-tauri/src/tray.rs`:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

pub fn setup_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let open = MenuItem::with_id(app, "open", "打开", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

Update `src-tauri/src/lib.rs` to initialize plugins, tray, local API, and reminder loop:

```rust
pub mod api;
pub mod commands;
pub mod domain;
pub mod notifications;
pub mod pairing;
pub mod reminders;
pub mod store;
pub mod tray;

use std::net::{IpAddr, Ipv4Addr, SocketAddr};

use api::ApiState;
use commands::{complete_task, create_pairing_url, create_task, list_tasks, AppState};
use notifications::TauriNotifier;
use pairing::PairingService;
use reminders::run_reminder_loop;
use store::TaskStore;
use tray::setup_tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let store = TaskStore::open("todo-reminder.sqlite").expect("failed to open task database");
    let pairing = PairingService::default();
    let state = AppState {
        store: store.clone(),
        pairing: pairing.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            list_tasks,
            create_task,
            complete_task,
            create_pairing_url
        ])
        .setup(move |app| {
            setup_tray(app)?;

            let api_state = ApiState {
                store: store.clone(),
                pairing: pairing.clone(),
            };
            tauri::async_runtime::spawn(api::serve(
                api_state,
                SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), 35817),
            ));

            let notifier = TauriNotifier::new(app.handle().clone());
            tauri::async_runtime::spawn(run_reminder_loop(store.clone(), notifier));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Add to `src-tauri/Cargo.toml`:

```toml
tauri-plugin-autostart = "2"
tauri-plugin-notification = "2"
```

- [ ] **Step 5: Run focused checks**

Run:

```powershell
cargo test --manifest-path src-tauri/Cargo.toml reminders
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri build --debug
```

Expected: Rust tests PASS. Debug build succeeds and creates a desktop app bundle.

- [ ] **Step 6: Commit reminders and shell integrations**

Run:

```powershell
git add src-tauri
git commit -m "feat: add reminders notifications and tray"
```

## Task 8: Finish Documentation, Verification, And Release Artifacts

**Files:**

- Modify: `README.md`
- Create: `tasks/2026-05-27-desktop-todo-reminder/execution-log.md`
- Create: `tasks/2026-05-27-desktop-todo-reminder/verification.md`
- Create: `tasks/2026-05-27-desktop-todo-reminder/release.md`

- [ ] **Step 1: Create verification report skeleton**

Create `tasks/2026-05-27-desktop-todo-reminder/verification.md`:

```md
# Verification Report

## Commands Run

- [ ] `pnpm install`
- [ ] `pnpm vitest run`
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml`
- [ ] `pnpm tauri info`
- [ ] `pnpm tauri build --debug`

## Manual Checks

- [ ] Desktop app opens.
- [ ] Creating a task persists after app restart.
- [ ] A reminder one minute in the future triggers a system notification.
- [ ] Tray menu can open and exit the app.
- [ ] Mobile pairing link opens `/mobile?token=...`.
- [ ] Mobile route can list and add tasks with a valid token.
- [ ] Mobile route rejects requests without a token.

## Results

Record exact command output and manual check notes here during verification.
```

- [ ] **Step 2: Update README with development and usage instructions**

Add these sections to `README.md`:

```md
## Desktop Todo Reminder

This repository now contains a Tauri desktop todo reminder app with a paired mobile Web UI for same-Wi-Fi access.

## Local Development

1. Install Node.js, pnpm, Rust, and the Tauri system dependencies for your OS.
2. Run `pnpm install`.
3. Run `pnpm tauri dev` for the desktop app.
4. Run `pnpm vitest run` for frontend tests.
5. Run `cargo test --manifest-path src-tauri/Cargo.toml` for Rust tests.

## Mobile Pairing

1. Start the desktop app.
2. Open the phone pairing panel.
3. Scan the generated URL or copy it to a phone on the same Wi-Fi.
4. Use the mobile page to view, add, complete, or edit reminder times.

## First Version Scope

- Desktop task CRUD
- SQLite persistence
- Desktop reminder scheduling
- System notifications
- Tray controls
- Same-Wi-Fi mobile Web access with pairing token

## Out Of Scope

- Cloud sync
- Accounts
- Native iOS or Android apps
- Mobile background push notifications
```

- [ ] **Step 3: Run full verification**

Run:

```powershell
pnpm install
pnpm vitest run
cargo test --manifest-path src-tauri/Cargo.toml
pnpm tauri info
pnpm tauri build --debug
```

Expected:

- `pnpm vitest run`: all frontend tests PASS.
- `cargo test --manifest-path src-tauri/Cargo.toml`: all Rust tests PASS.
- `pnpm tauri info`: prints environment details.
- `pnpm tauri build --debug`: creates a debug build.

- [ ] **Step 4: Perform manual checks**

Manual checks:

1. Run `pnpm tauri dev`.
2. Create a task titled `Manual reminder check` with `remindAt` one minute in the future.
3. Confirm the task appears in the desktop list.
4. Wait for the reminder and confirm a system notification appears.
5. Use the tray menu to hide/show the main window.
6. Generate a pairing link and open it in a browser at `/mobile?token=<token>`.
7. Create a mobile task titled `Mobile sync check`.
8. Confirm the desktop list shows `Mobile sync check`.
9. Remove the token from the mobile request and confirm the API returns `401`.

- [ ] **Step 5: Record execution and release notes**

Create `tasks/2026-05-27-desktop-todo-reminder/execution-log.md`:

```md
# Execution Log

## Summary

Implemented the desktop-first todo reminder app with Tauri, React, SQLite persistence, local mobile API, pairing token access, reminder scheduling, system notifications, and tray controls.

## Deviations

Record any differences from the implementation plan here with the reason and impact.
```

Create `tasks/2026-05-27-desktop-todo-reminder/release.md`:

```md
# Release Notes

## Delivered

- Desktop task management
- Local SQLite persistence
- System reminder notifications
- Tray controls
- Same-Wi-Fi mobile Web access
- Pairing token protection

## Known Gaps

- Cloud sync is not included in this version.
- Native mobile apps are not included in this version.
- Mobile background notifications are not included in this version.
```

- [ ] **Step 6: Commit docs and verification artifacts**

Run:

```powershell
git add README.md tasks/2026-05-27-desktop-todo-reminder/execution-log.md tasks/2026-05-27-desktop-todo-reminder/verification.md tasks/2026-05-27-desktop-todo-reminder/release.md
git commit -m "docs: add todo reminder verification notes"
```

## Plan Self-Review

- Spec coverage: the tasks cover desktop task CRUD, SQLite persistence, reminder scheduling, system notifications, tray controls, mobile Web access, pairing token security, docs, tests, and manual verification.
- Scope check: the plan stays within the approved local-first desktop app plus same-Wi-Fi mobile Web scope. It does not implement cloud sync, accounts, native mobile apps, collaboration, calendar sync, or AI scheduling.
- Type consistency: frontend `Task` uses camelCase fields; Rust structs serialize with `serde(rename_all = "camelCase")`; Tauri command payloads use camelCase via serde.
- Verification coverage: frontend tests cover shell, task form, and mobile route; Rust tests cover domain, store, pairing, and reminder due filtering; manual checks cover notifications, tray, persistence, and mobile pairing.
