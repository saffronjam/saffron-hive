# Round 1 brief template

Write this once, save it to a file, and give every expert the same copy plus their own lens.
Replace everything in `<>`. Delete guidance lines that do not apply.

---

```markdown
# Round-table review brief — <PR identifier or local review>

**Title:** <PR title or local review description>
**Branch:** <source> -> <target>
**Repo/worktree:** <absolute path> (run all git from here)
**Review target:** `git diff <BASE_SHA>...<HEAD_SHA>`
**Pinned HEAD SHA:** <HEAD_SHA> <- diff against this SHA, not the branch name; it may move
Saved diff: <absolute path to saved diff file>
Working-tree snapshot: <staged/unstaged diffs and untracked-file copies, or not applicable>

<N> files, ~<X> insertions / <Y> deletions. Complete file list:

- <file> (<what changed>)
- ...

## What the change claims to do

<2-4 sentences from the PR description or local task, in your own words.>

## Known pre-existing failures (NOT defects of this change)

<Baseline evidence from CI or tests at the merge base, or explicitly state that it is unverified.>
If you hit these, note them and move on.

## Authoritative context you MUST read

- <repo/component AGENTS.md or contributing docs>
- <the schema / migrations directory>
- <generated types — column nullability and types matter>
- <the handlers or callers that consume what changed>

## Your mandate

Find **show-stopper defects only**. That means a defect that would:

- corrupt, lose, or mis-attribute data, or
- break production on deploy or on first real run, or
- silently produce wrong results, or
- damage an existing deployed database, or
- be a genuine security or availability hazard.

**Explicitly out of scope — do not report:** nits, style, naming, comment wording, doc typos,
missing tests for their own sake, refactoring opportunities, minor efficiency, log phrasing,
"could be clearer", TODOs, formatting and lint.

## Rules of evidence

- VERIFY before you claim. Read the actual schema, the actual column types, the surrounding
  code. Run the tests or a scratch query where you can. Do NOT report from the diff alone.
- A finding must state a concrete failure scenario: specific input/state -> specific wrong outcome.
- If you check something suspicious and it turns out fine, say so in a short "Cleared" list.
- Quality over quantity. **Zero findings is a valid and respectable answer.** Do not pad.
- READ-ONLY: do not edit project files, run state-altering Git commands, or post anything to GitHub.
- Inspect the pinned snapshot; do not substitute a moving branch or live working tree.

## Output format (exactly this)

### F<n>: <one-line claim>

- **File:line:** path:line
- **Severity:** show-stopper | serious
- **Failure scenario:** concrete state/input -> concrete wrong outcome
- **Evidence:** what you actually read or ran that proves it (quote the schema/code/output)
- **Confidence:** high | medium

## Cleared

- <suspicious things you checked that are actually fine>
```

---

## Per-expert lens addendum

Append to each expert's prompt — never share another expert's lens with them in round 1.

```markdown
You are **Expert <n>: <lens name>** on a <N>-expert round table review.

Read the shared brief in full and follow it exactly: <path to brief>

YOUR LENS (stay in it; other experts cover the rest):
<one or two sentences naming the files and the territory>

Interrogate specifically:

- <pointed question about a specific mechanism in the diff>
- <another — name the actual join, cast, flag, or interleaving>
- <another>

Report per the brief's output format. Show-stoppers only. Verify before claiming.
```

Pointed beats broad. "Check the SQL" is vague; "can joining resources to passages return the same
resource more than once and break pagination?" names a mechanism the expert can verify.
