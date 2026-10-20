# ROADMAP

Updated: 2026-10-20

## Product boundary

An independent, local-first workbench for reviewing Codex conversation history. It is not a task manager, goal system, or multi-source activity tracker.

## Status

| Capability | Status | Evidence |
| --- | --- | --- |
| Local app and responsive top navigation | VERIFIED | desktop and narrow-screen browser checks |
| Codex source accessibility | VERIFIED | date-based JSONL records and title index read successfully |
| Unified filter and review workspace | VERIFIED | date-only, full-text keyword, all-matches and manual-selection flows |
| Built-in original review rules | IMPLEMENTED | `rules/review-rules.md`, versioned by SHA-256 |
| Manual Codex generation | VERIFIED | ephemeral read-only Codex CLI execution |
| Custom time-range review | VERIFIED | arbitrary start and end dates with selected conversation evidence |
| AI version history and separate user corrections | VERIFIED | separate `reviews/` and `corrections/` stores |
| Local-only derived data and Git exclusions | VERIFIED | `data/` layout and `.gitignore` |
| MIT open-source package files | IMPLEMENTED | README, LICENSE, CONTRIBUTING, SECURITY |
| Installable Codex Skill | IMPLEMENTED | root `SKILL.md` and cross-platform start/stop scripts |
| Public demo screenshots | PENDING | must be captured with desensitized demo data |

## Later

- Full-text conversation detail view.
- Export one review as Markdown.
- Optional monthly and yearly review formats.

These items are intentionally not part of the first release.
