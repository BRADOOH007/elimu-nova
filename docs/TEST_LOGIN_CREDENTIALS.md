# 🔐 Test Login Credentials

**Date**: November 17, 2025  
**Environment**: Development/Testing

---

## 📋 Available Test Accounts

### 1. Super Admin
- **Email**: `admin@elimunova.ai`
- **Password**: `password123`
- **Role**: Super Administrator
- **Access**: Full system access, all features

### 2. School Admin
- **Email**: `admin@demoschool.edu`
- **Password**: `password123`
- **Role**: School Administrator
- **School**: Demo School
- **Access**: School management, reports, settings

### 3. Teacher
- **Email**: `teacher@demoschool.edu`
- **Password**: `password123`
- **Role**: Teacher
- **School**: Demo School
- **Access**: Lesson plans, assignments, student management, AI tools

### 4. Students

#### Student 1 - Jane Student
- **Email**: `student@demoschool.edu`
- **Password**: `Student@123`
- **Role**: Student
- **School**: Demo School
- **Access**: Dashboard, assignments, AI tutor, learning resources

#### Student 2 - Rael Wanjiku
- **Email**: `rael@gmail.com`
- **Password**: `Student@123`
- **Role**: Student
- **School**: Demo School
- **Access**: Dashboard, assignments, AI tutor, learning resources

#### Student 3 - Hekima Praise
- **Email**: `hekimapraise@gmail.com`
- **Password**: `Student@123`
- **Role**: Student
- **School**: Hopewell STEM Academy
- **Class**: Mathematics grade 4
- **Access**: Dashboard, assignments, AI tutor, learning resources

#### Student 4 - Angel Wanjiru
- **Email**: `angel@gmail.com`
- **Password**: `Student@123`
- **Role**: Student
- **School**: Hopewell STEM Academy
- **Class**: Mathematics grade 4
- **Access**: Dashboard, assignments, AI tutor, learning resources

---

## 🔑 Default Passwords

- **All Students**: `Student@123`
- **Teachers & Admins**: `password123`

---

## 📝 Notes
- **Email**: `student@demoschool.edu`
- **Password**: `password123`
- **Role**: Student
- **School**: Demo School
- **Teacher**: John Teacher
- **Access**: Assignments, AI tutor, learning resources

---

## 🏫 Demo School Information

- **Name**: Demo School
- **Address**: 123 Education Street, Nairobi, Kenya
- **Phone**: +254 700 000 000
- **Email**: info@demoschool.edu
- **Status**: Active
- **Subscription**: Premium Plan (Active)

---

## 🎯 Quick Login Guide

### To Test Student Features:
1. Go to login page
2. Enter: `student@demoschool.edu`
3. Password: `password123`
4. Click "Sign In"

### To Test Teacher Features:
1. Go to login page
2. Enter: `teacher@demoschool.edu`
3. Password: `password123`
4. Click "Sign In"

### To Test Admin Features:
1. Go to login page
2. Enter: `admin@demoschool.edu` (School Admin)
   OR `admin@elimunova.ai` (Super Admin)
3. Password: `password123`
4. Click "Sign In"

---

## 🔒 Security Notes

⚠️ **Important**: These are TEST credentials only!

- **DO NOT** use these credentials in production
- **CHANGE** all passwords before going live
- **CREATE** new users with strong passwords for production
- **DELETE** or disable test accounts in production

---

## 📝 Default Password

All test accounts use the same password for convenience:
- **Password**: `password123`

This password is:
- ✅ Easy to remember for testing
- ❌ NOT secure for production
- ❌ Should be changed immediately in production

---

## 🎓 Student Account Details

The default student account has:
- **Name**: Jane Student
- **Email**: student@demoschool.edu
- **School**: Demo School
- **Teacher**: John Teacher
- **Status**: Active
- **Access to**:
  - AI Tutor
  - Assignments
  - Learning Resources
  - Progress Tracking
  - AI Tools (Images & Presentations)

---

## 👨‍🏫 Teacher Account Details

The default teacher account has:
- **Name**: John Teacher
- **Email**: teacher@demoschool.edu
- **School**: Demo School
- **Students**: 1 (Jane Student)
- **Status**: Active
- **Access to**:
  - Create Lesson Plans
  - Create Assignments
  - Manage Students
  - AI Tools (Images & Presentations)
  - Generate Schemes of Work
  - View Reports

---

## 🔄 Resetting Test Data

If you need to reset the test data:

```bash
# Reset database and reseed
npx prisma migrate reset

# Or just reseed
npx prisma db seed
```

This will recreate all test accounts with the same credentials.

---

## 📞 Support

If you have issues logging in:
1. Verify the database is seeded
2. Check that the email is correct
3. Ensure password is `password123`
4. Try resetting the database

---

## ✅ Quick Reference

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@elimunova.ai | password123 |
| School Admin | admin@demoschool.edu | password123 |
| Teacher | teacher@demoschool.edu | password123 |
| **Student** | **student@demoschool.edu** | **password123** |

---

**Created**: November 17, 2025  
**For**: Testing and Development Only  
**Status**: Active

