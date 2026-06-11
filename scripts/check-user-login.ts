import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'larrymarongo7@gmail.com'
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      firstName: true,
      lastName: true,
      password: true
    }
  })

  if (!user) {
    console.log('❌ User NOT found in database:', email)
    console.log('   This user needs to be created or the email is different.')
  } else {
    console.log('✅ User found:')
    console.log('   Name:', user.firstName, user.lastName)
    console.log('   Role:', user.role)
    console.log('   Active:', user.isActive)
    console.log('   Has password hash:', !!user.password)
    
    // Test common passwords
    const testPasswords = ['Student@123', 'password', 'Password123', 'admin', '123456']
    for (const pwd of testPasswords) {
      const match = await bcrypt.compare(pwd, user.password)
      if (match) {
        console.log('   ⚠️  Password matches:', pwd)
        break
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
