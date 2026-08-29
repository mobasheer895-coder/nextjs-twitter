import { generateJwt } from "@/utils/generateToken";
import { prisma } from "@/utils/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request:NextRequest) {
    try {
        // جلب الحقول من الريكويست
        const {email , password} = await request.json()
        // اذا احد الحقول غير موجود يعيد رسالة خطأ
        if (!email || !password) {
            return NextResponse.json(
                {message:'invalid data'},
                {status:422}
            )
        }
        // التحقق من وجود المستخدم ضمن قاعدة البيانات من خلال الايميل
        const exitingUser = await prisma.user.findUnique({where:{email}})
        // اذا المستخدم غير موجود يعيد خطأ
        if (!exitingUser) {
            return NextResponse.json(
                {message:'user not registered , please login'},
                {status:403}
            )
        }
        // مقارنة الباسوورد التي تم ادخالها مع الباسوورد الموجودة في قاعدة البيانات
        const correntPassword = await bcrypt.compare(
            password,
            exitingUser.password
        )
        // اذا لم تطابق كلمة السر يعيد خطأ
        if (!correntPassword) {
            return NextResponse.json(
                {message:'invalid password'},
                {status:403}
            )
        }
        // توليد التوكن للمستخدم
        const token = generateJwt({email , id:exitingUser.id})

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
            const userUpdate ={
                id:exitingUser.id,
                name:exitingUser.fullName,
                email:exitingUser.email,
                
            }
            // ارجاع معلومات المستخدم مع رسالة النجاح و التوكن
            return NextResponse.json(
                {message:"authenticated",user:userUpdate,token},
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