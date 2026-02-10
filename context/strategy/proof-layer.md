# Proof Layer — External Validation Strategy

## The Core Insight

A self-referential demo ("we used BoardClaude to build BoardClaude") is clever but unfalsifiable. Judges cannot verify whether the system's feedback on itself was genuinely useful or just flattering.

**But if BoardClaude evaluates a project the judges already have opinions about, they can immediately verify accuracy.** That is not a demo. That is a scientific claim with a testable prediction.

The proof layer turns BoardClaude from "interesting hackathon project" into "system making verifiable claims about reality."

---

## Three Tiers of Proof

### Tier 1: Early Calibration (M1-M2, Hours 0-18)

Run BoardClaude against well-known public Claude Code projects where we have strong priors about how each judge would react. The goal: establish that persona predictions align with what real judges would say.

**Target A: Compound Engineering Plugin (EveryInc)**
- Public repo, 24 agents, 13 commands, 11 skills, 4,700+ stars
- Boris directly connected: cited Dan Shipper's Compound Engineering as inspiration for CLAUDE.md workflows
- Every judge will have formed opinions about this project
- Predictions: Boris scores high on verification loops and compound knowledge. Lydia flags TypeScript strictness gaps. Cat evaluates extensibility. Thariq assesses product potential but notes it pre-dates Opus 4.6.
- **Validation:** If Agent Boris says things Boris would actually say, the persona is calibrated.
- **Why this target is safe:** It is public, well-known, and evaluating it is respectful — not invasive. Boris literally referenced it as an inspiration.

**Target B: Everything Claude Code (Affaan Mustafa)**
- Won the Forum Ventures x Anthropic hackathon (Sep 2025)
- Public repo with battle-tested configs from 10+ months of daily use
- Known winner — we know it was evaluated positively by Anthropic-adjacent judges
- Predictions: High scores across the board, with specific praise for documentation (Ado), practical utility (Cat), and developer workflow impact (Thariq)
- **What this validates:** The system correctly identifies quality — a known winner should score high.

**Target C: A deliberately mediocre project**
- Random Claude Code project from GitHub with obvious issues: weak docs, no tests, messy architecture
- Predictions: Low scores with specific, actionable feedback
- **Why this matters:** Proving the system can distinguish good from bad is as important as proving it can praise winners. If everything scores 80+, the personas are flattering, not calibrating.

**The calibration output:** For each target, save the full audit JSON with per-agent scores, consensus findings, notable disagreements, and predicted composite. This becomes the reference data for the demo video and post-hackathon analysis.

#### Fallback Plan: What If Primary Targets Are Unavailable?

If the Compound Engineering Plugin repo goes private, is deleted, or changes significantly before M1 (go-live):

| Priority | Fallback Target | What It Validates |
|----------|----------------|-------------------|
| **1B** | Everything Claude Code (Affaan Mustafa) | Known winner — system should identify quality. High scores expected across the board. If BoardClaude rates a proven winner poorly, personas need recalibration. |
| **1C** | Deliberately mediocre project | System can distinguish bad from good. If everything scores 80+, personas are flattering, not calibrating. Pick a random Claude Code project with weak docs, no tests, messy architecture. |

**Selection criteria for fallback targets:**
- Must be public GitHub repositories
- Must use Claude Code (so agent evaluation criteria apply)
- Must have enough complexity for meaningful differentiation across 6 agents
- Ideally one that judges have publicly commented on (for validation)

If ALL planned targets are unavailable, use BoardClaude's own repo at different development stages (v0.1.0 vs v0.3.0) as a before/after calibration test. The delta between early and late versions demonstrates the self-improvement loop even without an external target.

### Tier 2: Live Demo Evaluation (M6-M7, Hours 72-120)

The showstopper moment in the demo video (0:45-1:30 mark):

1. Paste Compound Engineering Plugin URL into BoardClaude dashboard
2. Click "Run Panel Audit" — six agents activate simultaneously
3. Agent Boris spots the compound loop (plan-work-review-compound), scores architecture 88, also notes marketplace.json initially included non-spec fields
4. Agent Lydia flags TypeScript strictness gaps in the CLI converter, scores 65
5. Agent Cat evaluates extensibility of the plugin architecture, scores 80
6. Agent Thariq notes it pre-dates Opus 4.6 features, scores 72
7. Radar chart fills in. Composite: ~79
8. Narrator: "Does this match what the real judges think? We think it's close."

