## Summary
<!-- 1-3 sentences: what does this PR do and why? -->

## Changes
<!-- Bullet list of the actual changes -->
-
-

## Roadmap reference
<!-- Which week / milestone does this advance? See docs/ROADMAP.md -->

## Testing
<!-- How did you verify this works? -->
- [ ] `ruff check .` passes (backend)
- [ ] `npm run type-check` passes (frontend)
- [ ] `pytest -q` passes (backend)
- [ ] `npm run build` passes (frontend)
- [ ] Manually verified in browser

## Screenshots / demo
<!-- For UI changes, add before/after or a short clip -->

## Security review
<!-- For changes touching auth, RAG inputs, file uploads, or env vars -->
- [ ] No new secrets in code/config
- [ ] User input is validated + sanitized at the boundary
- [ ] Queries filter by `org_id` (for multi-tenant correctness)
- [ ] No CVE-flagged dep added

## Breaking changes
<!-- If yes, describe migration steps -->
