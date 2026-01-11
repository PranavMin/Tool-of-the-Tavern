export function extractSlug(input) {
  // If they paste the whole URL, strip the domain
  if (input.includes("start.gg/")) {
    return input.split("start.gg/")[1].split("/overview")[0];
  }
  // If they just typed 'tournament/name/event/game', return as is
  return input;
}
