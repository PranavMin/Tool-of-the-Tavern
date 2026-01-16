import { extractSlug } from "./util.js";

export async function getTop8(eventUrl) {
  const eventSlug = extractSlug(eventUrl);
  
  const apiKey = import.meta.env.VITE_STARTGG_KEY;
  if (!apiKey) throw new Error("API key not set (VITE_STARTGG_KEY)");

  const query = `query EventStandings($slug: String) {
        event(slug: $slug) {
            standings(query: { perPage: 8, page: 1 }) {
                nodes {
                    placement
                    entrant { name }
                }
            }
        }
    }`;

  const res = await fetch("https://api.start.gg/gql/alpha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables: { slug: eventSlug } }),
  });

  const json = await res.json();
  return json.data?.event?.standings?.nodes ?? [];
}
