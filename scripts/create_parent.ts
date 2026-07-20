import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Find the existing student
  const student = await prisma.student.findFirst({
    where: { user: { email: 'student@demoschool.edu' } },
    include: { user: true }
  });

  if (!student) {
    console.log('Student not found');
    return;
  }

  console.log('Found student:', student.user.email, '(ID:', student.id, ')');

  // Check if parent already exists
  const existing = await prisma.user.findUnique({ where: { email: 'parent@demo.com' } });
  if (existing) {
    console.log('Parent already exists:', existing.email);
    return;
  }

  // Create parent user + parent record + link to student
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user = await prisma.user.create({
    data: {
      email: 'parent@demo.com',
      password: hashedPassword,
      role: 'PARENT',
      firstName: 'Demo',
      lastName: 'Parent',
      isActive: true,
      parent: {
        create: {
          students: {
            create: {
              studentId: student.id
            }
          }
        }
      }
    },
    include: { parent: true }
  });

  console.log('✅ Parent created!');
  console.log('   Email: parent@demo.com');
  console.log('   Password: password123');
  console.log('   Linked to student:', student.user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
