---
name: release-creator
description: "Draft an annotated git tag and matching GitHub release. Use when the user wants to tag a new version, cut a release, or write release notes. Triggers on phrases like 'tag a release', 'create v1.2.0', 'cut a release', 'release notes for', 'time we tagged'."
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Release Creator

Draft an annotated git tag and matching GitHub release for a new version. The tag message is the canonical source of release notes; the GitHub release pulls its body from that message.

## Process

1. **Find the previous tag.** `git tag --list 'v*' --sort=-v:refname | head -5`. Pick the highest existing version. Ask the user if ambiguous.
2. **List commits since then.** `git log --oneline <prev-tag>..HEAD`. Skim subjects.
3. **Read the substantive commits in detail.** For anything that touches user-visible behavior, security, persisted data, or public API, `git show --stat <sha>` and read the commit body. Concrete names (affected fields, migration numbers, error codes) are what users actually need.
4. **Group by theme, not chronology.** Sections in order: Security, Added, Changed, Fixed, Build. Drop sections that have nothing in them.
5. **Draft the message** in the style below. Show it to the user verbatim. Wait for approval. Never tag without approval.
6. **Create the annotated tag** when approved: `git tag -a vX.Y.Z -m "<message>"`. Pass the message via heredoc so formatting and blank lines survive.
7. **Do NOT push** without explicit user permission. Pushing fires CI and any release workflow, which is visible state. That is the user's call.
8. **GitHub release.** If the repo has a workflow that drafts a release from the tag body (look for `softprops/action-gh-release` with `body_path` populated from `git tag -l --format='%(contents:body)'`), pushing the tag is enough; the draft appears automatically. Otherwise, after the tag is pushed, create the release manually:
   ```
   git tag -l --format='%(contents:body)' vX.Y.Z > /tmp/notes.md
   gh release create vX.Y.Z --draft --title vX.Y.Z --notes-file /tmp/notes.md --repo <owner>/<repo>
   ```
   Default to draft. Publishing is a separate explicit step.

## Format

```
<Project> vX.Y.Z

<one-line framing if useful, e.g. "Security release. Upgrade is recommended." or "Highlights since vA.B.C (NN commits).">

Security
- ...

Added
- ...

Changed
- ...

Fixed
- ...

Build
- ...
```

- First line is the subject. Keep it short. The release workflow extracts only `%(contents:body)`, so the subject does not appear in the GitHub release body, only in the tag message.
- One blank line between sections. No section header without items.
- Hard-wrap body lines around 72 characters. Reads cleanly in `git show`, GitHub web, and email clients.

## Voice

- Concrete. Name fields, files, migrations, error codes. Not "improved security" but "fix authentication bypass via client-controlled operationName".
- Lead with the user-visible effect, then the mechanism. "Scene apply no longer sends commands to non-controllable devices" beats "Add controllable check in scene.apply".
- Active voice. One thought per bullet. If a bullet runs more than three wrapped lines, split it.
- Past tense for changes (fix, rename, drop), present tense for new capabilities ("Effects: a new top-level feature for ...").

## Don'ts

- No em dashes. Hyphen, comma, period, or rephrase. Reads the same in any rendering and avoids the AI-writing tell.
- No emojis.
- No marketing vocabulary: comprehensive, robust, seamless, modern, powerful, elegant, leverages.
- No triplets ("fast, reliable, and scalable").
- No commit hashes, no "this PR", no "this commit", no co-author trailers.
- No issue links unless the issue carries non-obvious context (CVE id, upstream advisory).

## Section guidelines

- **Security** comes first whenever present. Add a single framing line at the very top of the body: "Security release. Upgrade is recommended." for security-only releases, "This release contains a security fix." for mixed releases. Per fix, name (a) the vulnerability shape, (b) what an attacker could do, (c) the mitigation. If sessions are invalidated or a migration is required for the fix to take effect, call that out so operators know what to expect at deploy time.
- **Added** is for genuinely new functionality. Refactors and renames go in Changed.
- **Changed** is for user-visible behavior changes that are not fixes: different defaults, renamed fields, dropped controls, widened types. State the contract change explicitly so consumers know what to update.
- **Fixed** is for bugs. Lead with the failure mode, not the patch.
- **Build / CI / Docs** for tooling-only changes. Skip if cosmetic.

## Examples

### Mixed release with feature focus

```
Saffron Hive v1.1.0

Highlights since v1.0.0 (129 commits).

Added
- Effects: a new top-level feature for time-based device effects.
  Multi-track timeline editor in the web UI with undo/redo, clipboard,
  and a native-effect picker. Two modes: native (Zigbee bulb effects)
  and timeline (scheduled clip events translated to commands).

Changed
- Zigbee color commands send either {r,g,b} or {x,y}, never both.
- DeviceState.battery widened from int to float to accept fractional
  reports.

Fixed
- automation: disjoint chains no longer propagate NOT across each
  other.
- scene: tolerate bulb color round-trip drift when matching expected
  state.
```

### Security release

```
Saffron Hive v1.1.1

Security release. Upgrade is recommended.

Security
- Fix GraphQL authentication bypass. The auth middleware decided whether
  a request required auth by inspecting the client-supplied
  operationName. A request that named itself after a public operation
  (e.g. operationName=login) could select any protected field, including
  users, settings, and other authenticated queries, with no token. Auth
  is now enforced per field via an @auth schema directive.
- Rotate the JWT signing secret on first boot (migration 037). Every
  existing session token is invalidated and users will need to sign in
  again.

Added
- Web: quick-add drawer for scene targets.

Build
- Make targets for regenerating gqlgen output.
```

## Permissions

- This skill creates an annotated tag locally only.
- It does NOT push without explicit user permission. Pushing is a separate, explicit step.
- It does NOT publish a draft release without explicit user permission.
- It does NOT amend, move, or delete existing tags.
