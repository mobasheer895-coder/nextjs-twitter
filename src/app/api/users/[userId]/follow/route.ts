import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = parseInt(params.userId)

        const userPayload = await authenticateUser()
        if (!userPayload) {
            return NextResponse.json(
                {message:'forbidden'},
                {status:403}
            )
        }

        if (userPayload.id == userId) {
            return NextResponse.json(
                {message:'You cannot follow yourself'},
                {status:400}
            )
        }

        const followingUser = await prisma.user.findUnique({
            where:{id:userId}
        })

        if (!followingUser) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        const existingFollow = await prisma.followes.findFirst({
            where:{
                followerId: userPayload.id,
                followingId: userId
            }
        })

        if (existingFollow) {
            return NextResponse.json(
                {message:'You are already following this user'},
                {status:400}
            )
        }

        const newFollow = await prisma.followes.create({
            data:{
                followerId: userPayload.id,
                followingId: userId
            }
        })

        return NextResponse.json({message: 'User followed successfully', newFollow} , {status:201})

    } catch (error) {
        return NextResponse.json(
            {message:'Internal server error'},
            {status:500}
        )
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        const userId = parseInt(params.userId)

        const userPayload = await authenticateUser()
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }

        const existingFollow = await prisma.followes.findFirst({
            where: {
                followerId: userPayload.id,
                followingId: userId,
            },
        })

        if (!existingFollow) {  
            return NextResponse.json(
                { message: 'You are not following this user' },
                { status: 404 }
            )
        }

        const deletefollow = await prisma.followes.delete({
            where:{id: existingFollow.id}
        })

        return NextResponse.json({message:'Unfollowed successfully', deletefollow} , {status:200})
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}