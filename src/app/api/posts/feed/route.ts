import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest) {
    try {
        // اذا لا يوجد توكن يعيد خطأ
        const userPayload = await authenticateUser()
        // اذا لا يوجد توكن يعيد خطأ
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }
        //Id جلب الاشخاص الذي يتابعهم المستخدم حسب 
        const following = await prisma.followes.findMany({
            where:{
                followerId:userPayload.id
            },
            // عرض المتابعين الذين يتابعهم 
            select:{
                followingId:true
            }
        })
        // (Id) جلب قائمة المتابعين الذين يتابعهم حسب 
        const followingIds = following.map((follow: { followingId: number }) => follow.followingId);
        // المستخدمين (Id) جلب قائمة البوستات الموجودة في قاعدة البيانات حسب 
        const feedPosts = await prisma.posts.findMany({
            where:{
                userId:{
                    in:followingIds
                }
            },
            // جلب معلومات المستخدم و عرضها
            include:{
                user:{
                    select:{
                        fullName:true,
                        email:true
                    }
                }
            },
            // ترتيب عرضهم من الاحدث الى الاقدم
            orderBy:{
                createdAt:'desc'
            }
        })
        // ارجاع قيمة البوستات
        return NextResponse.json(
            feedPosts,
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