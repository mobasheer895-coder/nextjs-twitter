import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs';
import { postSchima } from "@/utils/validationsSchema";
interface props {
    params: Promise<{ id: string }>
}

export async function GET(request:NextRequest,{params}: props) {
    try {
        // البوست Id 
        const postId  = parseInt((await params).id)
        // نتأكد من ان لديه صلاحية (لديه توكن)
        const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                {message:'forbidden'},
                {status:403}
            )
        }
        // (Id) التحقق من وجود البوست ضمن قاعدة البيانات من خلال 
        const post = await prisma.posts.findUnique({
            where:{id:postId}
        })
        // اذا كان البوست غير موجود يعيد خطأ
        if (!post) {
            return NextResponse.json(
                {message:'post not found'},
                {status:404}
            )
        }
        // اعادة قيمة البوست
        return NextResponse.json(
            {post},
            {status:200}
        )
        } catch (error) {
            return NextResponse.json(
                { 
                    message: 'internal server error', 
                    error: (error as Error).message 
                },
                {status:500}
            )
        }
}

export async function PUT(request: NextRequest, { params }: props) {
    try {
        // البوست Id 
        const postId = parseInt((await params).id)
        // نتأكد من ان لديه صلاحية (لديه توكن)
        const userPayload = await authenticateUser()
         // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }
        // (Id) التحقق من وجود البوست ضمن قاعدة البيانات من خلال 
        const post = await prisma.posts.findUnique({
            where: { id: postId }
        })
        // اذا كان البوست غير موجود يعيد خطأ
        if (!post) {
            return NextResponse.json(
                { message: 'post not found' },
                { status: 404 }
            )
        }
        // اذا لم يكن صاحب البوست هو الذي يعدل سيعيد اليه خطأ
        if (post.userId !== userPayload.id) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }
        //(content-type) جلب نوع البيانات ليكون 
        const contentType = request.headers.get('content-type')
        // يعيد له خطأ (content-type , multipart/form-data) اذا لم يكون نوع البيانات
        if (!contentType?.includes('multipart/form-data')) {
            return NextResponse.json(
                { message: 'invalid form data' },
                { status: 400 }
            )
        }
        // جلب الفورم داتا 
        const formData = await request.formData()
        // جلب وصف البوست من الفورم داتا بنوع نصي
        const description = formData.get('description')?.toString()
        // جلب الصورة من الفورم داتا بنوع ملف
        const imageFile = formData.get('imageFile') as File
        // فحص البيانات المُدخلة للتأكد من مطابقتها للشروط
        const validition = postSchima.safeParse({description})
                // اذا لم تطابق الشروط تعيد رسالة الخطأ
                if (!validition.success) {
                    return NextResponse.json(
                        { message: validition.error.issues[0].message },
                        { status: 400 }
                    );
                }
                // متغير لحفظ انواع الملفات المسموحة
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
                // اكبر حجم مسموح به للملف
        const maxSize = 2 * 1024 * 1024
        // متغير حفظ مسار الصورة
        let imagePath = post.imagePost;
                // التحقق من وجود الصورة
        if (imageFile) {
            // اذا كانت موجودة و نوعها لا يطابق الانواع المسموح بها سيعيد خطأ
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json(
                    { message: 'invalid type' },
                    { status: 400 }
                )
            }
            // اذا حجم الصورة المرفقة اكبر من الحجم المسموح به يعيد خطأ
            if (imageFile.size > maxSize) {
                return NextResponse.json(
                    { message: `max size exceeds the limit of ${maxSize / 1024 / 1024}MB` },
                    { status: 400 }
                )
            }
            // يذهب الى اساس المشروع ثم الى المسار الموجود و يدمج المسارين معا
            const uploadDir = path.join(process.cwd(), 'public/uploads')
            // اذا لم يكن المجلد موجود ضمن المسار سوف ينشئه
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }
            // اسم الصورة عند تخزينها يكون وقت رفع الصورة ثم (_) ثم اسم الصورة التي رفعت
            const fileName = `${Date.now()}_${imageFile.name}`
             // مسارها يكون مسار المجلدات و بعده اسم الصورة الكامل
            const filePath = path.join(uploadDir, fileName)
            // تحويل الملف المرفوع الى مصفوفة بايتات 0 و 1
            const buffer = Buffer.from(await imageFile.arrayBuffer())
            // كتابة وحفظ ملف الصورة
            fs.writeFileSync(filePath, new Uint8Array(buffer))
            // مسار الصورة اذا تم رفعها
            imagePath = `/uploads/${fileName}`;
        }
        // الخاص به (Id) تعديل البوست في قاعدة البيانات من خلال 
        const updatePost = await prisma.posts.update({
            where: { id: postId },
            data: { description, imagePost: imagePath }
        })
        // ارجاع قيمة البوست بعد التعديل مع رسالة انه تم بنجاح
        return NextResponse.json(
            {updatePost , message:'updated Post'},
            { status: 200 })
    } catch (error) {
    return NextResponse.json(
        { 
            message: 'internal server error', 
            error: (error as Error).message 
        },
        { status: 500 }
    )
    }
}

export async function DELETE(request: NextRequest, { params }: props) {
    try {
        // البوست Id 
        const postId = parseInt((await params).id)
        // نتأكد من ان لديه صلاحية (لديه توكن)
        const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }
        // (Id) التحقق من وجود البوست ضمن قاعدة البيانات من خلال 
        const post = await prisma.posts.findUnique({
            where: { id: postId }
        })
        // اذا كان البوست غير موجود يعيد خطأ
        if (!post) {
            return NextResponse.json(
                { message: 'post not found' },
                { status: 404 }
            )
        }
        // اذا لم يكن صاحب البوست هو الذي يحذف سيعيد اليه خطأ
        if (post.userId !== userPayload.id) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }
        // الخاص به (Id) حذف البوست في قاعدة البيانات من خلال 
        const deletePost = await prisma.posts.delete({
            where:{id:postId}
        })
        // يعيد القيمة (رسالة تأكيد الحذف مع قيمة البوست الذي تم حذفه)
        return NextResponse.json({message:'deleted post',deletePost} , {status:200})
    } catch (error) {
        return NextResponse.json(
            { 
                message: 'internal server error', 
                error: (error as Error).message 
            },
            {status:500}
        )
    }
}