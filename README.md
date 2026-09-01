# Twitter Backend API
---

## أولاً: إعداد المشروع

###  تثبيت المكتبات
تنفيذ الاوامر التالية في مجلد المشروع

```bash
npm install

# 1. Prisma
npm install @prisma/client @prisma/adapter-pg pg dotenv
npm install --save-dev prisma @types/node @types/pg

# 2. jsonwebtoken   
npm install jsonwebtoken @types/jsonwebtoken

# 3. bcryptjs
npm install bcryptjs  @types/bcryptjs

# 3. zod
npm install zod
```
### localhost ضمن مجلد المشروع الرئيسي للتشغيل على.env ثانياً : انشاء ملف 
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/twitter_db"
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### ثالثاً : إنشاء وجلب جداول قاعدة البيانات 
```bash
npx prisma migrate dev
```
### رابعاً : تشغيل المشروع 

```bash
npm run dev
```