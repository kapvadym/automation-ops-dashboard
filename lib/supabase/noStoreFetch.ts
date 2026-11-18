// Next 14 caches server-side fetch() in its Data Cache by default, and
// supabase-js uses fetch under the hood — so without this, GET queries
// (status counts, the /api/health keep-alive) were served from cache and
// never reached the database.
export const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });
