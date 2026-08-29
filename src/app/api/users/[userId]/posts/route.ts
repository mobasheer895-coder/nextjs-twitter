import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
interface props {
    params:Promise<{
        userId:string
    }>
}

export async function GET(request:NextRequest,{ params }: props) {
    try {
        const userId = parseInt((await params).userId)

    const userPayload = await authenticateUser()

    if (!userPayload) {
        return NextResponse.json(
            {message:'forbidden'},
            {status:403}
        )
    }

    const user = await prisma.user.findUnique({
        where:{id:userId}
    })

    if (!user) {
            return NextResponse.json(
                {message:'user not found'},
                {status:404}
            )
        }

        const userPosts = await prisma.posts.findMany({
            where:{
                userId:userId
            },
            include:{
                user:{
                    select:{
                        fullName:true
                    }
                }
            },
            orderBy:{
                createdAt:'desc'
            }
        })

        return NextResponse.json(
            {userPosts},
            {status:200}
        )
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}