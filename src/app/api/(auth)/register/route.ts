import { generateJwt } from "@/utils/generateToken";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request:NextRequest) {
    try {
        const {name , email , password} = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json({message:'invalid DAta'} , {status:422})
        }

        const exitingUser = await prisma.user.findUnique({where:{email}})
        if (exitingUser) {
            return NextResponse.json(
                {message:'user already regestared , please login'},
                {status:403}
            )
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const user = await prisma.user.create({
            data:{fullName:name , email , password:hashedPassword}
        })
        const token = generateJwt({email , id:user.id})

        const cookieStore = await cookies();
        
            cookieStore.set('jwtToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            });

            if (!user) {
                return NextResponse.json(
                    {message:'user not found'} ,
                    {status:404})
            }
            const userRequest = {
                id:user.id,
                name: user.fullName,
                email:user.email,
                
            }

            return NextResponse.json(
                {userRequest , message:'registered & authenticated' , token},
                {status:201}
            )
    } catch (error) {
        return NextResponse.json({message:'intenal server error'} , {status:500})
    }
}