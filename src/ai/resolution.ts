export type NamedChoice = { id: string; name: string };

export type NameResolution =
  | { kind: 'match'; value: NamedChoice }
  | { kind: 'missing'; message: string }
  | { kind: 'ambiguous'; message: string; choices: NamedChoice[] };

export const resolveName = (
  requestedName: string,
  candidates: NamedChoice[],
  label: string
): NameResolution => {
  const normalized = requestedName.trim().toLocaleLowerCase();
  const exact = candidates.filter(
    (candidate) => candidate.name.trim().toLocaleLowerCase() === normalized
  );
  const matches =
    exact.length > 0
      ? exact
      : candidates.filter((candidate) =>
          candidate.name.trim().toLocaleLowerCase().includes(normalized)
        );

  if (matches.length === 1) return { kind: 'match', value: matches[0]! };
  if (matches.length === 0) {
    return {
      kind: 'missing',
      message: `I could not find a ${label} named “${requestedName}” in this workspace.`,
    };
  }
  return {
    kind: 'ambiguous',
    message: `More than one ${label} matches “${requestedName}”.`,
    choices: matches.slice(0, 5),
  };
};

export const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
};
