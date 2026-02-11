# Security Policy

## API Key Management

BoardClaude is a Claude Code plugin that runs locally. It does **not** collect, store, or transmit API keys.

- **Claude API keys** are managed by Claude Code itself, not by BoardClaude
- **No credentials** are stored in `.boardclaude/` state files
- Audit JSON files contain evaluation scores and text only -- no secrets
- The dashboard (`dashboard/`) is a static Next.js site with no backend API

### Best Practices

- Never commit `.env` files or API keys to the repository
- The `.gitignore` already excludes `.boardclaude/` (local state) and `.env*` files
- If using custom MCP servers with agents, manage their credentials through Claude Code's built-in credential system

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | Yes       |
| < 0.3   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in BoardClaude:

1. **Do not** open a public GitHub issue
2. Email **security@boardclaude.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
3. You will receive an acknowledgment within 48 hours
4. We will work with you to understand and address the issue before any public disclosure

## Input Validation

BoardClaude validates all data at system boundaries:

- **Audit JSON files** are validated through `parseSynthesisReport()` with field-level error reporting before entering the type system
- **Project state** and **timeline** data go through `parseProjectState()` and `parseTimeline()` validators
- **Action items ledger** is validated via `parseActionItemsLedger()`
- All validators use the `isRecord()` type guard -- no `as` casts on untrusted data
- Invalid data returns `null` with logged warnings rather than crashing

## Dependencies

- The dashboard uses Next.js, React, Recharts, and Framer Motion
- Run `npm audit` periodically in `dashboard/` to check for known vulnerabilities
- The plugin itself has no runtime dependencies beyond Claude Code
