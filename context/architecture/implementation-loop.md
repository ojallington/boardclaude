# Implementation Loop -- Audit, Track, Fix, Verify, Re-Audit

## What It Covers

The complete feedback loop from initial audit through fix implementation to re-audit verification. Defines the action items ledger, item lifecycle, cross-iteration intelligence, validation gates, and budget safety. Reference during M2-M4 implementation of `/bc:fix` and iterative audit flows.

---

## 1. The Complete Loop

```
/bc:audit --> agents evaluate --> synthesis report
    |
    v
action-items.json <-- extract action items from synthesis
    |
    v
/bc:fix --> read ledger --> filter actionable items
    |
    v
dependency analysis --> build conflict graph --> partition into batches
    |
    +-- Batch 1 (independent items) ----+
    |     |                             |
    |     v                             v
    |   Fix Worker A (parallel)   Fix Worker B (parallel)
    |     |                             |
    |     +-------- join ---------------+
    |                 |
    |                 v
    |   centralized validation (tsc + vitest + lint)
    |     |  (pass)              |  (fail)
    |     v                      v
    |   accept batch          revert batch
    |   mark in_progress      retry items serially
    |
    +-- Batch 2 (single item or serial fallback) --+
    |     |                                        |
    |     v                                        |
    |   implement fix --> validate --> accept/revert
    |
    v
/bc:audit --> measure score delta --> reconcile ledger
    |
    v
items improved --> mark resolved
items unchanged --> increment iterations_open
items open 3+ iterations --> mark chronic
```

**Key invariants:**
- Every fix is verified before it persists. The validation-runner acts as a gate between "fix attempted" and "fix accepted." If validation regresses, the fix is reverted and the item is marked `blocked`, not `resolved`.
- Items sharing any file ref are never placed in the same parallel batch. Conservative conflict detection ensures no file clobbering.
- Failed parallel batches gracefully fall back to serial execution — no work is lost.

---

## 2. Action Items Ledger Schema

**Location:** `.boardclaude/action-items.json`
**Status:** DERIVED (from synthesis output schema action_items)

The ledger is the persistent record of all recommendations across audit iterations. It bridges the gap between "synthesis said to do X" and "X was actually done and verified."

```json
{
  "items": [
    {
      "id": "ai-001",
      "source_audit": "audit-20260210-180000",
      "source_agent": "boris",
      "action": "Add error boundaries to dashboard components",
      "file_refs": [
        "dashboard/app/layout.tsx:15",
        "dashboard/app/audit/page.tsx:8"
      ],
      "priority": 1,
      "effort": "low",
      "status": "open",
      "resolved_in_audit": null,
      "iterations_open": 0,
      "created_at": "2026-02-10T18:00:00Z",
      "updated_at": "2026-02-10T18:00:00Z"
    }
  ],
  "metadata": {
    "total_items": 0,
    "open": 0,
    "in_progress": 0,
    "resolved": 0,
    "wont_fix": 0,
    "chronic": 0
  }
}
```

**Ledger creation:** After each `/bc:audit`, the audit-runner extracts action items from the synthesis output and upserts them into the ledger. New items get `status: "open"`. Existing items that appear again get `iterations_open` incremented.

**Deduplication:** Items are matched by normalized `action` text similarity and `file_refs` overlap. If a new audit produces an item substantially similar to an existing one, the existing item is updated rather than duplicated.

---

## 3. Item Lifecycle

```
open --> in_progress --> resolved
  |         |
  |         +--> blocked --> open (retry next iteration)
  |
  +--> wont_fix (manual, user disagrees)
  |
  +--> chronic (auto, open 3+ iterations)
```

| Status        | Meaning                                              | Set By                        |
|---------------|------------------------------------------------------|-------------------------------|
| `open`        | New item from audit, not yet attempted                | Audit-runner (auto)           |
| `in_progress` | Fix implemented, awaiting re-audit verification      | Fix-implementer (auto)        |
| `resolved`    | Re-audit confirmed score improvement in related area  | Audit-runner reconciliation   |
| `blocked`     | Fix attempted but validation regressed; reverted      | Fix-implementer (auto)        |
| `wont_fix`    | User manually marked -- disagrees with recommendation | User (manual via flag)        |
| `chronic`     | Open for 3+ consecutive audit iterations              | Audit-runner reconciliation   |

