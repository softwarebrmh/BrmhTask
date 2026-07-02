-- Flatten hierarchy: remove projects/sprints, rename staff -> member, role admin/staff -> owner/employee

-- 1) Remap UserRole values (admin -> owner, staff -> employee) via a new enum, in place
BEGIN;
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
CREATE TYPE "UserRole_new" AS ENUM ('owner', 'employee');
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE "role"::text
      WHEN 'admin' THEN 'owner'
      WHEN 'staff' THEN 'employee'
      ELSE "role"::text
    END
  )::"UserRole_new";
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee';
COMMIT;

-- 2) Remap AuditAction values, dropping project/sprint/staff-specific actions
--    (rows referencing removed actions are updated to closest equivalent before the type swap)
BEGIN;
DELETE FROM "audit_trails" WHERE "action"::text IN (
  'PROJECT_CREATED','PROJECT_UPDATED','PROJECT_ARCHIVED',
  'SPRINT_CREATED','SPRINT_STARTED','SPRINT_ENDED','SPRINT_UPDATED'
);

CREATE TYPE "AuditAction_new" AS ENUM ('COMPANY_CREATED', 'COMPANY_UPDATED', 'MEMBER_INVITED', 'MEMBER_JOINED', 'MEMBER_SUSPENDED', 'MEMBER_ACTIVATED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_PRIORITY_CHANGED', 'TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_DUE_DATE_CHANGED', 'TASK_EFFORT_UPDATED', 'TASK_COMPLETED', 'TASK_DELETED', 'STEP_CHECKED', 'STEP_UNCHECKED', 'STEP_CREATED', 'STEP_DELETED', 'ATTACHMENT_UPLOADED', 'ATTACHMENT_DELETED', 'NOTE_CREATED', 'NOTE_UPDATED', 'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED', 'REPLY_ADDED', 'REACTION_ADDED', 'REACTION_REMOVED');
ALTER TABLE "audit_trails" ALTER COLUMN "action" TYPE "AuditAction_new"
  USING (
    CASE "action"::text
      WHEN 'STAFF_INVITED' THEN 'MEMBER_INVITED'
      WHEN 'STAFF_JOINED' THEN 'MEMBER_JOINED'
      WHEN 'STAFF_SUSPENDED' THEN 'MEMBER_SUSPENDED'
      WHEN 'STAFF_ACTIVATED' THEN 'MEMBER_ACTIVATED'
      ELSE "action"::text
    END
  )::"AuditAction_new";
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- 3) Remap AuditEntityType values (staff -> member), dropping project/sprint rows
BEGIN;
DELETE FROM "audit_trails" WHERE "entity_type"::text IN ('project', 'sprint');

CREATE TYPE "AuditEntityType_new" AS ENUM ('company', 'member', 'task', 'attachment', 'note', 'comment', 'step');
ALTER TABLE "audit_trails" ALTER COLUMN "entity_type" TYPE "AuditEntityType_new"
  USING (
    CASE "entity_type"::text
      WHEN 'staff' THEN 'member'
      ELSE "entity_type"::text
    END
  )::"AuditEntityType_new";
ALTER TYPE "AuditEntityType" RENAME TO "AuditEntityType_old";
ALTER TYPE "AuditEntityType_new" RENAME TO "AuditEntityType";
DROP TYPE "AuditEntityType_old";
COMMIT;

-- 4) Drop project/sprint hierarchy: null out task.sprint_id first, then drop dependent tables
ALTER TABLE "tasks" ALTER COLUMN "sprint_id" DROP NOT NULL;
UPDATE "tasks" SET "sprint_id" = NULL;

ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_sprint_id_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_company_id_fkey";

ALTER TABLE "sprint_members" DROP CONSTRAINT IF EXISTS "sprint_members_added_by_fkey";
ALTER TABLE "sprint_members" DROP CONSTRAINT IF EXISTS "sprint_members_sprint_id_fkey";
ALTER TABLE "sprint_members" DROP CONSTRAINT IF EXISTS "sprint_members_user_id_fkey";

ALTER TABLE "sprints" DROP CONSTRAINT IF EXISTS "sprints_company_id_fkey";
ALTER TABLE "sprints" DROP CONSTRAINT IF EXISTS "sprints_created_by_fkey";
ALTER TABLE "sprints" DROP CONSTRAINT IF EXISTS "sprints_project_id_fkey";

ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "project_members_added_by_fkey";
ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "project_members_project_id_fkey";
ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "project_members_user_id_fkey";

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_company_id_fkey";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_created_by_fkey";

ALTER TABLE "tasks" DROP COLUMN "sprint_id";
ALTER TABLE "tasks" ALTER COLUMN "company_id" SET NOT NULL;

DROP TABLE "sprint_members";
DROP TABLE "sprints";
DROP TABLE "project_members";
DROP TABLE "projects";

DROP TYPE "ProjectStatus";
DROP TYPE "SprintStatus";

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Rename company_staff -> company_members, StaffStatus -> MemberStatus (preserves data)
ALTER TYPE "StaffStatus" RENAME TO "MemberStatus";
ALTER TABLE "company_staff" RENAME TO "company_members";
ALTER TABLE "company_members" RENAME CONSTRAINT "company_staff_pkey" TO "company_members_pkey";
ALTER TABLE "company_members" RENAME CONSTRAINT "company_staff_company_id_fkey" TO "company_members_company_id_fkey";
ALTER TABLE "company_members" RENAME CONSTRAINT "company_staff_user_id_fkey" TO "company_members_user_id_fkey";
ALTER INDEX "company_staff_company_id_user_id_key" RENAME TO "company_members_company_id_user_id_key";
ALTER INDEX "company_staff_invite_token_key" RENAME TO "company_members_invite_token_key";
