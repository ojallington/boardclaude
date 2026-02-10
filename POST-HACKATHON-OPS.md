# BoardClaude v2 — Post-Hackathon Operations

> Roadmap effective Feb 17, 2026. This document outlines the validation pipeline
> that turns BoardClaude from a hackathon demo into a calibrated evaluation tool.

---

## Phase 1: Batch Evaluation of Hackathon Submissions (Week of Feb 17)

- Collect all ~500 public submission repos from the "Built with Opus 4.6" hackathon GitHub org
- Run BoardClaude in **headless mode** — no dashboard, JSON output only
- Switch all agent personas to Sonnet for cost optimization at batch scale (~$0.60-1.00 per evaluation)
- Estimated total cost: **$300-500** in API credits for the full corpus
- Estimated runtime: **4-6 hours** via automated pipeline with rate-limit-aware queuing
- Output: per-project audit JSON containing composite scores, per-dimension breakdowns, and predicted rankings
- Store all results in a structured dataset for downstream analysis

## Phase 2: Judge Feedback Collection (~Feb 21)

- After winners are announced at the SF birthday party, collect actual placement data
- Map 1st, 2nd, 3rd, and special prize winners to our predicted rankings
- Where possible, gather qualitative feedback from judges on what impressed them and what fell flat
- Record any evaluation criteria judges applied that fell outside our current dimension set
- Build a ground-truth dataset: `{repo, actual_placement, prize_category, judge_comments}`

## Phase 3: Accuracy Report & Calibration (Feb 22-28)

**Quantitative metrics:**

- Spearman rank correlation between predicted composite scores and actual placement
- Top-10 overlap: how many of our predicted top 10 appeared in the actual top 10
- Per-dimension accuracy: which evaluation axes (architecture, product, DX) were most predictive
- Per-persona accuracy: did Agent Boris's scores correlate with projects the real Boris ranked highly

**Transparency commitments:**

- Publish where personas were wrong, not just where they were right
- Identify systematic biases (e.g., did the Cat persona over-index on code quality at the expense of product impact?)
- Release the full dataset as open source: predictions, actuals, and analysis methodology
- Write-up with reproducible methodology so others can run the same analysis

## Phase 4: v2 Priorities Based on Calibration Data (March+)

**Persona refinement:**

- Adjust criteria weights per persona based on gap analysis against real judge behavior
- Add or remove evaluation dimensions based on categories judges actually used
- Tune score distributions — if our personas cluster scores too tightly, widen the spread

**New capabilities:**

- **Multi-panel consensus** — run the same project through different panel configurations, surface disagreements as signal
- **Real-time evaluation** — webhook-triggered audits on push, so teams get feedback during development
- **Community panels** — let users create, share, and fork panel configurations for their own review contexts
- **Calibration profiles** — swap in different ground-truth datasets to calibrate panels for different evaluation contexts

**Enterprise path:**

- Custom panels calibrated to internal review processes (architecture review boards, launch readiness, security audit)
- Private persona definitions with org-specific criteria and institutional knowledge
- Integration with existing CI/CD pipelines and code review tooling

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Spearman rank correlation (overall) | > 0.6 |
| Top-10 overlap | >= 5 of 10 |
| Per-persona correlation (best) | > 0.7 |
| Per-persona correlation (worst) | > 0.4 |
| Dataset release | Public, with methodology doc |

These targets are ambitious but grounded. Even partial correlation validates the core thesis:
multi-perspective AI evaluation surfaces meaningful signal about project quality.

---

*This roadmap will be updated with actual calibration results as data becomes available.*
