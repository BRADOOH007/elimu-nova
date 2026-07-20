import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const parents = await prisma.parent.findMany({ 
    include: { 
      user: true, 
      students: { include: { student: { include: { user: true } } } } 
    } 
  });
  
  if (parents.length === 0) {
    console.log('No parent records found - need to create one');
  } else {
    for (const p of parents) {
      console.log('Parent:', p.user.email, p.user.name);
      if (p.students.length > 0) {
        console.log('  Students:', p.students.map(s => s.student.user.email).join(', '));
      }
    }
  }

  const allUsers = await prisma.user.findMany({ 
    where: { role: 'PARENT' }, 
    select: { email: true, name: true } 
  });
  console.log('All parent users:', JSON.stringify(allUsers));
}

main().catch(console.error).finally(() => prisma.$disconnect());
