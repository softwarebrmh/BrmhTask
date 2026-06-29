import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Demo credentials ───────────────────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@demo.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const staffEmail    = process.env.SEED_STAFF_EMAIL    ?? 'staff@demo.com';
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? 'Staff1234!';
  // ────────────────────────────────────────────────────────────────────────────

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Demo users already exist — skipping seed.`);
    printCredentials(adminEmail, adminPassword, staffEmail, staffPassword);
    return;
  }

  // Admin user
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: adminHash,
      fullName: 'Demo Admin',
      role: UserRole.admin,
      isEmailVerified: true,
    },
  });

  // Demo company owned by admin
  const company = await prisma.company.create({
    data: {
      name: 'BHRM Demo Company',
      slug: 'bhrm-demo-company',
      ownerId: admin.id,
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
    },
  });

  // Staff user
  const staffHash = await bcrypt.hash(staffPassword, 12);
  const staffUser = await prisma.user.create({
    data: {
      email: staffEmail,
      passwordHash: staffHash,
      fullName: 'Demo Staff',
      role: UserRole.staff,
      isEmailVerified: true,
    },
  });

  // Link staff user to the company
  await prisma.companyStaff.create({
    data: {
      companyId: company.id,
      userId: staffUser.id,
      email: staffEmail,
      designation: 'Developer',
      status: 'active',
      joinedAt: new Date(),
    },
  });

  // Demo project
  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      name: 'Demo Project',
      description: 'A sample project to explore the platform.',
      createdBy: admin.id,
    },
  });

  // Demo sprint
  const sprint = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1',
      goal: 'Get the basics working.',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
      createdBy: admin.id,
    },
  });

  // Demo task assigned to staff
  const task = await prisma.task.create({
    data: {
      sprintId: sprint.id,
      name: 'Set up the development environment',
      description: 'Install dependencies and run the app locally.',
      status: 'todo',
      priority: 'high',
      plannedEffortPh: 4,
      estimatedEffortPh: 4,
      ownerId: admin.id,
      createdBy: admin.id,
    },
  });

  await prisma.taskAssignee.create({
    data: {
      taskId: task.id,
      userId: staffUser.id,
      assignedBy: admin.id,
    },
  });

  console.log(`✓ Company   : ${company.name}`);
  console.log(`✓ Project   : ${project.name}`);
  console.log(`✓ Sprint    : ${sprint.name} (active)`);
  console.log(`✓ Task      : ${task.name}`);
  printCredentials(adminEmail, adminPassword, staffEmail, staffPassword);
  console.log('\nSeeding complete.');
}

function printCredentials(
  adminEmail: string,
  adminPassword: string,
  staffEmail: string,
  staffPassword: string,
) {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           DEMO LOGIN CREDENTIALS        │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  Admin  │  ${adminEmail.padEnd(28)} │`);
  console.log(`│         │  ${adminPassword.padEnd(28)} │`);
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  Staff  │  ${staffEmail.padEnd(28)} │`);
  console.log(`│         │  ${staffPassword.padEnd(28)} │`);
  console.log('└─────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
