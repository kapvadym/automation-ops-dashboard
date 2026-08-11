# Error Codes

All errors return a JSON body of the form:

```json
{ "error": { "code": "string", "message": "human-readable string" } }
```

## HTTP status codes

- **400 Bad Request** — malformed JSON, or a required field is missing or
  the wrong type. The `message` names the offending field.
- **401 Unauthorized** — missing, malformed, or revoked API key. Also
  returned for expired OAuth tokens.
- **403 Forbidden** — the key is valid but the workspace's plan does not
  include the requested feature (e.g. webhooks are Pro-plan only).
- **404 Not Found** — the resource ID doesn't exist in this workspace.
  Note: requesting a real task ID that belongs to a *different* workspace
  also returns 404, not 403, to avoid leaking existence across workspaces.
- **409 Conflict** — attempting to create a task list with a name that
  already exists in the workspace.
- **429 Too Many Requests** — rate limit exceeded, see Rate Limits.
- **500 Internal Server Error** — something went wrong on our end. These
  are logged and paged automatically; retrying after a short delay is
  reasonable.

## Error codes reference

| code | meaning |
|---|---|
| `invalid_request` | malformed body or query parameters |
| `invalid_api_key` | key doesn't exist or was revoked |
| `feature_not_available` | plan doesn't include this feature |
| `resource_not_found` | task/list/webhook ID not found in this workspace |
| `duplicate_name` | a task list with this name already exists |
| `rate_limited` | too many requests, see `Retry-After` header |
| `internal_error` | unexpected server-side failure |

## Idempotency

`POST /tasks` accepts an optional `Idempotency-Key` header. Sending the
same key twice with the same body returns the original response instead of
creating a duplicate task — useful for safely retrying after a timeout or
5xx without risking duplicate creation.
