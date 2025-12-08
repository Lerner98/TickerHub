# Context Management for Claude Code Sessions

> Strategies for maintaining context across sessions and managing conversation flow efficiently.

## The Context Challenge

Claude Code sessions can run long and eventually hit context limits. When context is summarized, detailed information can be lost. This document outlines strategies to preserve important context.

---

## Document-Based Context Preservation

### The `claude.md` File
This is the PRIMARY context document. It should contain:
- Project overview and current state
- Critical rules and constraints (like MOCK DATA ISOLATION)
- Tech stack and architecture
- Current phase and next steps
- Environment quirks and solutions

**Key Insight:** Keep `claude.md` updated as the project evolves. A well-maintained claude.md means less re-exploration each session.

### CONTINUE.md Pattern
When ending a session mid-work:
1. Create `CONTINUE.md` in project root
2. Include:
   - What was being worked on
   - Current progress state
   - Specific next steps
   - Any blockers or decisions needed
3. Delete it after continuing

### Changelog as Context
The `CHANGELOG/` folder serves dual purpose:
- Version history for humans
- Context recovery for Claude (what was done and why)

---

## Session Continuity Strategies

### Starting a New Session
1. Read `claude.md` first
2. Check for `CONTINUE.md`
3. Review git status and recent commits
4. Check todo list state

### Mid-Session Context Loss
If context seems lost:
- Reference specific files by path
- Quote relevant sections from docs
- Use git log to recall recent work

### Before Session Ends
- Complete atomic units of work
- Commit to appropriate branch
- Update documentation if needed
- Create CONTINUE.md if work is incomplete

---

## Efficient Context Loading

### What to Load at Session Start
| Document | When | Why |
|----------|------|-----|
| `claude.md` | Always | Core project context |
| `CONTINUE.md` | If exists | Continuation context |
| Relevant source files | As needed | Active work context |
| `CHANGELOG/latest` | If uncertain | Recent history |

### What NOT to Do
- Don't read all files "just in case"
- Don't re-explore well-documented areas
- Don't ignore existing documentation

---

## Conversation Flow Optimization

### Question Batching
If you have multiple questions, ask them together:
```
BAD:  "What framework?" -> response -> "What styling?" -> response
GOOD: "What framework and styling approach are you using?"
```

### Directive Clarity
Be specific about what you want:
```
VAGUE: "Help with the dashboard"
CLEAR: "Add a stocks section to DashboardPage.tsx after the crypto section"
```

### Context References
Reference existing work rather than re-explaining:
```
INEFFICIENT: "Create a card component with glass effect, hover states..."
EFFICIENT: "Create a StockCard matching the existing PriceCard pattern"
```

---

## Context Injection Points

### Where Claude Looks for Context
1. `claude.md` in project root (auto-loaded)
2. `CLAUDE.md` variants
3. Comments in source files
4. Documentation in `docs/`
5. Conversation history

### Making Context Discoverable
- Use clear, searchable file names
- Include context in file headers
- Cross-reference related documents

---

## Recovery from Context Loss

If important context seems lost:

1. **Check git history**
   ```bash
   git log --oneline -20
   git diff HEAD~5..HEAD
   ```

2. **Reference documentation**
   "According to claude.md, we follow the MOCK DATA ISOLATION rule..."

3. **Explicit state restoration**
   "We are on branch `feature/stock-market-expansion`, working on Phase 2 UI..."

---

## Best Practices Summary

1. **claude.md is the source of truth** - Keep it current
2. **Use CONTINUE.md for session breaks** - Clear handoff
3. **Commit frequently to branches** - Git is context
4. **Be specific in requests** - Less back-and-forth
5. **Trust the documentation** - Don't re-verify known facts
6. **Update docs as you go** - Future sessions benefit
