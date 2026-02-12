import type { TryAgentResult, ScoreRevision } from "@/lib/types";
import { getGrade, getVerdict } from "@/lib/types";
import { WEB_AGENTS } from "@/lib/try-agents";

/**
 * Apply debate score revisions to agent results, producing a new array
 * with revised scores, composites, grades, and verdicts.
 */
export function applyRevisions(
  agentResults: TryAgentResult[],
  revisions: ScoreRevision[],
): TryAgentResult[] {
  if (revisions.length === 0) return agentResults;

  // Group revisions by agent
  const revisionsByAgent = new Map<string, ScoreRevision[]>();
  for (const rev of revisions) {
    const existing = revisionsByAgent.get(rev.agent) ?? [];
    existing.push(rev);
    revisionsByAgent.set(rev.agent, existing);
  }

  return agentResults.map((result) => {
    const agentRevisions = revisionsByAgent.get(result.agent);
    if (!agentRevisions || agentRevisions.length === 0) return result;

    // Apply score revisions
    const newScores = { ...result.scores };
    for (const rev of agentRevisions) {
      if (rev.criterion in newScores) {
        newScores[rev.criterion] = rev.revised;
      }
    }

    // Recalculate composite from agent config weights
    const agentConfig = WEB_AGENTS.find((a) => a.name === result.agent);
    let newComposite = result.composite;
    if (agentConfig) {
      const scoreValues = Object.values(newScores);
      if (scoreValues.length > 0) {
        newComposite = Math.round(
          scoreValues.reduce((sum, v) => sum + v, 0) / scoreValues.length,
        );
      }
    }

    return {
      ...result,
      scores: newScores,
      composite: newComposite,
      grade: getGrade(newComposite),
      verdict: getVerdict(newComposite),
    };
  });
}