**Why live evaluation is devastating:** The judges can immediately compare Agent Boris's evaluation with their own assessment. If it aligns, BoardClaude's credibility becomes unassailable. If it's slightly off, the refinement process IS the product story.

**The imprecision hedge:** Predictions do not need to be perfect to be compelling. If Agent Lydia gives a 65 and real Lydia would give a 70, that is close enough to be impressive. The v2 story covers any gaps: "We know this v1 has calibration room. That is why we are building the accuracy pipeline to improve it."

**Bold option (if available):** If another hackathon submission's repo is public before demo recording, evaluate it live too. Judges can then compare BoardClaude's evaluation with their own when they review that same submission. Extraordinarily bold but maximally impactful.

### Tier 3: Post-Hackathon Batch (v2 Roadmap)

The vision that turns BoardClaude from hackathon project into product:

**Phase 1 — Batch evaluation:** After submissions close (Feb 16), collect all ~500 public GitHub repos, run BoardClaude on each (headless mode, Sonnet for cost), produce predicted scores and rankings. Estimated cost: ~$300-500, time: ~4-6 hours automated.

**Phase 2 — Results comparison:** After winners announced (~Feb 21 at the SF birthday party), compare BoardClaude predicted rankings vs actual results. Calculate correlation coefficients per judge persona. Identify where personas were most/least accurate. Produce a public "BoardClaude Accuracy Report."

**Phase 3 — Calibration loop:** Using accuracy data, adjust persona weights and priorities, add new evaluation criteria discovered in gap analysis, re-run on same 500 submissions, measure improvement. This IS the product: self-improving evaluation through real-world feedback.

**The dataset this creates:** A publicly available evaluation of ~500 projects with per-persona scores, consensus analysis, predicted rankings, and (after winner announcement) accuracy metrics. This is valuable data for the developer community and positions BoardClaude as a serious tool with measurable results, not a hackathon toy.

**Cost estimate for batch evaluation:** ~$300-500 in API credits (Sonnet at ~$0.60-1 per evaluation). Time: ~4-6 hours automated pipeline. This is outside the $500 hackathon budget but is a clear v2 investment.

---

## Why This Is Strategically Powerful

### For Judges: Involuntary Calibration Exercise
- Boris watches Agent Boris evaluate the Compound Engineering Plugin — a project Boris knows intimately. If the feedback aligns with what Boris actually thinks, he *has* to score BoardClaude highly. The persona works.
- Every judge can compare BoardClaude's evaluation of other submissions against their own evaluation. This creates an involuntary testing exercise where they're VERIFYING BoardClaude's accuracy as they judge it.
- The implied challenge: "We predicted how you'd score things. Were we right?"

### For Narrative: Escalation Arc
```
Self-evaluation              -> Interesting (clever but unfalsifiable)
Known project evaluation     -> Impressive (verifiable claim)
All 500 submissions          -> Mind-blowing (audacious scale)
Predicted vs actual results  -> Visionary (real product potential)
Calibration data for v2      -> This is a product
```

Each step escalates the claim. By the end, BoardClaude is not asking to win — it is demonstrating that it can PREDICT who wins.

### For Product: Real-World Application Proof
- Hackathon organizers: Pre-screen 500 submissions, surface top 50 for human review
- YC / accelerators: Evaluate batch applications through partner-calibrated personas
- Conference CFPs: Score talk proposals through program committee personas
- Code review platforms: "How would [your tech lead] review this PR?"
- Academic peer review: Predict reviewer feedback before submission

The batch evaluation is not just a demo — it is the start of a product.

---

## Predicted Scores: Compound Engineering Plugin

