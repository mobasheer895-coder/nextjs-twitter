import { authenticateUser } from "@/app/midelware/authenticateUser";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs';
import { buffer } from "stream/consumers";
import { postSchima } from "@/utils/validationsSchema";
interface props {
    params: { id: string }
}

export async function GET(request:NextRequest,{params}:props) {
    try {

        const postId = parseInt((await params).id)

        const userPayload = await authenticateUser()

        if (!userPayload) {
            return NextResponse.json(
                {message:'forbidden'},
                {status:403}
            )
        }

        const post = await prisma.posts.findUnique({
            where:{id:postId}
        })

        if (!post) {
            return NextResponse.json(
                {message:'post not found'},
                {status:404}
            )
        }

        return NextResponse.json(
            {post},
            {status:200}
        )
        } catch (error) {
            return NextResponse.json(
                {message:'internal server error'},
                {status:500}
            )
        }
}

export async function PUT(request: NextRequest, { params }: props) {
    try {
const postId = parseInt((await params).id)

        const userPayload = await authenticateUser()

        if (!userPayload) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }

        const post = await prisma.posts.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return NextResponse.json(
                { message: 'post not found' },
                { status: 404 }
            )
        }

        if (post.userId !== userPayload.id) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }

        const contentType = request.headers.get('content-type')
        if (!contentType?.includes('multipart/form-data')) {
            return NextResponse.json(
                { message: 'invalid form data' },
                { status: 400 }
            )
        }

        const formData = await request.formData()

        const description = formData.get('description')?.toString()

        const imageFile = formData.get('imageFile') as File

        const validition = postSchima.safeParse({description})
        
                if (!validition.success) {
                    return NextResponse.json(
                        { message: validition.error.issues[0].message },
                        { status: 400 }
                    );
                }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg']

        const maxSize = 2 * 1024 * 1024
        let imagePath = post.imagePost;

        if (imageFile) {
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json(
                    { message: 'invalid type' },
                    { status: 400 }
                )
            }
            if (imageFile.size > maxSize) {
                return NextResponse.json(
                    { message: `max size exceeds the limit of ${maxSize / 1024 / 1024}MB` },
                    { status: 400 }
                )
            }

            const uploadDir = path.join(process.cwd(), 'public/uploads')
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            const fileName = `${Date.now()}_${imageFile.name}`

            const filePath = path.join(uploadDir, fileName)

            const buffer = Buffer.from(await imageFile.arrayBuffer())

            fs.writeFileSync(filePath, new Uint8Array(buffer))
            imagePath = `/uploads/${fileName}`;
        }

        const updatePost = await prisma.posts.update({
            where: { id: postId },
            data: { description, imagePost: imagePath }
        })

        return NextResponse.json(updatePost, { status: 200 })
    } catch (error) {
        console.log("Error Details:", error) // اطبع الخطأ في Terminal السيرفر
    return NextResponse.json(
        { message: 'internal server error', error: String(error) },
        { status: 500 }
    )
    }
}

export async function DELETE(request: NextRequest, { params }: props) {
    try {
        const postId = parseInt((await params).id)

        const userPayload = await authenticateUser()

        if (!userPayload) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }

        const post = await prisma.posts.findUnique({
            where: { id: postId }
        })

        if (!post) {
            return NextResponse.json(
                { message: 'post not found' },
                { status: 404 }
            )
        }

        if (post.userId !== userPayload.id) {
            return NextResponse.json(
                { message: 'forbidden' },
                { status: 403 }
            )
        }

        const deletePost = await prisma.posts.delete({
            where:{id:postId}
        })

        return NextResponse.json({message:'deleted post',deletePost} , {status:200})
    } catch (error) {
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}