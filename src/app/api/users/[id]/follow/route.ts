import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

interface props {
    params:Promise<{ id: string }>
}

export async function POST(request:NextRequest,{params}:props) {
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
        // اذا كان المستخدم يتابع نفس حسابه يعيد خطأ
        if (userPayload.id == userId) {
            return NextResponse.json(
                {message:'You cannot follow yourself'},
                {status:400}
            )
        }
        // التحقق من وجود المستخدم في قاعدة البيانات
        const followingUser = await prisma.user.findUnique({
            where:{id:userId}
        })
        // اذا كان المستخدم غير موجود يعيد خطأ
        if (!followingUser) {
    return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
    )
}
    // الشخص الذي سيتابعه (Id) الشخص الذي يتابع مع (Id) يبحث في قاعدة البياات عن 
    const existingFollow = await prisma.followes.findFirst({
        where:{
            followerId:userPayload.id,
            followingId:userId
        }
    })
    // اذا كان متابعه سابقا يعيد خطأ
    if (existingFollow) {
        return NextResponse.json(
            {message:'You are already following this user'},
            {status:400}
        )
    }
    // انشائ المتابعة
    const newFollow = await prisma.followes.create({
        data:{
            followerId:userPayload.id,
            followingId:userId
        }
    })
    // ارجاع رسالة بانه تمت المتابعة و قيمة المتابعة
    return NextResponse.json({message: 'User followed successfully', newFollow} , {status:201})

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
        // المستخدم Id
        const userId = parseInt((await params).id);
        // نتأكد من ان لديه صلاحية (لديه توكن)
        const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }
        // البحث عن سجل المتابعة الحالي المراد حذفه
        const existingFollow = await prisma.followes.findFirst({
            where: {
                followerId: userPayload.id,
                followingId: userId,
            },
        })
        // اذا كان متابعه سابقا يعيد خطأ
        if (!existingFollow) {  
            return NextResponse.json(
                { message: 'You are not following this user' },
                { status: 404 }
            )
        }
        // حذف المتابعة
        const deletefollow = await prisma.followes.delete({
            where:{id:existingFollow.id}
        })
        // ارجاع رسالة بانه تم الغاء المتابعة و القيمة
        return NextResponse.json({message:'Unfollowed successfully',deletefollow} , {status:200})
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