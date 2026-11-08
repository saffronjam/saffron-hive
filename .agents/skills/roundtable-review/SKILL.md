---
name: roundtable-review
description: Review a pull request, branch diff, or working tree with independent expert agents and consensus voting. Use when the user asks for a round table, expert panel, multiple reviewers, or a review with voting or debate.
---

# Round table review

A panel of independent reviewers, each with a different lens, hunting only for defects
that genuinely matter — then made to defend those findings in front of each other.

The value is not "more reviewers". It is that **findings are challenged before they reach the
user**. A single reviewer produces a mix of real bugs, misreadings, and nitpicks, and the user has
to sort them. Here the panel does that sorting, and the vote is what separates a real defect from
a confident-sounding misreading.

You are the **moderator**. You do not hunt for bugs yourself — you define the target, assign the
lenses, adjudicate disputes, and decide what gets reported. Your judgment is the last filter.

## Parameters

Default to **5 experts** and a **4/5 reporting threshold**. If the user names a number ("3 experts",
"a panel of 7"), use it, and require at least 80% FOR votes, rounding up (3/3, 4/5, 6/7).
For a small diff, consider 3 experts unless the user specified a panel size.
State the threshold before round 1 so it is not tuned after seeing the findings.

## Repository constraints

Read `AGENTS.md` and relevant feature guidance before reviewing. This is a read-only review:
do not edit project files or publish review comments unless separately requested. Save briefs,
diff snapshots, findings, and ballots outside the tracked tree, without credentials or private data.
Follow the repository's explicit permission requirement for every state-altering Git command;
the review does not authorize fetching, checking out a baseline, creating a worktree, or committing.
Use read-only commands and available PR metadata to inspect the target instead.

## Round 0 — Pin the target (before any expert runs)

Most round table failures are not bad reviewing. They are experts reviewing _different things_.
Do this work yourself, and do not skip it.

**Resolve what "the PR" actually means.** A branch name is not a review target. Find the real
pull request (`gh pr list --head <branch>`). Check whether
the user's working tree matches the pushed branch — worktrees are often stacked on unmerged commits,
or carry uncommitted work, or another session is editing them concurrently.

**Pin an immutable commit SHA and give that SHA to every expert.** Branches move during a review.
When they do, experts reach opposite conclusions from the same evidence and the vote becomes noise.
Write the SHA into the brief and have experts diff against it explicitly.

For a working-tree review, also save the staged and unstaged diffs and copies of in-scope untracked
files. Give every expert that same snapshot; a HEAD SHA alone does not capture uncommitted changes.

**Get the complete file list — never truncate it.** Piping a `--stat` through `tail` or `head` to
save space will silently hide files, and a hidden file is often the most important one (a migration,
a generated artifact, a config default). If the output is large, write it to a file and read it.

**Establish the pre-existing failure baseline.** Use existing CI evidence or an already available
baseline checkout to identify failures at the _merge base_. Run affected tests there when possible,
following the repository's verification instructions. Otherwise state that the baseline is unverified.
Without this, experts report
unrelated broken tests as defects of the change, and you cannot tell a real regression from
background noise.

**Read the diff yourself.** You cannot moderate a dispute between two experts about code you have
not read, and adjudicating disputes is the part of this job only you can do.

## Round 1 — Independent hunt

Write one shared brief (see `references/brief-template.md`) and give every expert the same one, plus
a lens that is theirs alone. Run independent experts concurrently within the available agent limit;
use batches if needed, preserving each expert's identity for voting. If independent agents are
unavailable, disclose that limitation instead of presenting one agent's passes as a panel vote.

**Lenses must be derived from the actual diff, not chosen from a generic list.** Read what the change
does, then carve it into non-overlapping territories and tell each expert to stay inside theirs.
`references/lenses.md` has archetypes to adapt, not a menu to copy. Give each expert a handful of
concrete, pointed questions about their territory — the specific joins, the specific casts, the
specific interleavings. Vague lenses produce vague findings.

Two rules do the heavy lifting in the brief:

**The bar.** Only defects that corrupt or mis-attribute data, break production on deploy, silently
produce wrong results, damage an existing database, or create a real security or availability
hazard. Spell out what is out of scope — nits, style, naming, comment wording, doc typos, missing
tests for their own sake, refactoring opportunities, minor efficiency. Without an explicit exclusion
list you get a pile of style notes wearing a severity label.

