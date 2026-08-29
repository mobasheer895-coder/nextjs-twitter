import { authenticateUser } from "@/app/midelware/authenticateUser";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs';
import { prisma } from "@/utils/prisma";
import { postSchima } from "@/utils/validationsSchema";

export async function POST(request:NextRequest) {
    try {
        const user = await authenticateUser()
    if (!user) {
        return NextResponse.json({message:'Unauthorized: Please login first'} , {status:401})
    }

    // يذهب الى اساس المشروع ثم الى المسار الموجود و يدمج المسارين معا
        const uploadDir = path.join(process.cwd(),'/public/uploads')
        // من اجل انواع ملفات المسموح رفعها
        const allowedTypes = ['image/jpeg' , 'image/png' , 'image/webp' , 'image/jpg']
        // (2MB) اكبر حجم للملف هو 
        const maxSize = 2 * 1024 * 1024
        // اذا لم يكن المجلد موجود ضمن المسار سوف ينشئه
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir,{recursive:true})
        }

        //requestمن ال formData جلب
        const formData = await request.formData()
        //formData جلب الصورة من ال
        const imageFile = formData.get('image') as File
        //formDataجلب البوست من ال
        const description = formData.get('description')?.toString() || ''
        //formDataمن ال idجلب ال
        const userId = parseInt(formData.get('userId')?.toString()||'0')
        // اذا كان احدهم غير موجود ارسل له رسالة خطأ
        if (!userId) {
            return NextResponse.json(
                {message:'userId is required'},
                {status:422}
            )
        }
        const validition = postSchima.safeParse({description})

        if (!validition.success) {
            return NextResponse.json(
                { message: validition.error.issues[0].message },
                { status: 400 }
            );
        }
        //( null إذا لم يتم رفع صورة تكون) قيمة مبدئية لاسم الملف 
        let fileName: string | null = null;
        // يفحص إذا تم إرسال صورة بالفعل قبل التأكد من نوعها وحجمها
        if (imageFile && imageFile.size > 0 && imageFile.name) {
            // يفحص اذا الصورة التي تم رفعها ليست من ضمن الانواع المسموحة
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json(
                    // عرض رسالة ان النوع خاطئ و يعرض مصفوفة الانواع المسموحة و بينهم فاصلة
                    { message: `invalid file type. allowed types : ${allowedTypes.join(', ')}` },
                    { status: 400 }
                )
            }


        // اذا كانت الصورة المرفوعة اكبر من الحجم المسموح تعيد رسالة فيها نص و الحجم المسموح
        if (imageFile.size > maxSize) {
            return NextResponse.json(
                {message:`max size exceeds the limit of ${maxSize / 1024 / 1024}MB`},
                {status:400}
            )
        }
    
        // اسم الصورة عند تخزينها يكون وقت رفع الصورة ثم (_) ثم اسم الصورة التي رفعت
        fileName = `${Date.now()}_${imageFile.name}`
        // مسارها يكون مسار المجلدات و بعده اسم الصورة الكامل
        const filePath = path.join(uploadDir , fileName)
        // تحويل الملف المرفوع الى مصفوفة بايتات 0 و 1
        const buffer = Buffer.from(await imageFile.arrayBuffer())
        // تقرئ ملف الصورةو تحوله الى مصفوفات بايتات
        fs.writeFileSync(filePath,new Uint8Array(buffer))
    }
    // التحقق من وجود المستخدم 
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        })
        // اذا لم يكن المستخدم موجود
        if (!existingUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // انشاء البوست في قاعدة البيانات
        const createdPost = await prisma.posts.create({
            data:{
                description,
                imagePost:fileName ?`/uploads/${fileName}`:null,
                userId:userId
            }
        })

        return NextResponse.json(
            {tweet:createdPost},
            {status:201}
        )
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}

export async function GET(request:NextRequest) {
    try {
    // يأخذ الرابط كامل ضمن الريكويست و يحلله الى اقسام و يلتقط ما بعد (؟)
    const {searchParams} = new URL(request.url)
    //search ما بعد (؟) يأخذ المفتاح الذي يحمل اسم 
    const search = searchParams.get('search') || ''
    // الذهاب لقاعدة البيانات لعرض التغريدات
    const posts = await prisma.posts.findMany({
        //و تعرضه و تكون غير حساسة لحالة الاحرف urlالشرط تأخذ الموجود ضمن ال
        where:{
            description:{
                contains:search,
                mode:'insensitive'
            }
        },
        // يكون ترتيب تنازلي حسب انشاء التغريدة
        orderBy:{
            createdAt:'desc'
        },
        // من جدول المستخدمين تعرض اسم المستخدم
        include:{
            user:{
                select:{
                    fullName:true
                }
            }
        }
    })

    return NextResponse.json(
        {data:posts},
        {status:200}
    )


    } catch (error: any) {
  return NextResponse.json(
    { message: "internal server error", error: error.message || String(error) },
    { status: 500 }
  );
}
}