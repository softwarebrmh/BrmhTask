-- Rename TaskStatus enum value done -> completed
ALTER TYPE "TaskStatus" RENAME VALUE 'done' TO 'completed';

-- Add human-readable task number (TK-1001 style, formatted in application layer)
CREATE SEQUENCE "tasks_task_number_seq";
ALTER TABLE "tasks" ADD COLUMN "task_number" INTEGER;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) AS rn FROM "tasks"
)
UPDATE "tasks" t SET "task_number" = numbered.rn FROM numbered WHERE t.id = numbered.id;

-- Seed the sequence so the next task_number continues after the highest backfilled
-- value. On an empty table, set it to 1 with is_called=false so the first nextval()
-- returns 1 (setval rejects 0, which is why an empty-DB deploy would otherwise fail).
SELECT setval(
  'tasks_task_number_seq',
  GREATEST(COALESCE((SELECT MAX("task_number") FROM "tasks"), 0), 1),
  (SELECT COUNT(*) > 0 FROM "tasks")
);

ALTER TABLE "tasks" ALTER COLUMN "task_number" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "task_number" SET DEFAULT nextval('tasks_task_number_seq');
ALTER SEQUENCE "tasks_task_number_seq" OWNED BY "tasks"."task_number";
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_number_key" UNIQUE ("task_number");

-- Drop planned effort (MVP only tracks estimated/actual/slippage)
ALTER TABLE "tasks" DROP COLUMN "planned_effort_ph";

-- Enforce single active assignee per task: deactivate all but the most recently assigned
WITH ranked AS (
  SELECT id, task_id,
    row_number() OVER (PARTITION BY task_id ORDER BY assigned_at DESC) AS rn
  FROM "task_assignees" WHERE is_active = true
)
UPDATE "task_assignees" ta
SET is_active = false, unassigned_at = now()
FROM ranked
WHERE ta.id = ranked.id AND ranked.rn > 1;

-- Drop note versioning
ALTER TABLE "notes" DROP COLUMN "version";
DROP TABLE "note_versions";
