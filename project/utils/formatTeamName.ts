export function formatTeamName(teamName: string): string {
  const maxLen = 14;

  // If it's short enough, no change needed
  if (teamName.length <= maxLen) {
    return teamName;
  }

  let result = teamName;
  let formatted: string[] = [];

  while (result.length > maxLen) {
    // Find the last space before or at maxLen
    let breakIndex = result.lastIndexOf(" ", maxLen);

    if (breakIndex === -1) {
      // No space found before 12 chars, just break at maxLen
      breakIndex = maxLen;
    }

    // Slice at the break
    formatted.push(result.slice(0, breakIndex).trim());
    result = result.slice(breakIndex).trim();
  }

  // Push the remaining part
  if (result.length > 0) {
    formatted.push(result);
  }

  return formatted.join("\n");
}
