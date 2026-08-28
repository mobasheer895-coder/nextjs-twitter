import jwt from "jsonwebtoken";
import { jwtPayload } from "./types";

export function verifyToken(token:string | null): jwtPayload | null {
    try {
        if (!token) {
            return null
        }

        const privateKey = process.env.JWT_SECRET as string
        const userPayload = jwt.verify(token,privateKey) as jwtPayload
        return userPayload
    } catch (error) {
        return null
    }
}