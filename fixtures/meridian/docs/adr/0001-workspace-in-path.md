# ADR 0001: Workspace slug in the path

Status: accepted (2025-03)

## Context

Most customers run more than one operating unit. Early builds kept the active workspace in a cookie,
and links pasted between teams opened in whichever workspace the reader had last used.

## Decision

Every operational page lives under `/w/<workspace>/`. The workspace layout validates the slug and
returns a 404 for unknown workspaces. Records (shipments, exceptions, invoices) belong to exactly one
workspace and are looked up by workspace and ID together.

## Consequences

- Links are stable and shareable.
- Organization-level views that span workspaces live under `/org` and link each row into its own
  workspace.
