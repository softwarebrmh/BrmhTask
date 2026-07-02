-- DropForeignKey
ALTER TABLE "sprints" DROP CONSTRAINT "sprints_project_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_sprint_id_fkey";

-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "company_id" TEXT,
ALTER COLUMN "project_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "company_id" TEXT,
ALTER COLUMN "sprint_id" DROP NOT NULL;

-- Backfill sprints.company_id from their project
UPDATE "sprints" s
SET "company_id" = p."company_id"
FROM "projects" p
WHERE s."project_id" = p."id";

-- Backfill tasks.company_id from sprint -> project
UPDATE "tasks" t
SET "company_id" = p."company_id"
FROM "sprints" s
JOIN "projects" p ON s."project_id" = p."id"
WHERE t."sprint_id" = s."id";

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
