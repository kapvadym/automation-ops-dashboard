# Rate Limits

Acme Tasks API enforces per-workspace rate limits to keep the platform
stable for everyone.

## Limits

- **Standard plan**: 60 requests per minute per workspace.
- **Pro plan**: 300 requests per minute per workspace.
- **Enterprise plan**: custom limits, contact sales.

Limits apply per workspace, not per API key — if you generate multiple
keys for the same workspace, they all share the same quota.

## Response headers

Every response includes:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1699999999
```

`X-RateLimit-Reset` is a Unix timestamp for when the current window
resets.

## Exceeding the limit

Requests over the limit receive a `429 Too Many Requests` response with a
`Retry-After` header (in seconds). We recommend exponential backoff:
wait `Retry-After` seconds, and if you hit another 429, double the wait
before retrying again, up to a maximum of 60 seconds between retries.

## Burst behavior

The limit is a sliding window, not a fixed bucket — sending 60 requests in
the first second of a minute and then waiting will not immediately unlock
another 60; the window slides continuously. Spread requests evenly rather
than bursting when possible.

## Requesting a higher limit

Standard and Pro plan workspaces can request a temporary limit increase by
emailing support with an expected traffic pattern. Temporary increases are
typically approved within one business day.
