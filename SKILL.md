---
name: codex-work-review
description: Start and use a local Codex conversation review workbench when the user wants to review work from Codex history by date range or keyword. The workbench lets the user select evidence and manually generate a review with Codex.
---

# Codex Work Review

Use the bundled local workbench for Codex conversation reviews.

## Start the workbench

From this skill directory, run:

```bash
node scripts/start-workbench.mjs
```

Then give the user the printed local URL. Do not click “生成复盘” or generate a review unless the user explicitly asks; opening and filtering the workbench is read-only.

The workbench requires Node.js 20+, a readable Codex history directory, and an authenticated Codex CLI. If startup reports a missing prerequisite, explain that exact requirement instead of substituting another AI service.

## Data boundaries

- Read Codex source history without modifying it.
- Store derived evidence, reviews, corrections, and logs under `~/.codex-review-workbench/data` by default.
- Keep user corrections separate from AI-generated versions.
- Missing records mean insufficient evidence, not that no work happened.
- Never include private local data in repository commits, screenshots, or issue reports.

## Stop the workbench

When the user asks to stop it, run:

```bash
node scripts/stop-workbench.mjs
```

For setup, backup, configuration, and development details, read [README.md](README.md).
