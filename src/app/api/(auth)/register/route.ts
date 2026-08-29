import { generateJwt } from "@/utils/generateToken";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request:NextRequest) {
    try {
        // جلب الحقول من الريكويست
        const {name , email , password} = await request.json()
        // اذا احد الحقول غير موجود يعيد رسالة خطأ
        if (!name || !email || !password) {
            return NextResponse.json({message:'invalid DAta'} , {status:422})
        }
        // التحقق من وجود المستخدم ضمن قاعدة البيانات من خلال الايميل
        const exitingUser = await prisma.user.findUnique({where:{email}})
        // اذا المستخدم موجود يعيد خطأ
        if (exitingUser) {
            return NextResponse.json(
                {message:'user already regestared , please login'},
                {status:403}
            )
        }
        //(password) تشفير
        const hashedPassword = await bcrypt.hash(password,10)
        // انشاء المستخدم مع تشفير كلمة السر
        const user = await prisma.user.create({
            data:{fullName:name , email , password:hashedPassword}
        })
        // اذا المستخدم لم يتم انشائه يعيد خطأ
        if (!user) {
            return NextResponse.json(
                {message:'user not found'} ,
                {status:404})
        }
        // توليد التوكن للمستخدم
        const token = generateJwt({email , id:user.id})
        // حفظ المعلومات ضمن الكوكيز
        const cookieStore = await cookies();
        
            cookieStore.set('jwtToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            });
            // المعلومات التي سيعيدها للمستخدم
            const userRequest = {
                id:user.id,
                name: user.fullName,
                email:user.email,
                
            }
            // ارجاع القيمة
            return NextResponse.json(
                {userRequest , message:'registered & authenticated' , token},
                {status:201}
            )
    } catch (error) {
        return NextResponse.json(
            { 
                message: 'internal server error', 
                error: (error as Error).message 
            },
            {status:500})
    }
}