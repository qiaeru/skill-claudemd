# API contract

All endpoints are under `/v1` and return JSON. Errors use the envelope `{ "error": { "code": string, "message": string } }`.

## POST /v1/users

Creates a user. Body: `{ email: string, name: string, role: "admin" | "member" }`. Returns 201 with the created user, or 409 if the email already exists.

## GET /v1/users/:id

Returns the user, or 404 if not found. Requires the `users:read` scope.

## PATCH /v1/users/:id

Updates name or role. Body is a partial user. Returns 200 with the updated user.

## DELETE /v1/users/:id

Soft-deletes the user. Returns 204. The row keeps its `deleted_at` timestamp and is excluded from listings.

## GET /v1/teams

Lists teams the caller belongs to. Paginated with `?cursor=` and `?limit=` (max 100).