**Transition rules:**
- Only `open` and `blocked` items are eligible for `/bc:fix`.
- `in_progress` items are skipped by fix-implementer (already attempted, awaiting re-audit).
- `chronic` items remain fixable -- the flag is informational, not a blocker.
- `wont_fix` items are excluded from all automated processing.
- `blocked` items revert to `open` at the start of the next audit cycle for retry.

---

## 4. Cross-Iteration Intelligence

The ledger enables pattern detection across audit cycles that individual audits cannot see.

**Chronic item detection:**
- Items with `iterations_open >= 3` are auto-flagged as `chronic`.
- Synthesis highlights chronic items prominently: "This issue has persisted across 3 audit iterations."
- `/bc:fix` prioritizes chronic items because their persistence signals importance -- if multiple agents keep flagging them, they matter.

**Chronic item analysis:**
Chronic items often indicate architectural issues rather than local fixes:
- A chronic "improve test coverage" item may mean the test infrastructure itself is missing.
- A chronic "reduce bundle size" item may require a dependency audit, not component optimization.
- Synthesis should note when chronic items may need architectural solutions.

**Score trajectory tracking:**
The ledger, combined with `state.json` score_history, reveals:
- Which fixes actually improved scores (correlation, not causation -- but useful signal).
- Which areas plateau despite repeated fixes (diminishing returns).
- Whether the project is on track to meet `scoring.iteration_target` from the panel config.

---

## 5. Validation Gate

Every fix goes through a validation gate. No fix persists if it makes things worse.

**Gate sequence:**
1. Run validation-runner before first fix (establish baseline).
2. Implement fix for one action item.
3. Run validation-runner after the fix.
4. Compare metrics: type errors, test pass count, lint score, build success.
5. If any metric regresses: revert the fix, mark item as `blocked`.
6. If all metrics hold or improve: keep the fix, mark item as `in_progress`.
7. Repeat for next action item.

**Baseline metrics tracked:**

| Metric          | Source Command         | Regression = |
|-----------------|------------------------|--------------|
| Type errors     | `npm run typecheck`    | Count increases |
| Test pass count | `npm test`             | Count decreases |
| Lint score      | `npm run lint`         | Score decreases |
| Build success   | `npm run build`        | Build fails     |

**Edge cases:**
- If no test suite exists, skip test comparison (do not fail on missing tests).
- If `typecheck` script is not configured, skip type error comparison.
- If ALL validation commands fail (broken environment), abort `/bc:fix` entirely and report the issue.
- If a fix touches files outside the evaluated project scope, flag for manual review.

**Revert mechanism:**
Fixes are applied in a git-trackable way. Revert uses `git checkout -- <files>` for the specific files touched by the failed fix. This keeps successful fixes from earlier in the batch intact.

---

## 6. Budget Safety

Each `/bc:fix` run consumes API tokens for the fix-implementer agent plus validation-runner invocations. Budget tracking prevents runaway costs.

**Cost estimation:**
- Each fix-implement cycle: ~$1-3 depending on fix complexity and file count.
- Validation-runner per invocation: ~$0.10-0.50 (Bash commands, minimal LLM usage).
- Full `/bc:fix` run with 5-10 items: ~$5-15.
- Re-audit after fixes: ~$8-20 (full panel audit cost).

**Budget controls:**
- Track cumulative API cost per `/bc:fix` session.
- Log cost per individual fix for optimization insights.
- If running total approaches a configurable budget checkpoint (default: no limit), pause and ask the user whether to continue.
- Cost data saved to `.boardclaude/validation/fix-costs.json` for review.

**Cost optimization levers:**
- Fix items in priority order -- highest-impact items first means early abort still captures most value.
- Batch related fixes (same file, same concern) into a single fix-implement cycle.
- Use Sonnet for fix-implementer (fixes are typically mechanical, not requiring deep reasoning).
- Skip validation-runner for documentation-only fixes (README, comments) -- these cannot regress metrics.
