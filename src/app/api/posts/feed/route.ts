import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request:NextRequest) {
    try {
        const userPayload = await authenticateUser()

        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }

        const following = await prisma.followes.findMany({
            where:{
                followerId:userPayload.id
            },
            select:{
                followingId:true
            }
        })

const followingIds = following.map((follow: { followingId: number }) => follow.followingId);
        const feedPosts = await prisma.posts.findMany({
            where:{
                userId:{
                    in:followingIds
                }
            },
            include:{
                user:{
                    select:{
                        fullName:true,
                        email:true
                    }
                }
            },
            orderBy:{
                createdAt:'desc'
            }
        })

        return NextResponse.json(
            feedPosts,
            {status:200}
        )
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}