import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@elimunova.ai' },
    update: {},
    create: {
      email: 'admin@elimunova.ai',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  await prisma.superAdmin.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id },
  })

  // School
  const school = await prisma.school.create({
    data: {
      name: 'Demo School',
      address: '123 Education Street, Nairobi, Kenya',
      phone: '+254 700 000 000',
      email: 'info@demoschool.edu',
      isActive: true,
    },
  })

  // School Admin
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@demoschool.edu' },
    update: {},
    create: {
      email: 'admin@demoschool.edu',
      password: hashedPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      isActive: true,
    },
  })

  await prisma.schoolAdmin.upsert({
    where: { userId: schoolAdmin.id },
    update: {},
    create: {
      userId: schoolAdmin.id,
      schoolId: school.id,
    },
  })

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demoschool.edu' },
    update: {},
    create: {
      email: 'teacher@demoschool.edu',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: 'TEACHER',
      isActive: true,
    },
  })

  const teacherRecord = await prisma.teacher.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      schoolId: school.id,
    },
  })

  // Student
  const student = await prisma.user.upsert({
    where: { email: 'student@demoschool.edu' },
    update: {},
    create: {
      email: 'student@demoschool.edu',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'STUDENT',
      isActive: true,
    },
  })

  await prisma.student.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      schoolId: school.id,
      teacherId: teacherRecord.id,
    },
  })

  // Create classes and assign teacher/students
  const class1 = await prisma.class.create({
    data: {
      name: 'Grade 3A',
      grade: 'Grade 3',
      subject: 'General',
      schoolId: school.id,
      teacherId: teacherRecord.id,
    },
  })

  const class2 = await prisma.class.create({
    data: {
      name: 'Grade 4B',
      grade: 'Grade 4',
      subject: 'General',
      schoolId: school.id,
      teacherId: teacherRecord.id,
    },
  })

  // Create additional students for classes
  const studentNames = [
    { first: 'Alice', last: 'Wambui' },
    { first: 'Brian', last: 'Otieno' },
    { first: 'Catherine', last: 'Njeri' },
    { first: 'David', last: 'Kiprotich' },
    { first: 'Esther', last: 'Muthoni' },
    { first: 'Francis', last: 'Mwangi' },
    { first: 'Grace', last: 'Akinyi' },
    { first: 'Henry', last: 'Ochieng' },
    { first: 'Irene', last: 'Njoki' },
    { first: 'James', last: 'Kamau' },
  ]

  for (let i = 0; i < studentNames.length; i++) {
    const { first, last } = studentNames[i]
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@demoschool.edu`
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const stuUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        firstName: first,
        lastName: last,
        role: 'STUDENT',
        isActive: true,
      },
    })

    await prisma.student.upsert({
      where: { userId: stuUser.id },
      update: {},
      create: {
        userId: stuUser.id,
        schoolId: school.id,
        teacherId: teacherRecord.id,
        classId: i < 5 ? class1.id : class2.id,
      },
    })
  }

  // Assign existing student to class1
  await prisma.student.update({
    where: { userId: student.id },
    data: { classId: class1.id },
  })

  // Create sample packages
  const basicPackage = await prisma.package.create({
    data: {
      name: 'Basic Plan',
      description: 'Perfect for small schools getting started with ElimuNova AI',
      price: 38.46, // $38.46 USD (equivalent to 5000 KES)
      duration: 30, // 30 days
      maxTeachers: 5,
      maxStudents: 100,
      features: [
        'Basic AI tutoring',
        'Progress tracking',
        'Email support',
        'Standard curriculum'
      ]
    }
  })

  const premiumPackage = await prisma.package.create({
    data: {
      name: 'Premium Plan',
      description: 'Advanced features for growing schools',
      price: 115.38, // $115.38 USD (equivalent to 15000 KES)
      duration: 30, // 30 days
      maxTeachers: 20,
      maxStudents: 500,
      features: [
        'Advanced AI tutoring',
        'Personalized learning paths',
        'Real-time analytics',
        'Priority support',
        'Custom curriculum',
        'Parent portal'
      ]
    }
  })

  const enterprisePackage = await prisma.package.create({
    data: {
      name: 'Enterprise Plan',
      description: 'Complete solution for large educational institutions',
      price: 384.62, // $384.62 USD (equivalent to 50000 KES)
      duration: 30, // 30 days
      maxTeachers: 100,
      maxStudents: 2000,
      features: [
        'Full AI suite',
        'Custom AI models',
        'Advanced analytics',
        '24/7 dedicated support',
        'Custom integrations',
        'Multi-campus support',
        'API access',
        'White-label options'
      ]
    }
  })

  // Create sample reports
  const sampleReport1 = await prisma.report.create({
    data: {
      title: 'Monthly Analytics Report',
      description: 'Comprehensive analytics report covering user activity, system performance, and key metrics',
      type: 'ANALYTICS',
      status: 'COMPLETED',
      content: JSON.stringify({
        totalUsers: 1250,
        activeUsers: 980,
        newRegistrations: 45,
        systemUptime: '99.9%',
        averageResponseTime: '120ms'
      }),
      filters: JSON.stringify({
        dateRange: '30d',
        includeInactive: false
      }),
      generatedBy: superAdmin.id,
      schoolId: school.id,
      isPublic: true
    }
  })

  const sampleReport2 = await prisma.report.create({
    data: {
      title: 'Financial Summary Q1',
      description: 'Quarterly financial report showing revenue, expenses, and profit margins',
      type: 'FINANCIAL',
      status: 'COMPLETED',
      content: JSON.stringify({
        totalRevenue: 150000,
        totalExpenses: 85000,
        netProfit: 65000,
        subscriptionRevenue: 120000,
        oneTimePayments: 30000
      }),
      filters: JSON.stringify({
        period: 'Q1',
        currency: 'KSH'
      }),
      generatedBy: superAdmin.id,
      isPublic: false
    }
  })

  const sampleReport3 = await prisma.report.create({
    data: {
      title: 'Academic Performance Analysis',
      description: 'Analysis of student performance across different subjects and grades',
      type: 'ACADEMIC',
      status: 'DRAFT',
      content: JSON.stringify({
        totalStudents: 500,
        averageGrade: 78.5,
        topPerformingSubject: 'Mathematics',
        improvementAreas: ['Science', 'Languages']
      }),
      filters: JSON.stringify({
        academicYear: '2024',
        includeAllGrades: true
      }),
      generatedBy: superAdmin.id,
      schoolId: school.id,
      isPublic: false
    }
  })

  console.log('✅ Database seeded successfully!')
  // Create system settings
  console.log('\n⚙️ Creating system settings...')
  const systemSettings = [
    {
      key: 'site_name',
      value: 'EduGenius AI',
      type: 'string',
      category: 'general',
      description: 'The name of the website/application',
      isPublic: true,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'site_description',
      value: 'Transforming education with artificial intelligence',
      type: 'string',
      category: 'general',
      description: 'Brief description of the application',
      isPublic: true,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      category: 'general',
      description: 'Enable maintenance mode to restrict access',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'max_file_upload_size',
      value: '10485760',
      type: 'number',
      category: 'general',
      description: 'Maximum file upload size in bytes (10MB)',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'email_notifications_enabled',
      value: 'true',
      type: 'boolean',
      category: 'notifications',
      description: 'Enable email notifications for users',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'registration_enabled',
      value: 'true',
      type: 'boolean',
      category: 'security',
      description: 'Allow new user registrations',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'session_timeout',
      value: '3600',
      type: 'number',
      category: 'security',
      description: 'Session timeout in seconds (1 hour)',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'allowed_file_types',
      value: '["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "gif"]',
      type: 'array',
      category: 'general',
      description: 'Allowed file types for uploads',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'backup_frequency',
      value: 'daily',
      type: 'string',
      category: 'system',
      description: 'How often to perform system backups',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    },
    {
      key: 'analytics_enabled',
      value: 'true',
      type: 'boolean',
      category: 'analytics',
      description: 'Enable analytics tracking',
      isPublic: false,
      isEditable: true,
      updatedBy: superAdmin.id
    }
  ]

  for (const setting of systemSettings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
  }

  // Create security policies
  console.log('\n🛡️ Creating security policies...')
  const securityPolicies = [
    {
      name: 'Password Policy',
      description: 'Enforce strong password requirements',
      policyType: 'PASSWORD' as any,
      rules: JSON.stringify({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90 // days
      }),
      isActive: true,
      priority: 10,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id
    },
    {
      name: 'Session Timeout Policy',
      description: 'Automatic session timeout for security',
      policyType: 'SESSION' as any,
      rules: JSON.stringify({
        timeoutMinutes: 60,
        extendOnActivity: true,
        maxSessionDuration: 480 // 8 hours
      }),
      isActive: true,
      priority: 8,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id
    },
    {
      name: 'API Rate Limiting',
      description: 'Limit API requests to prevent abuse',
      policyType: 'API_RATE_LIMITING' as any,
      rules: JSON.stringify({
        requestsPerMinute: 100,
        requestsPerHour: 1000,
        burstLimit: 20
      }),
      isActive: true,
      priority: 7,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id
    },
    {
      name: 'File Upload Security',
      description: 'Restrict file uploads for security',
      policyType: 'FILE_UPLOAD' as any,
      rules: JSON.stringify({
        allowedTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
        maxSize: 10485760, // 10MB
        scanForMalware: true
      }),
      isActive: true,
      priority: 9,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id
    }
  ]

  for (const policy of securityPolicies) {
    await prisma.securityPolicy.create({
      data: policy
    })
  }

  // Create sample security logs
  console.log('\n📊 Creating security logs...')
  const securityLogs = [
    {
      eventType: 'LOGIN_SUCCESS' as any,
      severity: 'LOW' as any,
      description: 'Successful login from admin user',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      userId: superAdmin.id,
      metadata: JSON.stringify({ loginMethod: 'credentials' })
    },
    {
      eventType: 'LOGIN_FAILED' as any,
      severity: 'MEDIUM' as any,
      description: 'Failed login attempt with invalid credentials',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: JSON.stringify({ attempts: 3, username: 'admin@test.com' })
    },
    {
      eventType: 'SUSPICIOUS_ACTIVITY' as any,
      severity: 'HIGH' as any,
      description: 'Multiple failed login attempts detected',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: JSON.stringify({ attempts: 10, timeWindow: '5 minutes' })
    },
    {
      eventType: 'PASSWORD_CHANGE' as any,
      severity: 'LOW' as any,
      description: 'Password changed successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      userId: superAdmin.id,
      metadata: JSON.stringify({ changeReason: 'user_request' })
    },
    {
      eventType: 'UNAUTHORIZED_ACCESS' as any,
      severity: 'CRITICAL' as any,
      description: 'Attempted access to restricted admin area',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: JSON.stringify({ attemptedResource: '/super-admin/users' })
    }
  ]

  for (const log of securityLogs) {
    await prisma.securityLog.create({
      data: log
    })
  }

  console.log('\n🔐 Test Login Credentials:')
  console.log('Super Admin: admin@elimunova.ai / password123')
  console.log('School Admin: admin@demoschool.edu / password123')
  console.log('Teacher: teacher@demoschool.edu / password123')
  // Create a subscription for the demo school
  const subscription = await prisma.subscription.create({
    data: {
      schoolId: school.id,
      packageId: premiumPackage.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      amount: premiumPackage.price,
      type: 'SUBSCRIPTION',
      paymentMethod: 'MANUAL',
      transactionId: 'DEMO_SUB_' + Date.now(),
      notes: 'Demo subscription for testing'
    }
  })

  console.log('Student: student@demoschool.edu / password123')
  console.log('Demo school subscription created:', subscription.id)

  // Create payment methods
  console.log('📝 Creating payment methods...')
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        name: 'Credit Card',
        type: 'CREDIT_CARD',
        description: 'Visa, Mastercard, and other credit cards',
        isActive: true
      }
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'M-Pesa',
        type: 'MOBILE_MONEY',
        description: 'Mobile money payment via M-Pesa',
        isActive: true
      }
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Bank Transfer',
        type: 'BANK_TRANSFER',
        description: 'Direct bank transfer',
        isActive: true
      }
    }),
    prisma.paymentMethod.create({
      data: {
        name: 'Cash',
        type: 'CASH',
        description: 'Cash payment at office',
        isActive: true
      }
    })
  ])

  // Create invoices for existing subscriptions
  console.log('📝 Creating invoices...')
  const subscriptions = await prisma.subscription.findMany({
    include: {
      school: true,
      package: true
    }
  })

  for (const subscription of subscriptions) {
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`
    
    // Create invoice for this subscription
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        taxAmount: subscription.amount * 0.16, // 16% VAT
        totalAmount: subscription.amount + (subscription.amount * 0.16),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        paymentMethodId: paymentMethods[Math.floor(Math.random() * paymentMethods.length)].id,
        status: Math.random() > 0.5 ? 'PAID' : 'PENDING',
        paidDate: Math.random() > 0.5 ? new Date() : null,
        notes: `Invoice for ${subscription.package.name} subscription`
      }
    })
  }

  // Create school settings for each school
  console.log('📝 Creating school settings...')
  const schools = await prisma.school.findMany()
  
  for (const school of schools) {
    // Get the school admin for this school
    const schoolAdmin = await prisma.schoolAdmin.findFirst({
      where: { schoolId: school.id },
      select: { userId: true }
    })
    
    if (schoolAdmin) {
      const schoolSettings = [
        {
          key: 'school_theme',
          value: 'light',
          type: 'string',
          category: 'appearance',
          description: 'School dashboard theme preference',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'notification_email',
          value: school.email || 'admin@school.com',
          type: 'string',
          category: 'notifications',
          description: 'Email address for notifications',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'enable_notifications',
          value: 'true',
          type: 'boolean',
          category: 'notifications',
          description: 'Enable email notifications',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'max_students_per_class',
          value: '30',
          type: 'number',
          category: 'general',
          description: 'Maximum number of students per class',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'school_timezone',
          value: 'Africa/Nairobi',
          type: 'string',
          category: 'general',
          description: 'School timezone',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'academic_year_start',
          value: '2024-01-01',
          type: 'string',
          category: 'calendar',
          description: 'Academic year start date',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'academic_year_end',
          value: '2024-12-31',
          type: 'string',
          category: 'calendar',
          description: 'Academic year end date',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'enable_parent_portal',
          value: 'true',
          type: 'boolean',
          category: 'users',
          description: 'Enable parent portal access',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'data_retention_days',
          value: '365',
          type: 'number',
          category: 'data',
          description: 'Number of days to retain student data',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        },
        {
          key: 'report_generation_frequency',
          value: 'monthly',
          type: 'string',
          category: 'reports',
          description: 'How often to generate automated reports',
          isEditable: true,
          schoolId: school.id,
          updatedBy: schoolAdmin.userId
        }
      ]
      
      for (const setting of schoolSettings) {
        await prisma.schoolSettings.upsert({
          where: { schoolId_key: { schoolId: school.id, key: setting.key } },
          update: setting,
          create: setting
        })
      }
    }
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
