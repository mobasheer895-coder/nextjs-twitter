import { jwtPayload } from "@/utils/types";
import { verifyToken } from "@/utils/verifyToken";
import { cookies } from "next/headers";

export async function authenticateUser(): Promise<jwtPayload | null> {
  try {
    // جلب قيمة التوكن من الكوكيز
    const token = (await cookies()).get("jwtToken")?.value;
    //null اذا لم يجد التوكن يعيد
    if (!token) {
      return null;
    }

    // التحقق من صحة التوكن و استخراج البيانات منه
    const userPayload = verifyToken(token)
    //null إذا كان التوكن غير صالح يعيد 
    if (!userPayload) {
      return null;
    }
    // في حال نجاح التحقق، يتم إرجاع بيانات المستخدم   
    return userPayload;
  } catch (error) {
    return null;
  }
}