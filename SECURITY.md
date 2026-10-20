# Security and privacy

## Reporting

Please report security issues privately to the repository owner instead of opening a public issue containing sensitive data.

## Data boundary

- Codex conversation files are read-only.
- Derived evidence and reviews are stored locally under `data/`.
- Real local data is ignored by Git.
- Clicking “Generate review” sends the selected evidence excerpt through the user's authenticated Codex CLI. No background model calls are made.
- Review generation runs in an ephemeral, read-only Codex session.

Never attach real conversation files, tokens, cookies, account identifiers, or private absolute paths to a public issue.
