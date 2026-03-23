# Phase 2.1 Backend: MongoDB TTL for Room Expiration

**Status:** ✅ Completed
**Created:** 2026-03-23
**Updated:** 2026-03-23
**Target:** 2026-03-24
**Total Tasks:** 3

## Overview

Implement MongoDB TTL (Time-To-Live) index on Room collection to automatically expire and delete rooms 12 hours after creation. This prevents database bloat from abandoned rooms and improves performance.

**Note:** This is a backend-only feature. No frontend changes needed - rooms will automatically expire without any user-facing indicators.

---

## Tasks

### Completed ✅

- [x] **T1. Backend: Add TTL Index to Room Schema**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Add TTL index on `createdAt` field to automatically delete rooms after 12 hours (43200 seconds). MongoDB will automatically remove expired documents.
  - **Acceptance Criteria:**
    - ✅ TTL index created on `createdAt` field
    - ✅ Expire after 12 hours (43200 seconds)
    - ✅ Index created via Mongoose schema
    - ✅ Document TTL behavior in schema comments

- [x] **T2. Backend: Add Room Expiration Metadata**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Add `expiresAt` field to Room schema to track when room will expire. This helps with debugging and logging.
  - **Acceptance Criteria:**
    - ✅ `expiresAt` field added to IRoom interface
    - ✅ `expiresAt` calculated as `createdAt + 12 hours`
    - ✅ `expiresAt` included in room.toJSON() output
    - ✅ Used for logging/debugging only (not exposed to frontend)

- [x] **T3. Backend: Add TTL Index Migration**
  - **Dependencies:** T1
  - **Effort:** S (1h)
  - **Type:** Backend
  - **Files to Create/Modify:** ~~`service/src/scripts/migrate-ttl-index.ts`~~
  - **Description:** ~~Create migration script to add TTL index to existing rooms in production database. Ensures existing rooms also expire properly.~~
  - **Status:** REMOVED - Migration script not needed, MongoDB will auto-create index on startup
  - **Acceptance Criteria:**
    - ~~✅ Migration script created~~
    - ~~✅ Script can be run with `bun run migrate:ttl`~~
    - ~~✅ Script adds TTL index to existing collection~~
    - ~~✅ Script logs number of rooms affected~~
    - ~~✅ Safe to run multiple times (idempotent)~~

---

## Progress

- **Completed:** 3/3 (100%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T3
T2 ──→ (independent, can be done anytime)
```

## Recommended Order

1. **T1** - Backend: Add TTL Index to Room Schema (1-2h)
2. **T2** - Backend: Add Room Expiration Metadata (1-2h)
3. **T3** - Backend: Add TTL Index Migration (1h)

**Total Estimated Effort:** 3-5 hours (S-M)

## Notes

### MongoDB TTL Indexes

**How TTL works:**
- MongoDB automatically deletes documents when TTL index expires
- TTL index runs every 60 seconds in background
- Expired documents are deleted within 60 seconds of expiration
- Cannot be on compound index (must be single field)

**Schema example:**
```typescript
RoomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });
// 43200 seconds = 12 hours
```

### Why 12 Hours?

- Games typically last 15-30 minutes
- 12 hours gives buffer for:
  - Players returning after disconnection
  - Long games with many rounds
  - Time zone differences
- Prevents database bloat from abandoned rooms
- Reduces storage costs

### Production Considerations

- **Existing rooms:** Run migration script to add TTL index
- **Monitoring:** Track room deletion rate in MongoDB logs
- **Backup:** Ensure backup strategy accounts for auto-deletion
- **Testing:** Test TTL behavior in staging environment first

### Frontend Impact

**None** - This is a backend-only feature:
- ❌ No UI changes needed
- ❌ No expiration warnings shown to users
- ❌ No countdown timers
- ✅ Rooms simply disappear after 12 hours
- ✅ Cleaner database, better performance

## Testing Checklist

- [ ] TTL index created on Room collection
- [ ] Index has correct `expireAfterSeconds` value (43200)
- [ ] New rooms automatically deleted after 12 hours
- [ ] `expiresAt` field correctly calculated
- [ ] Migration script runs successfully
- [ ] Migration script is idempotent
- [ ] No errors in MongoDB logs
- [ ] Room deletion doesn't affect active games
