# Lens archetypes

Adapt these; do not copy them. A lens works when it names the specific files and mechanisms in
_this_ diff. Derive lenses by reading the change first, then carving it into non-overlapping
territories so two experts never audit the same code — overlap wastes a reviewer and inflates
apparent corroboration in the vote.

Aim to cover four things across the panel, however you slice them: **is the data right**, **is the
logic right**, **does it survive contact with production**, and **does anything else depend on it**.

## Data source / input correctness

The code that pulls data in — queries, API clients, parsers, message consumers.
Ask: is the query grain right, can it double-count, what happens on the empty/null/zero/duplicate
case, are filters correct for the real semantics of the source system, does pagination hold, are
retries idempotent, what does a malformed record do to the rest of the batch.

## Domain / business-logic correctness

The rules the change encodes — course ownership, chat model selection, permissions, state machines.
Ask: does the new logic preserve existing invariants, what happens to records created under the old
rules, can a value move backwards, are identity and ordering preserved across updates, does a
partial or repeated operation stay correct.

## Concurrency, scheduling, and reliability

Timers, locks, transactions, retries, leases, background workers, cross-replica coordination.
Ask: enumerate the interleavings; can a timer leak or double-fire; is mutual exclusion actually held
where it is claimed; is the isolation level right; how long is a transaction open and what does it
hold; what happens when a run overruns its interval; does backoff actually back off.

## Migration, deployment, and rollout

Schema changes, config and default changes, generated artifacts, IaC.
Ask: what does the first run against an _existing_ production database do; is the migration
reversible and correctly ordered; does a rollback work; does any default change meaning for
deployments that do not set it; can the tests structurally catch a production-only value.

## Contracts, consumers, and security surface

API shapes, generated clients, UI consumers, logs, audit records, error paths.
Ask: who reads the field that changed; does a removed field still have readers; does new diagnostic
text leak credentials or customer data into logs and stored history; does an error path expose more
than it should; were any generated artifacts left unregenerated.

## Test integrity

Worth assigning explicitly on changes that touch tests, and worth folding into another lens
otherwise. Ask: do the tests prove the claims the change makes, or do they assert the implementation
back to itself; were any existing assertions weakened, deleted, or renamed into vacuity to make new
code pass; is the expensive path actually executed or stubbed out. **Weakening a real assertion to
hide a failure is itself a show-stopper finding.**

## Variations by change type

- **Pure frontend**: swap the data-source lens for rendering/state correctness, and the migration
  lens for accessibility and bundle/runtime cost.
- **Infrastructure / IaC**: keep migration-and-rollout and concurrency; add blast radius and cost,
  and least-privilege on the roles and policies being granted.
- **Library or SDK**: keep contracts; add backward compatibility and semver, and API ergonomics for
  callers who cannot be updated in lockstep.
- **Small diff (under ~200 lines)**: consider 3 experts unless the user specified a panel size. Five lenses on a small change forces
  people into each other's territory and produces padding.
