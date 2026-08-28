import { generateJwt } from "@/utils/generateToken";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request:NextRequest) {
    try {
        const {email , password} = await request.json()

    if (!email || !password) {
        return NextResponse.json(
            {message:'invalid data'},
            {status:422}
        )
    }

    const exitingUser = await prisma.user.findUnique({where:{email}})
        if (!exitingUser) {
            return NextResponse.json(
                {message:'user not registered'},
                {status:403}
            )
        }

        const correntPassword = await bcrypt.compare(
            password,
            exitingUser.password
        )
        if (!correntPassword) {
            return NextResponse.json(
                {message:'invalid password'},
                {status:403}
            )
        }

        const token = generateJwt({email , id:exitingUser.id})

        

        const cookieStore = await cookies();

        cookieStore.set('jwtToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            }); 

            const userUpdate ={
                id:exitingUser.id,
                name:exitingUser.fullName,
                email:exitingUser.email,
                
            }

            return NextResponse.json(
                {message:"authenticated",user:userUpdate,token},
                {status:200}
            )
    } catch (error) {
        console.error("LOGIN_ERROR:", error);
        return NextResponse.json(
            {message:'internal server error'},
            {status:500}
        )
    }
}