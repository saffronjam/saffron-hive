# Round 3 ballot template

Send this to **every** expert, resuming the same agents from round 1 so they vote with their
context intact. Run ballots concurrently within the available agent limit, using batches if needed.

```markdown
ROUND 3 — vote on the assembled findings for <PR identifier or local review>.

Read the assembled candidate list in full:
<absolute path to the assembled findings file>

It contains <M> candidates (A–<X>) deduplicated from all <N> round-1 reports, including findings
raised by the other experts that you have not seen before.

Vote FOR or AGAINST **reporting** each of <A, B, C, ...> to the author. All <M>, no abstentions,
no ties.

- FOR = a real, verified defect that clears the show-stopper bar in the brief and belongs in the
  final report.
- AGAINST = do not report it. Valid grounds: it is not actually a defect (the code or schema
  refutes it); it is speculative rather than verified; it is real but below the bar (a nit, a
  pre-existing condition this change does not worsen, or an acceptable documented tradeoff);
  or it is already fully mitigated elsewhere in the code.

Rules:

- Vote on the merits, not on authorship. Vote AGAINST your own round-1 finding if the assembled
  version, or another expert's evidence, has changed your mind. That is a valuable outcome, not a
  loss of face.
- You may re-check anything in the repo before voting — and you should, for any finding outside
  your round-1 lens that you are about to vote FOR. Do not take another expert's claim on trust.
- If a finding is real but materially overstated or misattributed, vote FOR and say in one line
  what should be corrected.
- READ-ONLY: no project edits, no state-altering Git commands, no GitHub posts.

Output exactly this, nothing else:

A: FOR|AGAINST — <one line, max 30 words>
B: FOR|AGAINST — <one line>
...

CORRECTIONS: <any finding you voted FOR that needs its claim narrowed or fixed, or "none">
```

## Reading the ballots

**Apply CORRECTIONS before reporting.** A claim that "all requests fail" may only hold for a
particular input. Preserve the verified failure scenario and remove unsupported generalizations.

**A lone AGAINST on an otherwise unanimous finding is a lead, not noise.** Read the reason. It is
often either a genuine refutation the others missed, or — most commonly — the dissenter was looking
at different state than everyone else. Verify the disputed fact yourself before reporting.

**Watch for a finding that flips wholesale.** If most experts vote against something they collectively
raised, the assembly probably misstated it. Consider re-assembling that one finding rather than
dropping it.

## Tally table

Show every finding, including the rejected ones:

```markdown
|       | Finding       | E1  | E2  | E3  | E4  | E5  | Result            |
| ----- | ------------- | --- | --- | --- | --- | --- | ----------------- |
| **B** | <short claim> | ✅  | ✅  | ✅  | ✅  | ✅  | **5/5 — report**  |
| **A** | <short claim> | ✅  | ✅  | ❌  | ✅  | ✅  | **4/5 — report**  |
| ~~C~~ | <short claim> | ❌  | ✅  | ✅  | ❌  | ✅  | **3/5 — dropped** |
```

Add one line under the table for each dropped finding explaining why it failed.
