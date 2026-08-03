/**
 * Migrate Local Database to Neon Production
 * 
 * This script copies all data from your local database to Neon
 */

import { PrismaClient } from '@prisma/client'

// Local database
const localDb = new PrismaClient({
    datasources: {
        db: {
            url: process.env.LOCAL_DATABASE_URL
        }
    }
})

// Production database (Neon)
const prodDb = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function checkLocalData() {
    console.log('\n📊 Checking local database...')

    const users = await localDb.user.count()
    const schools = await localDb.school.count()
    const teachers = await localDb.teacher.count()
    const students = await localDb.student.count()
    const classes = await localDb.class.count()
    const packages = await localDb.package.count()
    const messages = await localDb.message.count()

    console.log(`   Users: ${users}`)
    console.log(`   Schools: ${schools}`)
    console.log(`   Teachers: ${teachers}`)
    console.log(`   Students: ${students}`)
    console.log(`   Classes: ${classes}`)
    console.log(`   Packages: ${packages}`)
    console.log(`   Messages: ${messages}`)

    return { users, schools, teachers, students, classes, packages, messages }
}

async function checkProdData() {
    console.log('\n📊 Checking production database...')

    const users = await prodDb.user.count()
    const schools = await prodDb.school.count()
    const teachers = await prodDb.teacher.count()
    const students = await prodDb.student.count()
    const classes = await prodDb.class.count()
    const packages = await prodDb.package.count()
    const messages = await prodDb.message.count()

    console.log(`   Users: ${users}`)
    console.log(`   Schools: ${schools}`)
    console.log(`   Teachers: ${teachers}`)
    console.log(`   Students: ${students}`)
    console.log(`   Classes: ${classes}`)
    console.log(`   Packages: ${packages}`)
    console.log(`   Messages: ${messages}`)

    return { users, schools, teachers, students, classes, packages, messages }
}

