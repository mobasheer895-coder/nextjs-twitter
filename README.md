# Twitter Backend API



---

## أولاً: إعداد المشروع

### 1. تثبيت المكتبات
قم بفتح Terminal في مجلد المشروع ونفّذ الأوامر التالية:

```bash
npm install

# Prisma
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install --save-dev prisma @types/node @types/pg

# jsonwebtoken   
npm install jsonwebtoken @types/jsonwebtoken

# bcryptjs
npm install bcryptjs  @types/bcryptjs

# zod
npm install zod
```
### ضمن مجلد المشروع الرئيسي .env انشاء ملف 
```env
DATABASE_URL="postgresql://postgres:2372005@localhost:5432/twitter_db"
JWT_SECRET=privatekey123456789
NODE_ENV=development
```
### إنشاء وجلب جداول قاعدة البيانات
```bash
npx prisma migrate dev
```
## ثانياً: تشغيل المشروع

### 1. تشغيل المشروع 

```bash
npm run dev
```