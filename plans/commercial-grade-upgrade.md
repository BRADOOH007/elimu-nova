# Commercial-Grade Upgrade Plan

## 1. Prisma Migration (Parent.schoolId)
- Create migration for new Parent.schoolId field + School.parents relation

## 2. Zod Validation on All POST/PUT Routes
- Pattern already exists: `src/lib/validate.ts` + `src/lib/api-middleware.ts`
- Strategy: Migrate all POST/PUT routes to use `route({ schema: z.object({...}) })`
- Start with most-used: teacher/students, teacher/classes, assignments, schemes

## 3. Pagination on List Routes
- Add `page`/`pageSize` query params → `skip`/`take` in Prisma
- Return `{ data, pagination: { page, pageSize, total, totalPages } }`
- Priority: teacher/students, school-admin/teachers, school-admin/students, assignments

## 4. Rate Limiting on CRUD Routes
- Use existing `rateLimitAPI` (100 req/min) config
- Wire into `api-middleware.ts` `route()` wrapper so it applies automatically
- Key by user ID or IP

## 5. Soft Delete
- Add `deletedAt DateTime?` to key models: Student, Teacher, Class, Assignment
- Filter all queries with `where: { deletedAt: null }`
- Override DELETE routes to set `deletedAt` instead of hard-delete

## 6. Audit Logging Middleware
- Middleware in `api-middleware.ts` that logs: method, path, userId, status, duration
- Store in DB audit_log table or just structured console.log

## 7. Idempotency
- Add `Idempotency-Key` header support to POST routes
- Store processed keys in Redis with TTL (24h)
- Return cached response on duplicate key

## 8. Integration Tests
- Use Vitest (already in package.json?)
- Test critical paths: student CRUD, assignment lifecycle
- Mock Prisma or use test DB

## 9. API Docs (OpenAPI)
- Generate from Zod schemas using `zod-to-openapi` or `@anatine/zod-openapi`
- Serve at `/api/docs`
