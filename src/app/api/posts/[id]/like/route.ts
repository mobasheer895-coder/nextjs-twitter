import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
interface props {
    params: Promise<{ id: string }>;
}
export async function POST(request:NextRequest,{params}:props) {
    try {
        // البوست Id 
        const postId = parseInt((await params).id)
        // نتأكد من ان لديه صلاحية (لديه توكن)
        const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }
        // (Id) التحقق من وجود البوست ضمن قاعدة البيانات من خلال 
        const post = await prisma.posts.findUnique({
            where:{id:postId}
        })
        // اذا كان البوست غير موجود يعيد خطأ
        if (!post) {
    return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
    )
}
    // التحقق من وجود الاعجاب من المستخدم على هذا البوست 
    const existingLike = await prisma.likes.findFirst({
        where:{
            userId:userPayload.id,
            postId:postId
        }
    })
    // اذا الاعجاب موجود على نفس البوست يعيد خطأ
    if (existingLike) {
        return NextResponse.json(
            {message:'You already liked this post'},
            {status:400}
        )
    }
    // انشاء الاعجاب من المستخدم على البوست
    const newLike = await prisma.likes.create({
        data:{
            userId:userPayload.id,
            postId:postId
        }
    })
    // ارجاع رسالة تمت العملية مع المعلومات
    return NextResponse.json({message: 'Post liked successfully', newLike} , {status:201})

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
export async function DELETE(request:NextRequest,{params}:props) {
    try {
        // نتأكد من ان لديه صلاحية (لديه توكن)
    const postId = parseInt((await params).id)
        // اذا لا يوجد توكن يعيد خطأ
        const userPayload = await authenticateUser()
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }
        // التحقق من وجود الاعجاب من المستخدم على هذا البوست 
        const existingLike = await prisma.likes.findFirst({
            where: {
                userId: userPayload.id,
                postId: postId,
            },
        })
        // اذا الاعجاب غير موجود على نفس البوست يعيد خطأ
        if (!existingLike) {  
            return NextResponse.json(
                { message: 'You have not liked this post' },
                { status: 404 }
            )
        }
        // حذف الاعجاب من المستخدم على البوست
        const deleteLike = await prisma.likes.delete({
            where:{id:existingLike.id}
        })
        // ارجاع رسالة انه تمت العملية و معلومات الحذف
        return NextResponse.json({message:'UnLiked successfully',deleteLike} , {status:200})
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