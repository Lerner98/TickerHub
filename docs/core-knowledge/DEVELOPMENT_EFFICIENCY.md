# Development Efficiency Guide

> Strategies for minimizing token usage and API costs while maintaining development quality.

## Core Principles

### 1. Front-Load Context
**Problem:** Re-reading the same files repeatedly wastes tokens.

**Solutions:**
- Read `claude.md` at session start - it contains consolidated project knowledge
- Use targeted file reads rather than exploratory browsing
- Trust previously read file contents unless explicitly told they changed

### 2. Batch Related Operations
**Problem:** Sequential small edits consume more tokens than combined edits.

**Best Practice:**
```
INEFFICIENT: Edit line 5 -> Edit line 10 -> Edit line 15 (3 tool calls)
EFFICIENT: Single edit that modifies all three sections (1 tool call)
```

### 3. Use Grep/Glob Before Reading
**Problem:** Reading entire files to find specific content.

**Better Approach:**
```
1. Grep for pattern to locate the file and line
2. Read only the specific file/section needed
3. Make targeted edit
```

### 4. Parallel Tool Calls
When multiple independent operations are needed, execute them in parallel:
```
SEQUENTIAL: Read file A -> Read file B -> Read file C (3 rounds)
PARALLEL: Read files A, B, C simultaneously (1 round)
```

---

## Context Optimization Strategies

### Session Start Checklist
1. Read `claude.md` - comprehensive project context
2. Check git status - understand current state
3. Review todo list if continuing work
4. Ask clarifying questions BEFORE coding

### Minimize Re-Exploration
- Trust existing documentation
- Don't re-search for files you've already located
- Reference previous conversation context

### Efficient File Operations
| Task | Efficient Approach |
|------|---------------------|
| Find a function | `Grep` for function name |
| Locate file by pattern | `Glob` with specific pattern |
| Understand structure | Read existing docs first |
| Multiple file changes | Plan all edits, execute in batches |

---

## When to Use Task/Agent Tool

Use agents for:
- Open-ended exploration requiring multiple search iterations
- Complex multi-file analysis
- Research tasks where path is unclear

Don't use agents for:
- Single file reads
- Simple grep searches
- Known file locations

---

## Token-Saving Patterns

### 1. Concise Responses
- Skip unnecessary explanations for simple operations
- Report results directly without restating the task

### 2. Smart Caching
- Remember file contents within the session
- Don't re-read unchanged files

### 3. Combine Logical Changes
- Group related edits into single operations
- Plan before executing to avoid corrections

### 4. Use Existing Patterns
- Follow established code patterns (reduces explanation needed)
- Reference existing similar code rather than describing from scratch

---

## Avoiding Token Waste

### Common Wastes
1. Reading entire node_modules
2. Re-exploring understood codebases
3. Multiple failed edit attempts (read fresh first)
4. Overly verbose explanations
5. Unnecessary file reads "just to check"

### Recovery Strategies
When something fails:
1. Read the error carefully
2. Make ONE targeted fix
3. Don't over-engineer the solution

---

## Session Handoff

When ending a session:
1. Update relevant documentation
2. Create clear continuation notes
3. Commit work to appropriate branch
4. Leave todo list in clean state

This minimizes context rebuilding in next session.