| Agent | Predicted Score | Key Rationale |
|-------|----------------|---------------|
| Boris (Architecture) | 85-92 | Plan-Work-Review-Compound IS his verification philosophy. 24 agents with parallel review matches his parallel architecture approach. Marketplace.json spec deviation shows attention to detail. |
| Cat (Product) | 75-82 | Good product-market fit (4,700+ stars), clear value prop. But onboarding requires Claude Code knowledge already — not zero-config first value. |
| Thariq (AI/Research) | 70-78 | Uses subagents well, but pre-dates Agent Teams, 1M context, and Opus 4.6. Not pushing frontier capabilities. |
| Lydia (DX/Code) | 60-70 | Docs site is plain HTML, basic CSS. No TypeScript in docs. The plugin itself is Markdown files — no complex frontend to evaluate. CLI converter could use stronger type guards. |
| Ado (DevRel/Docs) | 78-85 | Good README, clear commands, docs site exists. Could use more examples, GIFs, quickstart video. |
| Jason (Integration) | 72-80 | Works as a plugin (good integration), supports OpenCode and Codex conversion (flexibility). Error handling in CLI converter could be more robust. |
| **Composite** | **74-81** | |

**Consensus predictions (4+ agents agree):**
1. The compound loop (plan-work-review-compound) is the strongest feature
2. Plugin marketplace pattern is well-designed for extensibility
3. DHH Rails Reviewer agent shows persona-based review is viable

**Predicted disagreement:**
- Boris praises simplicity and compound learning; Lydia wants stricter typing — tension between philosophy and implementation rigor
- Thariq may score lower on AI innovation (pre-dates Opus 4.6) while Boris scores high on architectural merit — the same project viewed through different lenses

**What alignment within +/- 5 points proves:**
- The persona prompts capture the *right dimensions* of each evaluator's thinking
- Weighted criteria match each evaluator's actual priorities
- The system produces differentiated scores (not generic praise) that reflect real trade-offs

**What misalignment reveals (and why that is also valuable):**
- Which persona needs refinement and in what direction
- Which evaluation criteria are missing or overweighted
- The gap analysis itself is a product feature: "BoardClaude identifies where its understanding of your evaluator is weakest"

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Agent Boris disagrees with real Boris | Frame as "our interpretation based on public statements" not "what Boris thinks." Invite correction. |
| Evaluation of known project is generic/bland | Invest heavily in persona specificity during bootstrap. Each agent must cite specific evidence from the codebase, not generic praise. |
| Judges find it presumptuous | Choose the Compound Eng Plugin (external, public), not a judge's personal repo. Include disclaimer: "BoardClaude's interpretation based on public sources." |
| Live evaluation is slow during demo | Pre-run the evaluation, show pre-recorded with live feel. Or use cached results with fresh rendering. |
| Predictions are wrong | **This is actually the strongest position.** A system that identifies its own calibration errors is more valuable than a system that gets lucky on M1. Frame it: "We ran the evaluation, found gaps in our personas, and used those gaps to improve. The gap analysis itself demonstrates BoardClaude's core value — it shows where your assumptions about evaluators are wrong, which is exactly the insight you need." The refinement process IS the product. |
| Other submissions not publicly accessible | Only evaluate public repos. Have calibration targets as reliable backup. |

**The meta-point about risk:** If predictions are perfect, BoardClaude is impressive. If predictions are imperfect but the system identifies *why* and improves, BoardClaude is *even more* impressive — because the self-improvement loop is the core product promise.

---

## What This Proves for Each Judge

| Judge | What the Proof Layer Demonstrates |
|-------|----------------------------------|
| Boris | Verification loops proven on real-world data, not just self-referential claims |
| Cat | The framework works beyond its creator's project — it is a platform |
| Thariq | Agent Teams produce calibrated intelligence, not just parallel text generation |
| Lydia | The system catches real code quality issues (typed the TypeScript gaps correctly) |
| Ado | Evaluation methodology is transparent, reproducible, and documented |
| Jason | The narrative escalation (self -> known -> all -> future) tells a compelling story |

---

## Implementation Priority

**M1 (Hours 0-6):** Run calibration audit on Compound Engineering Plugin as part of bootstrap. Save results.
**M2 (Hours 6-18):** Refine personas based on calibration results. Run on Target B (Everything Claude Code).
**M3 (Hours 18-36):** Integrate proof layer results into dashboard comparison view.
**M5 (Hours 52-72):** Document the post-hackathon batch evaluation plan in README.
**M6-M7 (Hours 72-120):** Record demo video with live evaluation of Compound Engineering Plugin. Include the "500 submissions" vision.

The proof layer is not a feature to add last. It is the strategic core that elevates every other feature from "technically interesting" to "credibly validated."
