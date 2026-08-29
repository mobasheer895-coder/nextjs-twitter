import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
interface props {
    params: Promise<{ id: string }>;
}
export async function POST(request:NextRequest,{params}:props) {
    try {
        const postId = parseInt((await params).id)

        const userPayload = await authenticateUser()
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }

        const post = await prisma.posts.findUnique({
            where:{id:postId}
        })

        if (!post) {
    return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
    )
}

    const existingLike = await prisma.likes.findFirst({
        where:{
            userId:userPayload.id,
            postId:postId
        }
    })

    if (existingLike) {
        return NextResponse.json(
            {message:'You already liked this post'},
            {status:400}
        )
    }

    const newLike = await prisma.likes.create({
        data:{
            userId:userPayload.id,
            postId:postId
        }
    })

    return NextResponse.json({message: 'Post liked successfully', newLike} , {status:201})

    } catch (error) {
        return NextResponse.json(
            {message:'Internal server error'},
            {status:500}
        )
    }
}
export async function DELETE(request:NextRequest,{params}:props) {
    try {
        
    const postId = parseInt((await params).id)

        const userPayload = await authenticateUser()
        if (!userPayload) {
            return NextResponse.json(
                {message:'Unauthorized'},
                {status:401}
            )
        }

        const existingLike = await prisma.likes.findFirst({
            where: {
                userId: userPayload.id,
                postId: postId,
            },
        })

        if (!existingLike) {  
            return NextResponse.json(
                { message: 'You have not liked this post' },
                { status: 404 }
            )
        }

        const deleteLike = await prisma.likes.delete({
            where:{id:existingLike.id}
        })

        return NextResponse.json({message:'UnLiked successfully',deleteLike} , {status:200})
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}