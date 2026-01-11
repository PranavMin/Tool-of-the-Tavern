import { extractSlug } from "./util.js";

export async function getTop8(eventUrl) {
  const eventSlug = extractSlug(eventUrl);
  const result = await window.electronAPI.fetchTop8(eventSlug);
  return result;
}
