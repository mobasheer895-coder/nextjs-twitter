import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
interface props {
    params:Promise<{
        id:string
    }>
}

export async function GET(request:NextRequest,{ params }: props) {
    try {
        // المستخدم Id
        const userId = parseInt((await params).id)
        // نتأكد من ان لديه صلاحية (لديه توكن)
    const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
    if (!userPayload) {
        return NextResponse.json(
            {message:'forbidden'},
            {status:403}
        )
    }
    // (Id) التحقق من وجود المستخدم ضمن قاعدة البيانات من خلال 
    const user = await prisma.user.findUnique({
        where:{id:userId}
    })
    // اذا كان المستخدم غير موجود يعيد خطأ
    if (!user) {
            return NextResponse.json(
                {message:'user not found'},
                {status:404}
            )
        }
        // المستخدم (Id) عرض البوستات حسب 
        const userPosts = await prisma.posts.findMany({
            where:{
                userId:userId
            },
            // يعرض معلومات المستخدم من جدول المستخدمين
            include:{
                user:{
                    select:{
                        fullName:true
                    }
                }
            },
            // يكون بترتيب من الاحدث الى الاقدم
            orderBy:{
                createdAt:'desc'
            }
        })
        // ارجاع قيمة بوستات المتسخدم
        return NextResponse.json(
            {userPosts},
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