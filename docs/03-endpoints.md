# Endpoints

All endpoints are relative to `https://api.acmetasks.dev/v1` and require
authentication (see Authentication).

## Tasks

### List tasks

`GET /tasks`

Query parameters:
- `list_id` (optional) — filter to a single task list.
- `status` (optional) — one of `open`, `done`, `archived`.
- `cursor` (optional) — pagination cursor from a previous response's
  `next_cursor` field.

Returns up to 50 tasks per page.

### Create a task

`POST /tasks`

Body:
```json
{ "title": "string, required", "list_id": "string, required", "due_date": "ISO 8601 date, optional" }
```

### Update a task

`PATCH /tasks/{task_id}`

Accepts a partial body with any of: `title`, `status`, `due_date`,
`list_id`. Only the fields you send are changed.

### Delete a task

`DELETE /tasks/{task_id}`

Deletion is permanent — there is no trash/undo. Consider setting
`status: "archived"` via PATCH instead if you might need the task later.

## Task lists

### List task lists

`GET /lists`

### Create a task list

`POST /lists`

Body: `{ "name": "string, required" }`

## Webhooks

`POST /webhooks` registers a URL to receive `task.created`,
`task.updated`, and `task.deleted` events. Every webhook payload is signed;
verify it using the `X-Acme-Signature` header as described in the Webhooks
guide (not covered in this excerpt set).
