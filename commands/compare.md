# /bc:compare -- Side-by-Side Branch or Audit Comparison

Compare two strategy branches (or two specific audits) side by side.
Shows per-agent score deltas, identifies the key differentiators, and
recommends which branch to merge.

## Usage

```
/bc:compare <branch-a|audit-a> <branch-b|audit-b> [--panel <name>] [--run-audits]
```

## Parameters

- `$ARGUMENTS` -- Required: two branch names or audit IDs to compare
- `<branch-a>` / `<branch-b>` -- Branch names (e.g., `bc/dashboard-recharts bc/dashboard-d3`) or audit IDs (e.g., `audit-20260212-143022 audit-20260212-160055`)
- `--panel <name>` -- Panel to use if running new audits (default: from state.json)
- `--run-audits` -- Force fresh audits on both branches before comparing (even if recent audits exist)

## Execution Steps

1. **Validate inputs**:
   - Determine if arguments are branch names or audit IDs
   - If branches: check that both exist (either as worktrees or git branches)
   - If audit IDs: check that both audit JSON files exist in `.boardclaude/audits/`

2. **Locate or run audits**:

   For branch comparison:
   - Check each branch's `.boardclaude/audits/` for the most recent audit
   - If no audit exists (or `--run-audits` specified):
     - Navigate to the branch's worktree
     - Run `/bc:audit --effort medium` to generate fresh scores
     - Return to the original branch
   - Load the latest audit JSON from each branch

   For audit ID comparison:
   - Load both audit JSON files directly from `.boardclaude/audits/`

3. **Build comparison table**:

   For each agent in the panel:
   - Score from branch A / audit A
   - Score from branch B / audit B
   - Delta (A - B) with directional indicator
   - Mark the winner for each agent dimension

   Calculate:
   - Composite score for each branch (weighted by panel agent weights)
   - Overall winner
   - Key differentiator (which agent dimension had the largest impact on the outcome)

4. **Identify key findings**:
   - **Strengths unique to A**: Things A does well that B doesn't
   - **Strengths unique to B**: Things B does well that A doesn't
   - **Shared strengths**: Where both branches excel
   - **Shared weaknesses**: Where both branches need work
   - **Decisive factor**: The single biggest scoring difference and why it matters

5. **Generate recommendation**:
   - Which branch to merge and why
   - What to cherry-pick from the losing branch (if anything scores higher)
   - Confidence level: HIGH (>10 point gap), MEDIUM (5-10), LOW (<5)

6. **Save comparison output**:
   - Write to `.boardclaude/audits/compare-{a}-vs-{b}-{timestamp}.json`
   - Include both full audit reports plus the comparison analysis

7. **Append comparison event to timeline.json**:
   ```json
   {
     "type": "compare",
     "timestamp": "<ISO 8601>",
     "branch_a": "<name>",
     "branch_b": "<name>",
     "score_a": <composite>,
     "score_b": <composite>,
     "winner": "<name>",
     "decisive_factor": "<description>"
   }
   ```

8. **Display results**:

   ```
   Branch Comparison: bc/dashboard-recharts vs bc/dashboard-d3

   Agent              | Recharts  | D3        | Delta
   -------------------|-----------|-----------|-------
   Boris (Arch)       | 78        | 72        | +6
   Cat (Product)      | 82        | 75        | +7
   Thariq (AI)        | 70        | 74        | -4
   Lydia (Frontend)   | 80        | 65        | +15 << decisive
   Ado (Docs)         | 75        | 70        | +5
   Jason (Integration)| 77        | 72        | +5
   -------------------|-----------|-----------|-------
   COMPOSITE          | 77.0      | 71.3      | +5.7

   WINNER: bc/dashboard-recharts (confidence: HIGH)
   Decisive factor: Lydia scores Recharts +15 on DX/performance

   Recommendation: Merge bc/dashboard-recharts into main
   Cherry-pick from D3: Thariq notes D3 branch has more innovative
   data visualization approach -- consider adopting for timeline view only.
   ```

## Notes

- Comparison requires at least one completed audit per branch
- If using `--run-audits`, both audits run at medium effort to save budget
- The comparison report includes full audit data from both branches for reference
- Comparisons are non-destructive -- neither branch is modified
- Use `/bc:merge` after comparing to integrate the winning branch

$ARGUMENTS