**Verification over diff-reading.** Require experts to read the actual schema, the actual column
types, the surrounding code — and to run things where they can. Findings that were _executed_ (a
test actually failed, a query actually returned the wrong rows) survive the vote and are believed by
the user; findings inferred from a diff usually do not and should not.

Require a **"Cleared" section**: suspicious things the expert checked that turned out to be fine.
This is worth as much as the findings. It shows coverage, stops the panel from re-litigating settled
questions, and an expert who clears something another expert flags is a signal you need to chase.

Tell experts that **zero findings is a valid and respectable answer**. Otherwise they invent
findings to look useful, and a padded round 1 poisons every round after it.

## Round 2 — Assemble

Pool everything and merge duplicates into one canonical finding per defect. For each, record:

- a one-line claim, the file:line, and the concrete failure scenario
- the evidence that supports it, especially anything actually executed
- **who raised it** — corroboration by two experts under different lenses is strong signal, and
  single-source findings deserve more scrutiny in the vote

Keep the canonical wording faithful to the evidence. If an expert overstated ("100% of the time,
permanently"), do not quietly fix it — leave it and let the vote correct it, which it will.

Write the assembled list to a file. Experts need to read it in round 3, and several of them will
re-verify claims from it.

## Round 3 — Vote

Send every expert the full assembled list, including findings they have not seen, and ask for a
FOR/AGAINST vote on **every** finding — no abstentions. FOR means it clears the bar and belongs in
the report; AGAINST means do not report it, whether because the code refutes it, it is speculative,
it is below the bar, it is pre-existing, or it is already mitigated elsewhere.

Three things make the vote work:

- **Explicit permission to defect.** Tell experts to vote against their own round 1 finding if the
  assembly or another expert's evidence changed their mind, and that doing so is a good outcome.
- **A CORRECTIONS field.** Ask for one line on any finding they vote FOR that is real but overstated
  or misattributed. This is where the panel earns its keep — it converts alarming-but-sloppy claims
  into precise ones, and it is usually the highest-value output of the whole exercise.
- **Re-verification.** Tell experts to check anything outside their round 1 lens before voting FOR,
  rather than taking a colleague's word for it.

Use `references/ballot-template.md`. Resume the same expert agents so they vote with their round 1
context intact — do not spawn fresh ones.

## Round 4 — Report

Report **only** findings at or above the threshold. Show the tally for every finding, including the
ones that failed, with one line on why they failed — the user learns as much from what the panel
rejected as from what it accepted.

**Apply the corrections.** A finding reported with its original overstated wording after the panel
narrowed it is a moderator failure.

**Adjudicate factual disputes yourself.** When experts disagree about a fact — not a judgment, a
fact — go and check it personally before reporting, and say what you found. In practice the usual
cause is stale state: one expert read the working tree, another read the pushed branch, and the
branch moved. Resolve it with evidence, and tell the user which one was right and why.

Order by production severity, not by vote count or by the order they were found. Close with the
shape of the problem — which findings share a root cause, what the panel cleared, and what a
reasonable next step is. A list of six unrelated-looking bugs is much less useful than "these four
are all consequences of one cadence change".

## Moderator failure modes

These are the ones that actually happen:

- **Truncating output while establishing scope.** Hides files, produces a confidently wrong summary.
- **Letting the target drift.** Re-check PR metadata before the vote and before reporting. Keep
  reviewing the pinned snapshot; if the branch moved, report which SHA was reviewed. Do not mix
  findings from different revisions in one vote.
- **Tallying instead of judging.** The threshold filters noise; it does not absolve you of checking
  a disputed fact or of noticing that a 5/5 finding is overstated.
- **Reporting the panel's process instead of its conclusions.** The user wants the defects. Keep the
  scaffolding to a tally table.
- **Padding.** If nothing clears the threshold, say so plainly. That is a real and useful result.

## After the report

When the user requests fixes, treat each accepted finding as its own task, fix the highest-severity
first, and re-run the affected suites against the baseline from round 0 so you can tell a new failure
from a pre-existing one. If a fix breaks a test, read the test before changing it — in a good
codebase the test is usually encoding a requirement the fix violated, not an obstacle.
