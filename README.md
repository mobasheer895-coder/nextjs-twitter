# Twitter Backend API



---

## أولاً: إعداد المشروع

### 1. تثبيت المكتبات
تنفيذ الاوامر التالية في مجلد المشروع

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
### localhost ضمن مجلد المشروع الرئيسي للتشغيل على.env انشاء ملف 
```env
DATABASE_URL="postgresql://postgres:2372005@localhost:5432/twitter_db"
JWT_SECRET=privatekey123456789
NODE_ENV=development
```
### db ضمن مجلد المشروع الرئيسي للتشغيل على.env انشاء ملف 
```env
DATABASE_URL="postgresql://neondb_owner:npg_Azq42YosVSQP@ep-cold-grass-ae2tmrdy-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET=privatekey123456789
NODE_ENV=development
```
### إنشاء وجلب جداول قاعدة البيانات
```bash
npx prisma migrate dev
```
### 1. تشغيل المشروع 

```bash
npm run dev
```