async function migrateData() {
    console.log('\n🚀 Starting data migration...\n')

    try {
        // 1. Migrate Users
        console.log('1️⃣  Migrating users...')
        const users = await localDb.user.findMany({
            include: {
                superAdmin: true,
                preferences: true
            }
        })

        for (const user of users) {
            const { superAdmin, preferences, ...userData } = user

            await prodDb.user.upsert({
                where: { id: user.id },
                update: userData,
                create: userData
            })

            if (superAdmin) {
                await prodDb.superAdmin.upsert({
                    where: { userId: user.id },
                    update: {},
                    create: { userId: user.id }
                })
            }

            if (preferences) {
                await prodDb.userPreference.upsert({
                    where: { userId: user.id },
                    update: {
                        theme: preferences.theme,
                        language: preferences.language,
                        timezone: preferences.timezone,
                        emailNotifications: preferences.emailNotifications,
                        pushNotifications: preferences.pushNotifications
                    },
                    create: {
                        userId: user.id,
                        theme: preferences.theme,
                        language: preferences.language,
                        timezone: preferences.timezone,
                        emailNotifications: preferences.emailNotifications,
                        pushNotifications: preferences.pushNotifications
                    }
                })
            }
        }
        console.log(`   ✅ Migrated ${users.length} users`)

        // 2. Migrate Schools
        console.log('2️⃣  Migrating schools...')
        const schools = await localDb.school.findMany()
        for (const school of schools) {
            await prodDb.school.upsert({
                where: { id: school.id },
                update: school,
                create: school
            })
        }
        console.log(`   ✅ Migrated ${schools.length} schools`)

        // 3. Migrate School Admins
        console.log('3️⃣  Migrating school admins...')
        const schoolAdmins = await localDb.schoolAdmin.findMany()
        for (const admin of schoolAdmins) {
            await prodDb.schoolAdmin.upsert({
                where: { userId: admin.userId },
                update: admin,
                create: admin
            })
        }
        console.log(`   ✅ Migrated ${schoolAdmins.length} school admins`)

        // 4. Migrate Teachers
        console.log('4️⃣  Migrating teachers...')
        const teachers = await localDb.teacher.findMany()
        for (const teacher of teachers) {
            await prodDb.teacher.upsert({
                where: { userId: teacher.userId },
                update: teacher,
                create: teacher
            })
        }
        console.log(`   ✅ Migrated ${teachers.length} teachers`)

        // 5. Migrate Classes
        console.log('5️⃣  Migrating classes...')
        const classes = await localDb.class.findMany()
        for (const cls of classes) {
            await prodDb.class.upsert({
                where: { id: cls.id },
                update: cls,
                create: cls
            })
        }
        console.log(`   ✅ Migrated ${classes.length} classes`)

        // 6. Migrate Students
        console.log('6️⃣  Migrating students...')
        const students = await localDb.student.findMany()
        for (const student of students) {
            await prodDb.student.upsert({
                where: { userId: student.userId },
                update: student,
                create: student
            })
        }
        console.log(`   ✅ Migrated ${students.length} students`)

        // 7. Migrate Packages
        console.log('7️⃣  Migrating packages...')
        const packages = await localDb.package.findMany()
        for (const pkg of packages) {
            await prodDb.package.upsert({
                where: { id: pkg.id },
                update: pkg,
                create: pkg
            })
        }
        console.log(`   ✅ Migrated ${packages.length} packages`)

        // 8. Migrate Payment Methods
        console.log('8️⃣  Migrating payment methods...')
        const paymentMethods = await localDb.paymentMethod.findMany()
        for (const method of paymentMethods) {
            await prodDb.paymentMethod.upsert({
                where: { id: method.id },
                update: method,
                create: method
            })
        }
        console.log(`   ✅ Migrated ${paymentMethods.length} payment methods`)

        // 9. Migrate Subscriptions
        console.log('9️⃣  Migrating subscriptions...')
        const subscriptions = await localDb.subscription.findMany()
        for (const sub of subscriptions) {
            await prodDb.subscription.upsert({
                where: { id: sub.id },
                update: sub,
                create: sub
            })
        }
        console.log(`   ✅ Migrated ${subscriptions.length} subscriptions`)

        // 10. Migrate Messages
        console.log('🔟 Migrating messages...')
        const messages = await localDb.message.findMany()
        for (const message of messages) {
            await prodDb.message.upsert({
                where: { id: message.id },
                update: message,
                create: message
            })
        }
        console.log(`   ✅ Migrated ${messages.length} messages`)

        // 11. Migrate Schemes of Work
        console.log('1️⃣1️⃣  Migrating schemes of work...')
        const schemes = await localDb.schemeOfWork.findMany()
        for (const scheme of schemes) {
            await prodDb.schemeOfWork.upsert({
                where: { id: scheme.id },
                update: scheme,
                create: scheme
            })
        }
        console.log(`   ✅ Migrated ${schemes.length} schemes of work`)

        // 12. Migrate Lesson Plans
        console.log('1️⃣2️⃣  Migrating lesson plans...')
        const lessonPlans = await localDb.lessonPlan.findMany()
        for (const plan of lessonPlans) {
            await prodDb.lessonPlan.upsert({
                where: { id: plan.id },
                update: plan,
                create: plan
            })
        }
        console.log(`   ✅ Migrated ${lessonPlans.length} lesson plans`)

        // 13. Migrate Assignments
        console.log('1️⃣3️⃣  Migrating assignments...')
        const assignments = await localDb.assignment.findMany()
        for (const assignment of assignments) {
            await prodDb.assignment.upsert({
                where: { id: assignment.id },
                update: assignment,
                create: assignment
            })
        }
        console.log(`   ✅ Migrated ${assignments.length} assignments`)

        // 14. Migrate Notifications
        console.log('1️⃣4️⃣  Migrating notifications...')
        const notifications = await localDb.notification.findMany()
        for (const notification of notifications) {
            await prodDb.notification.upsert({
                where: { id: notification.id },
                update: notification,
                create: notification
            })
        }
        console.log(`   ✅ Migrated ${notifications.length} notifications`)

        console.log('\n✅ Migration completed successfully!')

    } catch (error) {
        console.error('\n❌ Migration failed:', error)
        throw error
    }
}

async function main() {
    console.log('🔄 Database Migration Tool')
    console.log('==========================')

    try {
        // Check local data
        const localData = await checkLocalData()

        // Check production data
        const prodData = await checkProdData()

        if (localData.users === 0) {
            console.log('\n⚠️  No data found in local database. Nothing to migrate.')
            return
        }

        if (prodData.users > 0) {
            console.log('\n⚠️  Production database already has data.')
            console.log('This will update/merge data. Continue? (Ctrl+C to cancel)')
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        // Migrate
        await migrateData()

        // Verify
        console.log('\n🔍 Verifying migration...')
        await checkProdData()

        console.log('\n🎉 All done! Your data is now in Neon.')

    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    } finally {
        await localDb.$disconnect()
        await prodDb.$disconnect()
    }
}

main()
