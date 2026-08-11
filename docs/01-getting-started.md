# Getting Started

Acme Tasks API is a REST API for managing tasks and task lists in a
project-management product. This guide gets you from zero to your first
successful API call.

## Base URL

All requests go to:

```
https://api.acmetasks.dev/v1
```

## 1. Create an account

Sign up at acmetasks.dev and create a workspace. Every workspace gets a
default "Personal" task list automatically.

## 2. Get an API key

Go to Workspace Settings → API Keys → Generate Key. Keys are shown only
once — store them securely. Each key is scoped to a single workspace.

## 3. Make your first request

```bash
curl https://api.acmetasks.dev/v1/tasks \
  -H "Authorization: Bearer YOUR_API_KEY"
```

A successful response returns an empty array if the workspace has no tasks
yet: `{"tasks": []}`.

## 4. Create a task

```bash
curl -X POST https://api.acmetasks.dev/v1/tasks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Write onboarding docs", "list_id": "personal"}'
```

## SDKs

Official SDKs exist for Node.js (`@acmetasks/sdk`) and Python
(`acmetasks`). Both wrap the REST API described in these docs and handle
retries and pagination automatically.
