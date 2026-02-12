/** Shared type guard: checks if a value is a non-null, non-array object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Shared type guard: checks if a value is a repo info object with owner and name. */
export function isRepoInfo(
  value: unknown,
): value is { owner: string; name: string } {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.name === "string"
  );
}
