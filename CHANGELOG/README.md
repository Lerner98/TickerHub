# TickerHub Changelog System

## Purpose

Internal documentation for tracking:
- Version history and features
- Architecture decisions (ADRs)
- Session notes and decisions
- Metrics and logging strategy

## File Structure

```
CHANGELOG/
├── README.md              # This file
├── METRICS_STRATEGY.md    # Logging and metrics approach
├── v0.1.0.md             # Crypto MVP release
├── v0.2.0.md             # Stock market expansion (future)
└── ...
```

## Version File Guidelines

### Naming
- Format: `vX.Y.Z.md`
- Major (X): Breaking changes, major features
- Minor (Y): New features, significant updates
- Patch (Z): Bug fixes, small improvements

### Size Limit
- **Max 500-600 lines per version file**
- If exceeding, split into focused documents
- Reference other docs instead of duplicating

### Required Sections

```markdown
# TickerHub Changelog - vX.Y.Z

**Release Date:** YYYY-MM-DD
**Branch:** branch-name
**Status:** Released / In Progress

---

## Overview
Brief summary of this version.

## Features Implemented
What was added.

## Architecture Decisions
Key technical choices (ADR format).

## API Changes
New/modified endpoints.

## Breaking Changes
What might break existing usage.

## Session Notes
Decisions made during development.

## Next Version Scope
What's planned next.
```

## When to Create New Version

1. **Feature milestone** - Stock market integration complete
2. **Major refactor** - Architecture changes
3. **Production release** - Deployed to users
4. **Breaking changes** - API modifications

## Session Notes

Add session notes to the current version file:
```markdown
## Session Notes (YYYY-MM-DD)

### Decisions Made
1. Decision and rationale
2. ...

### Open Questions
- Question needing resolution
- ...

### Action Items
- [ ] Task to complete
- ...
```

## Linking to Code

Reference code locations:
```markdown
See `server/lib/cache.ts:64` for implementation.
See ADR-003 in v0.1.0.md for rationale.
```

## Quick Commands

```bash
# View current version
cat CHANGELOG/v0.1.0.md

# Check line count
wc -l CHANGELOG/*.md

# Search across all changelogs
grep -r "cache" CHANGELOG/
```
