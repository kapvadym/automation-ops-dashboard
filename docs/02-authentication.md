# Authentication

Acme Tasks API uses bearer-token authentication. Every request must include
an `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## API keys vs. OAuth

Two authentication modes are supported:

- **API keys** — a static per-workspace key, generated from Workspace
  Settings → API Keys. Best for server-to-server integrations and scripts.
- **OAuth 2.0** — for third-party apps acting on behalf of a user. Use the
  authorization-code flow against `https://api.acmetasks.dev/oauth/authorize`
  and exchange the code at `https://api.acmetasks.dev/oauth/token`. OAuth
  tokens expire after 24 hours and must be refreshed with the returned
  `refresh_token`.

## Key rotation

API keys do not expire automatically, but you can revoke and regenerate
them at any time from Workspace Settings. Revoking a key takes effect
immediately — in-flight requests using the old key will start failing with
a 401 within a few seconds.

## Scopes

API keys are workspace-scoped, not user-scoped: a key can read and write
every task list in the workspace it was generated in, regardless of which
team member generated it. There is currently no way to restrict a key to a
single task list.

## Common mistakes

- Sending the key as a query parameter instead of the `Authorization`
  header — this is rejected with a 401.
- Forgetting the `Bearer ` prefix — `Authorization: YOUR_API_KEY` alone
  will not authenticate.
- Reusing a workspace's API key across multiple unrelated integrations,
  which makes it impossible to tell which integration made a given request
  in the audit log. Generate a separate key per integration instead.
